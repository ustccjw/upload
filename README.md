# Upload
> It is a upload Component of CommonJS Module
Example's server use koa, so need node v0.11.13+ or io.js
Base on arale/upload

### Characteristics
* Use HTML5 and Iframe <s>not flash</s>
* Support simple data API
* Support upload progress if support XHR2（IE10+ and more）
* Support Image compress(canvas) in Modern browsers（IE10+ and more）
* Support suffix filter
* Provide upyun's config

### Config
    var settings = {
        trigger: null, // trigger upload element
        name: null, // input file name
        action: null, // server url
        data: null, // post data
        accept: null, // effective when support accept(input)
        multiple: true, // effective when support multiple(input)
        change: null, // tigger when you select file
        error: null, // trigger when error
        success: null, // trigger when upload success
        progress: null, // effective when support progress(XHR2)
        suffix: null, // check the file suffix before submit
        compress: null // compress Image if support File API and Canvas
    }

### Demo
See index.html

### 备注
1. 考虑到目前我们的使用场景，flash 主要的优势在于提供多文件上传，对于不支持 multiple 浏览器的使用者是否会使用 ctrl / command 来选择多个文件有待商榷。—平稳退化
2. https://github.com/ustccjw/upload 不使用 flash，对于不支持 XHR2 的浏览器，使用 iframe form submit 来上传。
3. 这个是在 arale/upload 的基础上改进的，使用 commonJS 模块化，browserify 预编译。
4. 提供对 upyun 的封装，使得开发者不需要关心细节。
