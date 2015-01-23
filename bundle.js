require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// var $ = require('jquery')
// var Promise = require('es6-promise').Promise

var Promise = ES6Promise.Promise

/**
 * compress (now only support image)
 * @param  {File}    file
 * @param  {object}  options {max_width, max_height, quality}
 * @return {Promise}
 */
function compress(file, options) {
    options = options || {}
    return new Promise(function (resolve, reject) {
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
            resolve({
                blob: file,
                fileName: file.name
            })
            return
        }
        if(!(/image/i).test(file.type)) {
            resolve({
                blob: file,
                fileName: file.name
            })
            return
        }

        // read the files
        var reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = function (event) {

            // blob stuff
            var blob = new Blob([event.target.result])
            window.URL = window.URL || window.webkitURL
            var blobURL = window.URL.createObjectURL(blob)

            // helper Image object
            var image = new Image()
            image.src = blobURL
            image.onload = function() {

                // have to wait till it's loaded
                // send it to canvas
                // var ext = file.name.slice(file.name.lastIndexOf('.') + 1)
                var resized = resize(image, file.type, options.max_width, options.max_height, options.quality)
                var blob = dataURItoBlob(resized)
                resolve({
                    blob: blob,
                    fileName: file.name
                })
            }
        }
    })
}

/**
 * resize Image through canvas
 * @param  {Image}  img
 * @param  {number} max_width
 * @param  {number} max_height
 * @param  {number} quality
 * @return {string} base64/URLEncoded data
 */
function resize(img, type, max_width, max_height, quality) {
    var width = img.width
    var height = img.height
    max_width = max_width || width
    max_height = max_height || height
    quality = quality || 0.7

    // calculate the width and height, constraining the proportions
    if (width > height) {
        if (width > max_width) {
            height = Math.round(height *= max_width / width)
            width = max_width
        }
    } else {
        if (height > max_height) {
            width = Math.round(width *= max_height / height)
            height = max_height
        }
    }

    // resize the canvas and draw the image data into it
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    var ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL(type, quality)
}

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * @param  {string} dataURI base64/URLEncoded data
 * @return {string}         raw binary data
 */
function dataURItoBlob(dataURI, fileName) {
    var byteString
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1])
    }
    else {
        byteString = unescape(dataURI.split(',')[1])
    }

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length)
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ia], {type:mimeString})
}

module.exports = compress

},{}],"upload":[function(require,module,exports){
/*
 * src: arale/upload
 */

// var $ = require('jquery');
var compress = require('./compress')
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
        ext: null,
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
    settings.ext = settings.ext || $trigger.data('ext')
    settings.success = settings.success || $trigger.data('success')
    settings.compress = settings.compress || parse($trigger.data('compress'))
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
        var type = ''
        var files = self._files
        if (self.settings.ext) {
            var ext = self.settings.ext.split(',')
            for (var i = 0; i < ext.length; i++) {
                ext[i] = $.trim(ext[i])
            }
            for (i = 0; i < files.length; i++) {
                type = files[i].name.split('.').pop()
                if ($.inArray(type.toLowerCase(), ext) === -1) {
                    self.settings.error(new Error('type error'))
                    return
                }
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

        // build a FormData
        // var form = new FormData(self.form.get(0));
        // use FormData to upload
        // form.append(self.settings.name, self._files);
        var files = self._files
        var optionXhr
        if (self.settings.progress) {

            // fix the progress target file
            optionXhr = function () {
                var xhr = $.ajaxSettings.xhr()
                if (xhr.upload) {
                    xhr.upload.addEventListener('progress', function(event) {
                        var percent = 0
                        var position = event.loaded || event.position
                        var total = event.total
                        if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100)
                        }
                        self.settings.progress(event, position, total, percent, files)
                    }, false)
                }
                return xhr
            }
        }

        // upyun server do not support multiple files upload
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
                    xhr: optionXhr,
                    context: this,
                    success: self.settings.success,
                    error: function (xhr, textStatus, errorMsg) {
                        self.settings.error(new Error(errorMsg))
                    }
                })
            })
        }
        return this
    } else {

        // iframe upload
        self.iframe = newIframe()
        self.form.attr('target', self.iframe.attr('name'))
        $('body').append(self.iframe)
        self.iframe.one('load', function () {

            // Fix for IE endless progress bar activity bug
            // (happens on form submits to iframe targets):
            $('<iframe src="javascript:false;"></iframe>')
                .appendTo(self.form)
                .remove()
            var response
            try {

                // make the same primary domain possible
                document.domain = 'baixing.com'
                response = $.trim($(this).contents().find("body").html())
            } catch (e) {
                if (self.settings.error) {
                    self.settings.error(new Error('cross domain'))
                }
            }
            if (response) {
                if (self.settings.success) {
                    self.settings.success(response)
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
    this.settings.success = function(response) {
        me.refreshInput()
        if (callback) {
            callback(response)
        }
    }
    return this
}

// handle when upload error
Uploader.prototype.error = function(callback) {
    var me = this
    this.settings.error = function(response) {
        if (callback) {
            me.refreshInput()
            callback(response)
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

},{"./compress":1}],"upyun":[function(require,module,exports){
// var $ = require('jquery')
// var Promise = require('es6-promise').Promise

// get server config (jsonp, promise)
var Promise = ES6Promise.Promise
var getJson = function (url, data) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            dataType: 'jsonp',
            data: data,
            url: url,
            success: function (response) {
                if (response.success) {
                    resolve(response)
                }
                else {
                    reject(new Error(response.message))
                }
            }
        })
    })
}

exports.getConfig = function (configUrl, options) {
    var url = configUrl || 'http://n.baixing.com:3000/config/upyun'
    var config = {
        'return-url': 'http://n.baixing.com:3000/return/'
    }
    $.extend(config, options)
    if (window.FormData) {
        delete config['return-url']
    }
    return getJson(url, config).then(function (response) {
        var data = {}
        data.policy = response.policy
        data.signature = response.signature
        var action = 'http://v0.api.upyun.com/' + response.bucket
        var config = {
            data: data,
            action: action,
            name: 'file'
        }
        return config
    })
}

exports.getPath = function (response) {
    var url = $.parseJSON(response).url
    url = 'http://bxmedia.b0.upaiyun.com' + url
    return url
}



},{}]},{},[]);
