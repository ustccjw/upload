'use strict'

var upyun = require('./lib/upyun')
var Upload = require('./lib/upload')

function UpyunUpload(bucket, options) {
    if (!(this instanceof UpyunUpload)) {
        return new UpyunUpload(options)
    }
    if (!$.isPlainObject(options)) {
        options = {}
    }
    var settings = {
        name: 'file',
        action: 'http://v0.api.upyun.com/' + bucket
    }
    $.extend(settings, options)
    var upload = new Upload(settings)

    upyun.getToken(bucket).then(function (response) {
        upload.addData(response)
    })['catch'](function (err) {
        console.log('token error', err.message)
    })
    return upload
}

UpyunUpload.getPath = upyun.getPath

module.exports = UpyunUpload
