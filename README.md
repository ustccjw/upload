# upload

> server use koa, need node v0.11.13+ or io.js

1. 考虑到目前我们的使用场景，flash 主要的优势在于提供多文件上传，对于不支持 multiple 浏览器的使用者是否会使用 ctrl / command 来选择多个文件有待商榷。—平稳退化
2. https://github.com/ustccjw/upload 不使用 flash，对于不支持 XHR2 的浏览器，使用 iframe form submit 来上传。
3. 这个是在 arale/upload 的基础上改进的，使用 commonJS 模块化，browserify 预编译。
4. 提供对 upyun 的封装，使得开发者不需要关心细节。
