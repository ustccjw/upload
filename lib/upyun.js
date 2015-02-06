'use strict'

var ES6Promise = require('es6-promise')

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

exports.getToken = function (bucket, path) {
    path = path || '/token/upyun/'
    window.location.origin = window.location.origin ||
        window.location.protocol + "//" + window.location.hostname +
        (window.location.port ? ':' + window.location.port: '')
    var url = window.location.origin + path
    var query = {
        bucket: bucket
    }
    if (!window.FormData) {
        query['return-url'] = true
    }
    return getJson(url, query).then(function (response) {
        var data = {}
        data.policy = response.policy
        data.signature = response.signature
        return data
    })
}

exports.getPath = function (response) {
    var url = $.parseJSON(response).url
    url = 'http://bxmedia.b0.upaiyun.com' + url
    return url
}
