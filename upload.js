/*
 * src: arale/upload
 */

'use strict'

var $ = require('jquery')
var compress = require('./lib/compress')
var iframeCount = 0
function Uploader(options) {
    if (!(this instanceof Uploader)) {
        return new Uploader(options)
    }
    if (isString(options)) {
        options = {trigger: options}
    }
    var settings = {
        trigger: null,
        name: null,
        action: null,
        data: null,
        accept: null,
        multiple: true,
        change: null,
        error: null,
        success: null,
        progress: null,
        suffix: null,
        compress: null
    }
    if (options) {
        $.extend(settings, options)
    }
    var $trigger = $(settings.trigger).eq(0)

    // support basic data-api
    settings.action = settings.action || $trigger.data('action') || '/upload'
    settings.name = settings.name || $trigger.attr('name') || $trigger.data('name') || 'file'
    settings.data = settings.data || parse($trigger.data('data'))
    settings.accept = settings.accept || $trigger.data('accept')
    settings.suffix = settings.suffix || $trigger.data('suffix')
    settings.compress = settings.compress || parse($trigger.data('compress'))
    settings.success = settings.success || $trigger.data('success')
    this.settings = settings

    this.setup()
    this.bind()
}

// initialize
// create input, form, iframe
Uploader.prototype.setup = function () {
    this.form = $(
        '<form method="post" enctype="multipart/form-data"'
        + 'target="" action="' + this.settings.action + '" />'
    )

    var data = this.settings.data
    this.form.append(createInputs(data))
    if (window.FormData) {
        this.form.append(createInputs({'_uploader_': 'formdata'}))
    } else {
        this.form.append(createInputs({'_uploader_': 'iframe'}))
    }

    var input = document.createElement('input')
    input.type = 'file'
    input.name = this.settings.name
    if (this.settings.accept) {
        input.accept = this.settings.accept
    }
    if (this.settings.multiple) {
        input.multiple = true
        input.setAttribute('multiple', 'multiple')
    }
    this.input = $(input)

    var $trigger = $(this.settings.trigger)
    this.input.attr('hidefocus', true).css({
        position: 'absolute',
        top: 0,
        right: 0,
        opacity: 0,
        outline: 0,
        cursor: 'pointer',
        height: $trigger.outerHeight(),
        fontSize: Math.max(64, $trigger.outerHeight() * 5)
    })
    this.form.append(this.input)
    this.form.css({
        position: 'absolute',
        top: $trigger.offset().top,
        left: $trigger.offset().left,
        overflow: 'hidden',
        width: $trigger.outerWidth(),
        height: $trigger.outerHeight(),
        zIndex: findzIndex($trigger) + 10
    }).appendTo('body')
    return this
}

// bind events
Uploader.prototype.bind = function () {
    var self = this
    var $trigger = $(self.settings.trigger)
    $trigger.mouseenter(function () {
        self.form.css({
            top: $trigger.offset().top,
            left: $trigger.offset().left,
            width: $trigger.outerWidth(),
            height: $trigger.outerHeight()
        })
    })
    self.bindInput()
}

Uploader.prototype.bindInput = function () {
    var self = this
    self.input.change(function(e) {

        // ie9- don't support FileList Object
        self._files = this.files || [{
            name: e.target.value
        }]
        var file = self.input.val()

        // 根据文件后缀进行过滤
        var files = self._files
        var suffix = ''
        for (var i = 0; i < files[i].length; i++) {
            suffix = files[i].name.split('.').pop()
            if (self.settings.suffix.indexOf(suffix) === -1) {
                if (self.settings.error) {
                    self.settings.error(new Error('type error'))
                }
                return
            }
        }

        if (self.settings.change) {
            self.settings.change.call(self, self._files)
        } else if (file) {
            self.submit()
        }
    })
}

