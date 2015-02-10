var Upload = require('./lib/upload')
var vendorLib = require('./lib/vendor')

/**
 * imageUpload function
 * @param  {string} vendor  'upyun/qiniu/upyun_im'
 * @param  {Object} options upload config
 * @return {Promise}        promise resolve upload object, reject any error (mostly: server_config error: xxxx)
 */
function imageUpload(vendor, options) {
    if (typeof vendor === 'object') {
        options = vendor
        vendor = 'upyun'
    }
    vendor = vendor || 'upyun'
    if (typeof options !== 'object') {
        options = {}
    }
    return vendorLib.getConfig('image', vendor).then(function (config) {
        $.extend(options, config)
        return new Upload(options)
    })
}

/**
 * get uploaded image Thumbnail url
 * @param  {string} response reponse Json String
 * @param  {string} suffix   path suffix(180x180)
 * @param  {string} vendor   'upyun/qiniu/upyun_im'
 * @return {string}          Thumbnail url
 */
imageUpload.getThumbnailUrl = function (response, suffix, vendor) {
    vendor = vendor || 'upyun'
    response = $.parseJSON(response)
    if (!response.url) {
        return null
    }
    return vendorLib.getPath('image', vendor, response.url, suffix)
}

/**
 * get url pass to server
 * @param  {string} response reponse Json String
 * @param  {String} vendor   'upyun/qiniu/upyun_im'
 * @return {string}          url
 */
imageUpload.getUrl = function (response, vendor) {
    vendor = vendor || 'upyun'
    response = $.parseJSON(response)
    if (!response.url) {
        return null
    }
    var suffix = ''
    if (vendor === 'upyun' || vendor === 'upyun_im') {
        suffix = '#up'
    } else if (vendor === 'qiniu') {
        suffix = '#qn'
    }
    return response.url + suffix
}

module.exports = imageUpload
