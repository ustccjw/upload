/*
 * Base on arale/upload
 */

'use strict'

var compress = require('./compress')
var iframeCount = 0

function Upload(options) {
    if (!(this instanceof Upload)) {
        return new Upload(options)
    }
    if (!$.isPlainObject(options)) {
        options = {}
    }
    var settings = {
        trigger: null,
        name: null,
        action: null,
        accept: null,
        data: null,
        multiple: true,
        change: null,
        error: null,
        success: null,
        progress: null,
        suffix: null,
        compress: null
    }
    $.extend(settings, options)
    this.settings = settings

    this.setup()
    this.bind()
}

// initialize
// create input, form, iframe
Upload.prototype.setup = function () {
    this.form = $(
        '<form method="post" enctype="multipart/form-data"'
        + 'target="" action="' + this.settings.action + '" />'
    )

    var data = this.settings.data
    this.form.append(createInputs(data))

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
Upload.prototype.bind = function () {
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

Upload.prototype.bindInput = function () {
    var self = this
    self.files = []
    self.input.change(function(e) {
        self.files = []

        // ie9- don't support FileList Object
        var files = this.files || [{
            name: e.target.value.split('\\').pop()
        }]

        // 根据文件后缀进行过滤
        var suffix = ''
        for (var i = 0; i < files.length; i++) {
            suffix = files[i].name.split('.').pop()
            if (self.settings.suffix.indexOf(suffix) === -1) {
                if (self.settings.error) {
                    self.settings.error(new Error('type error'), files[i].name)
                }
            } else {
                self.files.push(files[i])
            }
        }

        // no accept suffix
        if (!self.files.length) {
            return
        }
        if (self.settings.change) {
            self.settings.change.call(self, self.files)
        } else {
            self.submit()
        }
    })
}

// handle submit event
// prepare for submiting form
Upload.prototype.submit = function () {
    if (window.FormData) {
        this.ajaxSubmit()
    } else {
        this.formSubmit()
    }
}

Upload.prototype.ajaxSubmit = function () {
    var self = this

    // upyun server do not support multiple files upload
    var files = self.files
    self.input.prop('disabled', true)
    var form = new FormData(self.form.get(0))
    self.input.prop('disabled', false)

    for (var i = 0; i < files.length; i++) {
        (function (file) {
            compress(file, self.settings.compress)['catch'](function (err) {

                // compress failed
                if (self.settings.error) {
                    self.settings.error(new Error('compress error'), file.name)
                }
            }).then(function (blob) {
                blob = blob || file
                form.append(self.settings.name, blob, file.name)
                $.ajax({
                    url: self.settings.action,
                    type: 'post',
                    processData: false,
                    contentType: false,
                    data: form,
                    xhr: function () {
                        var xhr = $.ajaxSettings.xhr()
                        if (xhr.upload && self.settings.progress) {
                            xhr.upload.addEventListener('progress', function(event) {
                                var percent = 0
                                var position = event.loaded || event.position
                                var total = event.total
                                if (event.lengthComputable) {
                                    percent = Math.ceil(position / total * 100)
                                }
                                self.settings.progress(event, position, total, percent, file.name)
                            }, false)
                        }
                        return xhr
                    },
                    success: function (data) {
                        if (self.settings.success) {
                            self.settings.success(data, file.name)
                        }
                    },
                    error: function (xhr, textStatus, errorMsg) {
                        if (self.settings.error) {
                            self.settings.error(new Error(errorMsg), file.name)
                        }
                    }
                })
            })
        })(files[i])
    }
}

Upload.prototype.formSubmit = function () {
    var self = this
    self.iframe = newIframe()
    self.form.attr('target', self.iframe.attr('name'))
    self.iframe.data('fileName', self.files[0].name)
    $('body').append(self.iframe)
    self.iframe.one('load', function () {

        // Fix for IE endless progress bar activity bug
        // (happens on form submits to iframe targets):
        $('<iframe src="javascript:false;"></iframe>')
            .appendTo(self.form)
            .remove()
        var response = ''
        try {
            response = $.trim($(this).contents().find("body").html())
        } catch (e) {
            if (self.settings.error) {
                self.settings.error(new Error('cross domain'), $(this).data('fileName'))
            }
        }
        if (response) {
            if (self.settings.success) {
                self.settings.success(response, $(this).data('fileName'))
            }
        }
        self.iframe.remove()
    })
    self.form.submit()
}

Upload.prototype.refreshInput = function () {

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
Upload.prototype.change = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.change = callback
    return this
}

// handle when upload success
Upload.prototype.success = function(callback) {
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
Upload.prototype.error = function(callback) {
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
Upload.prototype.progress = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.progress = callback
    return this
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
    var iframeName = 'iframe-Upload-' + iframeCount
    var iframe = $('<iframe name="' + iframeName + '" />').hide()
    iframeCount += 1
    return iframe
}

module.exports = Upload
