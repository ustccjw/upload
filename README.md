# Upload
> It is a CommonJS Module of Upload Module.
Demo's server use koa, so need node v0.11.13+ or io.js.
Based on arale/upload.

### Characteristics
* Use HTML5 and Iframe <s>no flash</s>.
* Support upload progress if support XHR2 (IE10+ and more).
* Support Image compress (use canvas) if support File API and canvas（IE10+ and more）
* Support file-extension filter.
* Provide nice upyun/qiniu interface (need to get server config/token).
* Error clear.

more:
* error: 'extension error/compress error: xxxx/upload error: xxxx'. Upload error will call settings.error function.
* extension error will only stop uploading current file, if multiple is valid, other files will be continue to upload.
* Compress error only do not compress, do not stop uploading.
* upyun/qiniu interface (imageUpload) return promise that resolve upload object, reject any error (mostly: server_config error: xxxx).

### Config
    var settings = {
        trigger: '#uploader', // trigger upload element
        name: 'file', // input file name
        action: 'http://v0.api.upyun.com/bucket', // server url
        data: {policy: policy, signature: signature}, // post data
        accept: 'image/*', // effective when support accept(input)
        multiple: true, // effective when support multiple(input)
        change: function (files) {}, // tigger when you select file
        error: function (errorMsg, fileName) {}, // trigger when error
        success: function (response, fileName) {}, // trigger when upload success
        progress: function (event, position, total, percent, fileName) {}, // effective when support progress(XHR2)
        extension: 'jpeg,png,jpg', // check the file-extension before submit
        compress: {max_width: 180, max_height: 180, quality: 0.7} // compress Image if support File API and Canvas
    }

### Usage
    var Upload = require('upload')
    new Upload(config)
For 'upyun/qiniu' upload, we provide imageUpload interface:

    var imageUpload = require('image_upload')
    imageUpload('upyun', config)
In demo, we use browserify `standalone:'imageUpload'` to provide imageUpload interface.
