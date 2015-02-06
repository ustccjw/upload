var Upload = require('./lib/upload')
var vendorLib = require('./lib/vendor')

function ImageUpload(vendor, options) {
    if ($.isPlainObject(vendor)) {
        options = vendor
        vendor = 'upyun'
    }
    if (!$.isPlainObject(options)) {
        options = {}
    }
    if (vendor !== 'upyun' && vendor !== 'qiniu') {
        return Promise.reject(new Error('vendor error'))
    }
    return vendorLib.getConfig(vendor).then(function (config) {
        $.extend(options, config)
        return new Upload(options)
    })
}

ImageUpload.getPath = vendorLib.getPath

module.exports = ImageUpload
