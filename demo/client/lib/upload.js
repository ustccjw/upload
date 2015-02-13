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
    if (!$(this.settings.trigger).length) {
        throw Error('config error: trigger invalid')
    }

    this.setup()
    this.bind()
}

/**
 * init form that contains hidden data input and transparency file input
 */
Upload.prototype.setup = function () {
    this.form = $('<form></from>').attr({
        method: 'post',
        enctype: 'multipart/form-data',
        action: this.settings.action
    })
    this.form.append(createInputs(this.settings.data))

    this.input = $('<input></input>').attr({
        type: 'file',
        name: this.settings.name,
        accept: this.settings.accept || '',
        multiple: !!this.settings.multiple
    })
    var $trigger = $(this.settings.trigger)
    var outerWidth = $trigger.outerWidth ?  $trigger.outerWidth() : $trigger[0].offsetWidth
    var outerHeight = $trigger.outerHeight ?  $trigger.outerHeight() : $trigger[0].offsetHeight
    this.input.attr('hidefocus', true).css({
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: 0,
        outline: 0,
        cursor: 'pointer',
        width: outerWidth,
        height: outerHeight
    })
    this.form.append(this.input)
    this.form.css({
        position: 'absolute',
        top: $trigger.offset().top,
        left: $trigger.offset().left,
        width: outerWidth,
        height: outerHeight,
        overflow: 'hidden',
        zIndex: findzIndex($trigger) + 10
    }).appendTo('body')
}

/**
 * bind the trigger element to form
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
 */
Upload.prototype.bindInput = function () {
    var self = this
    self.files = []

    self.input.on('change', function(e) {

        // ie9- don't support FileList Object
        self.files = this.files || [{
            name: e.target.value.split('\\').pop()
        }]
        self.uids = $.map(self.files, function (file, index) {
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
 * upload file to server
 * use ajax or form
 * refresh file input when trigger submit
 * @return {Promise}   upload completed primise
 */
Upload.prototype.submit = function () {
    var promise = null
    if (window.FormData) {
        promise = this.ajaxSubmit(this.files, this.uids)
    } else {
        promise = this.formSubmit(this.uids[0])
    }
    this.refreshInput()
    return promise
}

/**
 * upload file by ajax
 * it will be compressed
 * success or error will trigger callback function
 * @param  {Array}   files   upload files
 * @param  {Array}   uids    the files's uids
 * @return {Promise}         upload completed promise
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

            // upload success
            if (self.settings.success) {
                self.settings.success(data, uids[index])
            }
        }, function (err) {

            // upload error
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
 * @param  {number}   uid  file uid
 * @return {Promise}       upload completed promise
 */
Upload.prototype.formSubmit = function (uid) {
    var self = this

    return new Promise(function (resolve, reject) {

        // combine form and iframe
        self.iframe = newIframe()
        self.form.attr('target', self.iframe.attr('name'))
        $('body').append(self.iframe)

        // bind iframe load event
        self.iframe.one('load', function () {
            clearTimeout(timer)

            // Fix for IE endless progress bar activity bug (happens on form submits to iframe targets)
            $('<iframe src="javascript:false;"></iframe>')
                .appendTo(self.form)
                .remove()
            var response = $.trim($(this).contents().find("body").html())
            resolve(response)
        })
        self.form.submit()

        // add timer
        var timer = setTimeout(function () {
            reject(new Error('upload error: timeout'))
        }, self.settings.timeout)
    }).then(function (data) {

        // upload success
        if (self.settings.success) {
            self.settings.success(data, uid)
        }
    }, function (err) {

        // upload error
        if (self.settings.error) {
            self.settings.error(err, uid)
        }
    }).then(function () {

        // upload finished then remove iframe
        self.iframe.remove()
    })
}

/**
 * update the input element
 * or the same file can not upload
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
    return $.map(data, function (value, key) {
        return $('<input></input>').attr({
            type: 'hidden',
            name: key,
            value: value
        })
    })
}

/**
 * find the parents
 * @param  {jQueryElement} $node
 * @return {number}               parents max_zIndex
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
 * create new iframe when trigger form submit
 * @return {jQueryElement} iframe element of jQuery
 */
function newIframe() {
    return $('<iframe></iframe>').attr({
        name: 'iframe-Upload-' + iframeCount++
    }).hide()
}

module.exports = Upload
