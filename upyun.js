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


