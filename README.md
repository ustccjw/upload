# Upload
> It is a CommonJS Module of Upload Module.
Demo's server use koa, so need node v0.11.13+ or io.js.
Based on arale/upload.

### Characteristics
* Use HTML5 and Iframe <s>no flash</s>.
* Support upload progress if support XHR2 (IE10+ and more).
* Support Image compress (use canvas) if support File API and canvas（IE10+ and more）
* Provide nice upyun/qiniu interface (need to get server config/token).
* Error clear.

more:
* error: 'compress error: xxxx/upload error: xxxx'. Upload error will call settings.error function.
* Compress error only do not compress, do not stop uploading.
* upyun/qiniu interface (imageUpload) return promise that resolve upload object, reject any error (mostly: server_config error: xxxx).
* imageUpload also support data-API.

### Config
    var options = {
        trigger: '#uploader', // trigger upload element
        name: 'file', // input file name
        action: 'http://v0.api.upyun.com/bucket', // server url
        data: {policy, signature}, // post data
        accept: 'image/*', // effective when support accept(input)
        multiple: true, // effective when support multiple(input)
        compress: {max_width, max_height, quality}, // compress Image if support File API and Canvas
        change: function (files, uids) {}, // tigger when you select file
        error: function (errorMsg, uid) {}, // trigger when error
        success: function (response, uid) {}, // trigger when upload success
        progress: function (position, total, percent, uid) {} // effective when support progress(XHR2)
    }

### Usage
    var Upload = require('upload')
    new Upload(options)
For 'upyun/qiniu' upload, we provide imageUpload interface, we use browserify `standalone:'imageUpload'` to provide imageUpload interface:

    imageUpload('upyun', options)
You can use data-API, then use DOM event handle success, error and more:

    <form>
        <button data-image-upload data-suffix="180x180" data-vendor="upyun">上传文件</button>
    </form>

    $('[data-image-upload]').on('imageUploadSuccess', function (event, thumbnailUrl, url, uid) {
    }).on('imageUploadError', function (event, errMsg, uid) {
    }).on('imageUploadSelect', function (event, files, uids) {
    }).on('imageUploadProgress', function (position, total, percent, uid) {
    })
