var Upload = require('./lib/upload')
var vendorLib = require('./lib/vendor')

/**
 * imageUpload function
 * @param  {string} vendor  'upyun/qiniu/upyun_im'
 * @param  {Object} options upload config
 * @return {Promise}        promise resolve upload object, reject any error
 * err message: 'server_config error: xxxx'
 * upload error will call error function(options.error)
 */
function imageUpload(vendor, options) {
    if ($.isPlainObject(vendor)) {
        options = vendor
        vendor = 'upyun'
    }
    if (!$.isPlainObject(options)) {
        options = {}
    }
    vendor = vendor || 'upyun'
    options = options || {}
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
 * @return {string}          url path, if response is invalid, return null
 */
imageUpload.getPath = function (vendor, response, suffix) {
    response = $.parseJSON(response)
    if (!response.url) {
        return null
    }
    return vendorLib.getPath('image', vendor, response.url, suffix)
}

module.exports = imageUpload