// handle submit event
// prepare for submiting form
Uploader.prototype.submit = function () {
    var self = this
    if (window.FormData && self._files) {

        // use FormData to upload
        // upyun server do not support multiple files upload
        var files = self._files
        var len = files.length
        self.input.prop('disabled', true)
        var form = new FormData(self.form.get(0))
        self.input.prop('disabled', false)

        for (var i = 0; i < len; i++) {
            compress(files[i], self.settings.compress).then(function (response) {
                form.append(self.settings.name, response.blob, response.fileName)
                $.ajax({
                    url: self.settings.action,
                    type: 'post',
                    processData: false,
                    contentType: false,
                    data: form,
                    context: this,
                    xhr: function () {
                        var xhr = $.ajaxSettings.xhr()
                        if (xhr.upload) {
                            xhr.upload.addEventListener('progress', function(event) {
                                var percent = 0
                                var position = event.loaded || event.position
                                var total = event.total
                                if (event.lengthComputable) {
                                        percent = Math.ceil(position / total * 100)
                                }
                                self.settings.progress(event, position, total, percent, response.fileName)
                            }, false)
                        }
                        return xhr
                    },
                    success: function (data) {
                        if (self.settings.success) {
                            self.settings.success(data, response.fileName)
                        }
                    },
                    error: function (xhr, textStatus, errorMsg) {
                        if (self.settings.error) {
                            self.settings.error(new Error(errorMsg), response.fileName)
                        }
                    }
                })
            })['catch'](function (err) {
                if (self.settings.error) {
                    self.settings.error(new Error(err.message))
                }
            })
        }
        return this
    } else {

        // iframe upload
        self.iframe = newIframe()
        self.form.attr('target', self.iframe.attr('name'))
        self.iframe.data('fileName', self._files[0].name)
        $('body').append(self.iframe)
        self.iframe.one('load', function () {

            // Fix for IE endless progress bar activity bug
            // (happens on form submits to iframe targets):
            $('<iframe src="javascript:false;"></iframe>')
                .appendTo(self.form)
                .remove()
            var response
            try {
                response = $.trim($(this).contents().find("body").html())
            } catch (e) {
                if (self.settings.error) {
                    self.settings.error(new Error('cross domain'))
                }
            }
            if (response) {
                if (self.settings.success) {
                    self.settings.success(response, this.data('fileName'))
                }
            }
            self.iframe.remove()
        })
        self.form.submit()
    }
    return this
}

Uploader.prototype.refreshInput = function () {

    //replace the input element, or the same file can not to be uploaded
    var newInput = this.input.clone()
    this.input.before(newInput)
    this.input.off('change')
    this.input.remove()
    this.input = newInput
    this.bindInput()
}

// handle change event
// when value in file input changed
Uploader.prototype.change = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.change = callback
    return this
}

// handle when upload success
Uploader.prototype.success = function(callback) {
    var me = this
    this.settings.success = function(response, fileName) {
        me.refreshInput()
        if (callback) {
            callback(response, fileName)
        }
    }
    return this
}

// handle when upload error
Uploader.prototype.error = function(callback) {
    var me = this
    this.settings.error = function(response, fileName) {
        if (callback) {
            me.refreshInput()
            callback(response, fileName)
        }
    }
    return this
}

// add progress
Uploader.prototype.progress = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.progress = callback
    return this
}

// enable
Uploader.prototype.enable = function () {
    this.input.prop('disabled', false)
    this.input.css('cursor', 'pointer')
}

// disable
Uploader.prototype.disable = function () {
    this.input.prop('disabled', true)
    this.input.css('cursor', 'not-allowed')
}

// Helpers
// -------------

function isString(val) {
    return Object.prototype.toString.call(val) === '[object String]'
}

function createInputs(data) {
    if (!data) return []

    var inputs = [], i
    for (var name in data) {
        i = document.createElement('input')
        i.type = 'hidden'
        i.name = name
        i.value = data[name]
        inputs.push(i)
    }
    return inputs
}

function parse(str) {
    if (!str) return {}
    var ret = {}

    var pairs = str.split('&')
    var unescape = function(s) {
        return decodeURIComponent(s.replace(/\+/g, ' '))
    }

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=')
        var key = unescape(pair[0])
        var val = unescape(pair[1])
        ret[key] = val
    }

    return ret
}

function findzIndex($node) {
    var parents = $node.parentsUntil('body')
    var zIndex = 0
    for (var i = 0; i < parents.length; i++) {
        var item = parents.eq(i)
        if (item.css('position') !== 'static') {
            zIndex = parseInt(item.css('zIndex'), 10) || zIndex
        }
    }
    return zIndex
}

function newIframe() {
    var iframeName = 'iframe-uploader-' + iframeCount
    var iframe = $('<iframe name="' + iframeName + '" />').hide()
    iframeCount += 1
    return iframe
}

module.exports = Uploader
