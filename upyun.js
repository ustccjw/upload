'use strict'

var $ = require('jquery')
var ES6Promise = require('es6-promise')
var compress = require('./lib/compress')

ES6Promise.polyfill()

// get server config
var getJson = function (url, data) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: data,
            success: function (response) {
                if (response.success) {
                    resolve(response.message)
                } else {
                    reject(new Error(response.message))
                }
            },
            error: function (xhr, textStatus, errorMsg) {
                reject(new Error(errorMsg))
            }
        })
    })
}

exports.getConfig = function (path, options) {
    path = path || '/config/upyun/'
    window.location.origin = window.location.origin ||
        window.location.protocol + "//" + window.location.hostname +
        (window.location.port ? ':' + window.location.port: '')
    var url = window.location.origin + path
    options = options || {}
    if (window.FormData) {
        if (options['return-url']) {
            delete options['return-url']
        }
    } else {
        options['return-url'] = true
    }
    return getJson(url, options).then(function (response) {
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
