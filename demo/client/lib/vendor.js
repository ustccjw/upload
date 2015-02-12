'use strict'

var ES6Promise = require('es6-promise')
ES6Promise.polyfill()

// err message: 'server_config error: xxxx'

/**
 * get Json via ajax
 * @param  {string} url  the server url
 * @param  {Object} data query data
 * @return {Promise}     promise resolve message
 */
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
                    reject(new Error('server_config error: ' + response.message))
                }
            },
            error: function (xhr, textStatus) {
                reject(new Error('server_config error: ' + textStatus))
            }
        })
    })
}

/**
 * get server config
 * @param  {string} type   'image/media'
 * @param  {string} vendor 'upyun/qiniu/upyun_im'
 * @return {Promise}        promise resolve server config
 */
exports.getConfig = function (type, vendor) {
    if (type === 'image') {
        window.location.origin = window.location.origin ||
            window.location.protocol + "//" + window.location.hostname +
            (window.location.port ? ':' + window.location.port: '')
        var url = window.location.origin + '/imageUpload/getConfig/'
        var query = {
            vendor: vendor,
            'return-url': window.location.origin + '/imageUpload/getResult/'
        }
        if (window.FormData) {
            delete query['return-url']
        }
        if (window[vendor]) {
            return Promise.resolve({
                action: window[vendor].uploadUrl,
                data: window[vendor].uploadParams,
                name: window[vendor].fileKey
            })
        } else {
            return getJson(url, query).then(function (response) {
                return {
                    action: response.uploadUrl,
                    data: response.uploadParams,
                    name: response.fileKey
                }
            })
        }
    }
    return Promise.reject(new Error('server_config error: ' + 'media type invalid'))
}
