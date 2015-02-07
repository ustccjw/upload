var Upload = require('./lib/upload')
var vendorLib = require('./lib/vendor')

/**
 * ImageUpload function
 * @param  {string} vendor  'upyun/qiniu/upyun_im'
 * @param  {Object} options upload config
 * @return {Promise}        promise resolve upload object, reject any error
 * err message: 'server_config error: xxxx'
 * upload error will call error function(options.error)
 */
function ImageUpload(vendor, options) {
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
 * @param  {string} response reponse Json String
 * @param  {string} suffix   path suffix(180x180)
 * @return {string}          url path, if response is invalid, return null
 */
ImageUpload.getPath = function (response, suffix) {
    return vendorLib.getPath('image', response, suffix)
}

module.exports = ImageUpload
