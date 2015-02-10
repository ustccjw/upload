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
 * get uploaded image path
 * @param  {string} vendor   'upyun/qiniu/upyun_im
 * @param  {string} response reponse Json String
 * @param  {string} suffix   path suffix(180x180)
 * @return {string}          url path
 */
imageUpload.getPath = function (vendor, response, suffix) {
    response = $.parseJSON(response)
    if (!response.url) {
        return null
    }
    return vendorLib.getPath('image', vendor, response.url, suffix)
}

module.exports = imageUpload
