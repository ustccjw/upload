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
        $.extend(config, {
            accept: 'image/*',
            compress: {
                max_width: 300,
                max_height: 300
            }
        }, options)
        return new Upload(config)
    })
}

/**
 * get uploaded image Thumbnail url
 * @param  {Object} response reponse object
 * @param  {string} suffix   path suffix(180x180)
 * @param  {string} vendor   'upyun/qiniu/upyun_im'
 * @return {string}          Thumbnail url
 */
getThumbnailUrl = function (vendor, response, suffix) {
    vendor = vendor || 'upyun'
    var url = response.url || response.upload_ret.url
    suffix = suffix ? ('_' + suffix) : '_sq'
    if (vendor === 'upyun') {
        url = url.replace(/\.$/, '').split('.')
        var extension = url[1] ? ('.' + url[1]) : ''
        url = url[0]
        return 'http://img' + (url.charCodeAt(1) % 3 + 4) + '.baixing.net' + url + extension + suffix
    } else if (vendor === 'qiniu') {
        return 'http://img7.baixing.net/' + url.split('#')[0] + suffix
    }
}

/**
 * get url for db store
 * @param  {Object} response reponse object
 * @param  {String} vendor   'upyun/qiniu/upyun_im'
 * @return {string}          url
 */
getUrl = function (vendor, response) {
    vendor = vendor || 'upyun'
    var url = response.url || response.upload_ret.url
    var suffix = ''
    if (vendor === 'upyun' || vendor === 'upyun_im') {
        suffix = '#up'
    } else if (vendor === 'qiniu') {
        suffix = '#qn'
    }
    return url + suffix
}

module.exports = imageUpload

// image-upload init via data-API
$(function () {
    $('[data-image-upload]').each(function (index, element) {
        var vendor = $(element).data('vendor')
        var suffix = $(element).data('suffix')
        imageUpload(vendor, {
            trigger: $(element),
            success: function (response, uid) {
                if (typeof response === 'string') {
                    response = $.parseJSON(response)
                }
                if (response.code === 200 || (vendor === 'qiniu' && !response.error)) {
                    var thumbnailUrl = getThumbnailUrl(vendor, response, suffix)
                    var url =getUrl(vendor, response)
                    $(element).trigger('imageUploadSuccess', [thumbnailUrl, url, uid])
                } else {
                    $(element).trigger('imageUploadError', [response.message || response.error, uid])
                }
            },
            error: function (err, uid) {
                if (err.message.indexOf('compress error') !== -1) {
                    return
                }
                $(element).trigger('imageUploadError', [err.message, uid])
            },
            progress: function (position, total, percent, uid) {
                $(element).trigger('imageUploadProgress', arguments)
            },
            select: function (files, uids) {
                $(element).trigger('imageUploadSelect', arguments)
                this.submit()
            }
        })['catch'](function (err) {
            $(element).trigger('imageUploadError', err.message)
        })
    })
})

