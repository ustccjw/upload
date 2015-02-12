/*
 * Base on arale/upload
 * error message: 'upload error: xxxx' (mostly)
 * error will call settings.error function
 */

'use strict'

var ES6Promise = require('es6-promise')
var compress = require('./compress')

ES6Promise.polyfill()
var iframeCount = 0
var uid = 0

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
        select: null,
        error: null,
        success: null,
        progress: null,
        compress: false,
        timeout: 10000
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
    var outerWidth = $trigger.outerWidth ?  $trigger.outerWidth() : $trigger[0].offsetWidth
    var outerHeight = $trigger.outerHeight ?  $trigger.outerHeight() : $trigger[0].offsetHeight
    this.input.attr('hidefocus', true).css({
        position: 'absolute',
        top: 0,
        right: 0,
        opacity: 0,
        outline: 0,
        cursor: 'pointer',
        width: outerWidth,
        height: outerHeight,
        fontSize: Math.max(64, outerHeight * 5)
    })
    this.form.append(this.input)
    this.form.css({
        position: 'absolute',
        top: $trigger.offset().top,
        left: $trigger.offset().left,
        overflow: 'hidden',
        width: outerWidth,
        height: outerHeight,
        zIndex: findzIndex($trigger) + 10
    }).appendTo('body')
}

/**
 * bind the trigger element to hidden form
 */
Upload.prototype.bind = function () {
    var self = this
    var $trigger = $(self.settings.trigger)
    var outerWidth = $trigger.outerWidth ?  $trigger.outerWidth() : $trigger[0].offsetWidth
    var outerHeight = $trigger.outerHeight ?  $trigger.outerHeight() : $trigger[0].offsetHeight
    $trigger.mouseenter(function () {
        self.form.css({
            top: $trigger.offset().top,
            left: $trigger.offset().left,
            width: outerWidth,
            height: outerHeight
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

        // ie9- don't support FileList Object
        self.files = this.files || [{
            name: e.target.value.split('\\').pop()
        }]
        self.uids = $.map(self.files, function (index, file) {
            return uid++
        })

        if (self.settings.select) {
            self.settings.select.call(self, self.files, self.uids)
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
        this.ajaxSubmit(this.files, this.uids)
        this.refreshInput()
    } else {
        this.formSubmit(this.uids[0])
    }
}

/**
 * upload file by ajax
 * it will be compressed
 * success or error will trigger callback function
 */
Upload.prototype.ajaxSubmit = function (files, uids) {
    var self = this

    // upyun server do not support multiple files upload
    var promiseArr = []
    $.each(files, function (index, file) {
        var promise = compress(file, self.settings.compress)['catch'](function (err) {

            // compress error then go on uploading
            return file
        }).then(function (blob) {

            // add data and file
            self.input.prop('disabled', true)
            var form = new FormData(self.form.get(0))
            form.append(self.settings.name, blob, file.name)
            self.input.prop('disabled', false)
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: self.settings.action,
                    type: 'post',
                    processData: false,
                    contentType: false,
                    data: form,
                    timeout: self.settings.timeout,
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
                                self.settings.progress(position, total, percent, self.uids[index])
                            }, false)
                        }
                        return xhr
                    },
                    success: function (data) {
                        resolve(data)
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        if (errorThrown) {
                            errorThrown = ' ' + errorThrown
                        }
                        var message = 'upload error: ' + textStatus + errorThrown
                        reject(new Error(message))
                    }
                })
            })
        }).then(function (data) {
            if (self.settings.success) {
                self.settings.success(data, uids[index])
            }
        }, function (err) {
            if (self.settings.error) {
                self.settings.error(err, uids[index])
            }
        })
        promiseArr.push(promise)
    })
    return Promise.all(promiseArr)
}

/**
 * upload file by form submit
 * success or error will trigger callback function
 * promise: only upload one file once
 */
Upload.prototype.formSubmit = function (uid) {
    var self = this

    return new Promise(function (resolve, reject) {

        // combine form and iframe
        self.iframe = newIframe()
        self.form.attr('target', self.iframe.attr('name'))
        $('body').append(self.iframe)

        // init timer and bind load iframe load event
        var timer = null
        self.iframe.one('load', function () {
            clearTimeout(timer)

            // Fix for IE endless progress bar activity bug
            // (happens on form submits to iframe targets):
            $('<iframe src="javascript:false;"></iframe>')
                .appendTo(self.form)
                .remove()
            var response = $.trim($(this).contents().find("body").html())
            resolve(response)
        })

        // submit and refresh
        self.form.submit()
        self.refreshInput()

        // add timer
        timer = setTimeout(function () {
            reject(new Error('upload error: timeout'))
        }, self.settings.timeout)
    }).then(function (data) {
        if (self.settings.success) {
            self.settings.success(data, uid)
        }
    }, function (err) {
        if (self.settings.error) {
            self.settings.error(err, uid)
        }
    }).then(function () {

        // upload finished then remove iframe
        self.iframe.remove()
    })
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
 * set settings.select
 * @param  {Function} callback override settings.select
 * @return {Object}            upload object
 */
Upload.prototype.select = function(callback) {
    if (!callback) {
        return this
    }
    this.settings.select = callback
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
    var zIndex = 0
    $.each($node.parents(), function (index, item) {
        if (item === $('body')[0]) {
            return false
        }
        if ($(item).css('position') !== 'static') {
            zIndex = parseInt($(item).css('zIndex'), 10) || zIndex
        }
    })
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
