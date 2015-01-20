// var $ = require('jquery')
var Promise = require('es6-promise').Promise

var Upload = require('./upload')

// get server config (jsonp)
var getJson = function (url) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            dataType: 'jsonp',
            url: url,
            success: function (data) {
                if (data.success) {
                    resolve(data)
                }
                else {
                    reject(new Error(data.message))
                }
            }
        })
    })
}

// 服务器 url
var url = 'http://172.17.4.71:3000/config/upyun'
if (!window.FormData) {
    url += '?returnUrl=true'
}
var promise = getJson(url).then(function (response) {
    var data = {}
    data.policy = response.policy
    data.signature = response.signature
    var action = 'http://v0.api.upyun.com/' + response.bucket
    var config = {
        data: data,
        action: action,
        name: 'file',
        accept: 'image/*'
    }
    return config
})

module.exports = promise


