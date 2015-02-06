'use strict'

var ES6Promise = require('es6-promise')

ES6Promise.polyfill()

// get server config
var getJson = function (url, data) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            url: url,
            data: data,
            dataType: 'json',
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

exports.getConfig = function (vendor) {
    window.location.origin = window.location.origin ||
        window.location.protocol + "//" + window.location.hostname +
        (window.location.port ? ':' + window.location.port: '')
    var url = window.location.origin + '/ImageUpload/getConfig/'
    var query = {
        vendor: vendor,
        'return-url': window.location.origin + '/ImageUpload/getResult/'
    }
    if (window.FormData) {
        delete query['return-url']
    }
    return getJson(url, query).then(function (response) {
        return {
            action: response.uploadUrl,
            data: response.uploadParams,
            name: response.fileKey
        }
    })
}

exports.getPath = function (response, suffix) {
    response = $.parseJSON(response)
    if (response.code >= 200 && response.code < 300) {
        var url = response.url.replace(/\.$/, '')
        url = url.split('.')
        var type = url[1] ? ('.' + url[1]) : ''
        url = url[0];
        suffix = suffix ? ('_' + suffix) : '_sq'

        if (url.indexOf('#') !== -1) {
            type = url.split('#')[0]
        }
        return 'http://img' + (url.charCodeAt(1) % 3 + 4) + '.baixing.net' + url + type + suffix
    } else {
        return null
    }
}
