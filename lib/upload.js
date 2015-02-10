/*
 * Base on arale/upload
 * error message: 'extension error/compress error: xxxx/upload error: xxxx'
 * error will call settings.error function
 * extension error will only stop uploading current file, if multiple is valid, other files will be continue to upload
 * Compress error only do not compress, do not stop uploading
 */

'use strict'

var ES6Promise = require('es6-promise')
var compress = require('./compress')

ES6Promise.polyfill()
var iframeCount = 0
var TIME = 10000

/**
 * Upload constructor
 * @param {Object} options config
 */
function Upload(options) {
    if (!(this instanceof Upload)) {
        return new Upload(options)
    }
    if (typeof options !== 'object') {
        options = {}
    }
    var settings = {
        trigger: null,
        name: 'file',
        action: '/upload',
        accept: null,
        data: null,
        multiple: true,
        change: null,
        error: null,
        success: null,
        progress: null,
        extension: null,
        compress: null
    }
    $.extend(settings, options)
    this.settings = settings

    this.setup()
    this.bind()
}

/**
 * init hidden form contains hidden input(settings.data) and file input
 */
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
}

/**
 * bind the trigger element to hidden form
 */
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

/**
 * handle file input change event
 * it will be filtered via extension
 */
Upload.prototype.bindInput = function () {
    var self = this
    self.files = []
    self.input.change(function(e) {
        self.files = []

        // ie9- don't support FileList Object
        var files = this.files || [{
            name: e.target.value.split('\\').pop()
        }]

        // filter via extension
        if (self.settings.extension) {
            var extensionArr = self.settings.extension.split(',')
            extensionArr = $.map(extensionArr, function (value, key) {
                return $.trim(value)
            })
            for (var i = 0; i < files.length; i++) {
                if ($.inArray(files[i].name.split('.').pop(), extensionArr) !== -1) {
                    self.files.push(files[i])
                } else {
                    if (self.settings.error) {
                        self.settings.error(new Error('extension error'), files[i].name)
                    }
                }
            }
        }

        // no accept extension
        if (!self.files.length) {
            self.refreshInput()
            return
        }
        if (self.settings.change) {
            self.settings.change.call(self, self.files)
        } else {
            self.submit()
        }
    })
}

/**
 * upload file to serevr
 * use ajax or form
 */
Upload.prototype.submit = function () {
    if (window.FormData) {
        this.ajaxSubmit()
    } else {
        this.formSubmit()
    }
}

/**
 * upload file by ajax
 * it will be compressed
 * success or error will trigger callback function
 */
Upload.prototype.ajaxSubmit = function () {
    var self = this

    // upyun server do not support multiple files upload
    var files = self.files
    self.input.prop('disabled', true)
    var form = new FormData(self.form.get(0))
    self.input.prop('disabled', false)

    var promiseArr = []
    $.each(files, function (index, file) {
        var promise = compress(file, self.settings.compress)['catch'](function (err) {

            // compress failed
            if (self.settings.error) {
                self.settings.error(new Error('compress error: ' + err.message), file.name)
            }
        }).then(function (blob) {
            blob = blob || file
            form.append(self.settings.name, blob, file.name)
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: self.settings.action,
                    type: 'post',
                    processData: false,
                    contentType: false,
                    data: form,
                    timeout: TIME,
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
                        resolve()
                    },
                    error: function (xhr, textStatus) {
                        if (self.settings.error) {
                            self.settings.error(new Error('upload error: ' + textStatus), file.name)
                        }
                        resolve()
                    }
                })
            })
        })
        promiseArr.push(promise)
    })

    // upload finished then refresh
    Promise.all(promiseArr).then(function () {
        self.refreshInput()
    })
}

/**
 * upload file by form submit
 * success or error will trigger callback function
 */
Upload.prototype.formSubmit = function () {
    var self = this
    self.iframe = newIframe()
    self.form.attr('target', self.iframe.attr('name'))
    self.iframe.data('fileName', self.files[0].name)
    $('body').append(self.iframe)
    var timer = null
    self.iframe.one('load', function () {
        clearTimeout(timer)

        // Fix for IE endless progress bar activity bug
        // (happens on form submits to iframe targets):
        $('<iframe src="javascript:false;"></iframe>')
            .appendTo(self.form)
            .remove()
        var response = null
        try {
            response = $.trim($(this).contents().find("body").html())
        } catch (e) {
            if (self.settings.error) {
                self.settings.error(new Error('upload error: cross domain'), $(this).data('fileName'))
            }
        } finally {
            if (response !== null && self.settings.success) {
                self.settings.success(response, $(this).data('fileName'))
            }

            // upload finished then refresh
            self.refreshInput()
            self.iframe.remove()
        }
    })
    self.form.submit()
    timer = setTimeout(function () {
        if (self.settings.error) {
            self.settings.error(new Error('upload error: timeout'), $(this).data('fileName'))
        }

        // upload finished then refresh
        self.refreshInput()
        self.iframe.remove()
    }, TIME)
}

/**
 * replace the input element
 * or the same file can not to be uploaded
 */
Upload.prototype.refreshInput = function () {
    var newInput = this.input.clone()
    this.input.before(newInput)
    this.input.off('change')
    this.input.remove()
    this.input = newInput
    this.bindInput()
}

/**
 * set settings.change
 * @param  {Function} callback override settings.change
 * @return {Object}            upload object
 */
Upload.prototype.change = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.change = callback
    return this
}

/**
 * set settings.success
 * @param  {Function} callback override settings.success
 * @return {Object}            upload object
 */
Upload.prototype.success = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.success = callback
    return this
}

/**
 * set settings.error
 * @param  {Function} callback override settings.error
 * @return {Object}            upload object
 */
Upload.prototype.error = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.error = callback
    return this
}

/**
 * set settings.progress
 * @param  {Function} callback override settings.progress
 * @return {Object}            upload object
 */
Upload.prototype.progress = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.progress = callback
    return this
}

/**
 * create hidden input for data
 * @param  {Object} data settings.data
 * @return {Array}       array of hidden input
 */
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

/**
 * find the parents
 * @param  {jQueryElement} $node
 * @return {number}               parents max zIndex + 10
 */
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

/**
 * init iframe when trigger form submit
 * @return {jQueryElement} iframe element of jQuery
 */
function newIframe() {
    var iframeName = 'iframe-Upload-' + iframeCount
    var iframe = $('<iframe name="' + iframeName + '" />').hide()
    iframeCount += 1
    return iframe
}

module.exports = Upload
