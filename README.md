# Upload
> It is a CommonJS Module of Upload Module.
Demo's server use koa, so need node v0.11.13+ or io.js.
Based on arale/upload.

### Characteristics
* Use HTML5 and Iframe <s>no flash</s>
* Support upload progress if support XHR2（IE10+ and more）
* Support Image compress(use canvas) if support File API and canvas（IE10+ and more）
* Support file-suffix filter
* Support simple data API
* Provide get upyun's config (return promise)

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
        suffix: 'jpeg,png,jpg', // check the file-suffix before submit
        compress: {max_width: 180, max_height: 180, quality: 0.7} // compress Image if support File API and Canvas
    }

### Demo
see demo/

### 备注
1. 考虑到目前我们的使用场景，flash 主要的优势在于提供多文件上传，对于不支持 multiple 浏览器的使用者是否会使用 ctrl / command 来选择多个文件有待商榷。—平稳退化
2. https://github.com/ustccjw/upload 不使用 flash，对于不支持 XHR2 的浏览器，使用 iframe form submit 来上传。
3. 这个是在 arale/upload 的基础上改进的，使用 commonJS 模块化，browserify 预编译。
4. 提供对 upyun 的封装，使得开发者不需要关心细节。
