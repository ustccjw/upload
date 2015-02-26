var Upload = require('./lib/upload')
var vendorConfig = require('./lib/vendor_config')

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
	return vendorConfig('image', vendor).then(function (config) {
		$.extend(config, {
			accept: 'image/*',
			timeout: 10000,
			compress: {
				max_width: 300,
				max_height: 300,
				quality: 0.8
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
function getThumbnailUrl(vendor, response, suffix) {
	vendor = vendor || 'upyun'
	var url = response.url || response.upload_ret.url
	url = url.split('#')[0]
	suffix = suffix ? ('_' + suffix) : '_sq'
	if (vendor === 'upyun') {
		return 'http://img' + (url.charCodeAt(1) % 3 + 4) + '.baixing.net' + url + suffix
	} else if (vendor === 'qiniu') {
		return 'http://img7.baixing.net/' + url + suffix
	}
}

/**
 * get url for db store
 * @param  {Object} response reponse object
 * @param  {String} vendor   'upyun/qiniu/upyun_im'
 * @return {string}          url
 */
function getUrl(vendor, response) {
	vendor = vendor || 'upyun'
	var url = response.url || response.upload_ret.url
	url = url.split('#')[0]
	var suffix = ''
	if (vendor === 'upyun' || vendor === 'upyun_im') {
		suffix = '#up'
	} else if (vendor === 'qiniu') {
		suffix = '#qn'
	}
	return url + suffix
}

// image-upload init via data-API
$(function () {
	$('[data-image-upload]').each(function (index, element) {
		var vendor = $(element).data('vendor')
		var accept = $(element).data('accept')
		var suffix = $(element).data('suffix')
		imageUpload(vendor, {
			trigger: $(element),
			accept: accept,
			success: function (response, uid) {
				if (typeof response === 'string') {
					response = $.parseJSON(response)
				}
				if (+response.code === 200 || (vendor === 'qiniu' && !response.error)) {
					var thumbnailUrl = getThumbnailUrl(vendor, response, suffix)
					var url = getUrl(vendor, response)
					$(element).trigger('imageUploadSuccess', [thumbnailUrl, url, uid])
				} else {
					$(element).trigger('imageUploadError', [response.message || response.error, uid])
				}
			},
			error: function (err, uid) {
				$(element).trigger('imageUploadError', [err.message, uid])
			},
			progress: function (position, total, percent, uid) {
				$(element).trigger('imageUploadProgress', [].slice.call(arguments, 0))
			},
			select: function (files, uids) {
				$(element).trigger('imageUploadSelect', [].slice.call(arguments, 0))
				this.submit()
			}
		})['catch'](function (err) {
			console.log(err)
		})
	})
})

