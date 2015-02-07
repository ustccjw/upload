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
            error: function (xhr, textStatus, errorMsg) {
                reject(new Error('server_config error: ' + errorMsg))
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
    return Promise.reject(new Error('server_config error: ' + 'media type invalid'))
}

/**
 * get image/media getPath
 * @param  {string} type    'image/media'
 * @param  {Object} reponse {code, url,...}
 * @param  {string} suffix  '180x180'
 * @return {string}         url path, if response is invalid, return null
 */
exports.getPath = function (type, response, suffix) {
    if (type === 'image') {
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
}
