# Upload
> It is a **configuration-like** component.
We provide a **Upload** interface, it is a constructor.
It is also a **label-like** component when used in business.
We provide one business solution: use **data-api** as input, use **event-handler** as output.

### Basic Characteristics
* Use HTML5 and Iframe <s>no flash</s>.
* Support upload progress if support XHR2 (IE10+ and more).
* Support Image compress if support File API and canvas (IE10+ and more).
* Use Promise to control flow.
* Any upload error will be catched, then call error function of config.

### Config
    var options = {
        trigger: '#uploader', // trigger upload element
        name: 'file', // input file name
        action: 'http://v0.api.upyun.com/bucket', // server url
        data: {policy, signature}, // post data
        accept: 'image/*', // effective when support accept(input)
        multiple: true, // effective when support multiple(input)
        compress: {max_width, max_height, quality}, // now only support image, set false will close compress
        timeout: 10000,
        select: function (files, uids) {}, // call when you select file
        error: function (error, uid) {}, // call when upload error
        success: function (response, uid) {}, // call when upload success
        progress: function (position, total, percent, uid) {} // effective when support progress(XHR2)
    }

### Business Solution
We use **data-api** as input, use **event-handler** as output.
Such as image-upload.js, we automatically find **data-image-upload** element, then put it as a trigger to call Upload constructor.
We get config data via data-api. So we can set some default value (business value) to Upload's config.
For DOM, **events** is always important, we all love events. In Upload's success/error/progress/change function, we trigger corresponding event.
**Advantage**：
* **label** and **event** is nice, it is like native
* upload is pure, image_upload is business, but we do not need to know.

### Usage
Basic usage:

    var Upload = require('upload')
    var upload = new Upload(options)
    upload.success(function (response, uid) {
    ).error(function (err, uid) {
    }).progress(function (position, total, percent, uid) {
    }).select(function (files, uids) {
    })

By business encapsulation, like image_upload.js, we have:

    <button data-image-upload>上传文件</button>

    $('[data-image-upload]').on('imageUploadSuccess', function (event, thumbnailUrl, url, uid) {
    }).on('imageUploadError', function (event, errMsg, uid) {
    }).on('imageUploadSelect', function (event, files, uids) {
    }).on('imageUploadProgress', function (event, position, total, percent, uid) {
    })

### Demo
> Demo's server use koa, so need node v0.11.13+ or io.js.

### More
upload.js is base on arale/upload. But increase more:
* Use Promise to control flow.
* Add compress (now noly compress image).
* Upload files respectively when multiple set true.
* Add file's uid as a unique identifier.
* Add timeout control.
* Be nice to zepto.
