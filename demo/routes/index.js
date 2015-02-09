'use strict'

var crypto = require('crypto')
var router = require('koa-router')
var app = require('../app')
var render = require('../lib/render')

// router
app.use(router(app))
app.get('/', getIndex)
app.get('/imageUpload/getConfig/', getConfig)
app.get('/imageUpload/getResult/', getResult)

function* getConfig() {
    var data = {}
    try{
        if (this.query.vendor === 'upyun') {
            var options = {
                bucket: 'bximg',
                expiration: Math.floor(new Date().getTime() / 1000) + 3600,
                'save-key': '/{filemd5}{.suffix}',
                'content-secret': 'original',
                'content-length-range': '0,10485760',
                'x-gmkerl-type': 'fix_max',
                'x-gmkerl-value': '640',
                'x-gmkerl-noicc': 'true',
                'x-gmkerl-quality': '75',
                'x-gmkerl-rotate': 'auto',
                'x-gmkerl-exif-switch': 'true',
                'notify-url': 'http://img.baixing.net/notify/bximg.php'
            }
            if (this.query['return-url']) {
                options['return-url'] = this.query['return-url']
            }
            var policy = new Buffer(JSON.stringify(options)).toString('base64')
            var hash = crypto.createHash('md5')
            var str = policy + '&' + 'form-api-xxxx'
            var signature = hash.update(str, 'utf8').digest('hex')
            data.success = true
            data.message = {
                uploadUrl: 'http://v0.api.upyun.com/' + options.bucket + '/',
                uploadParams: {
                    policy: policy,
                    signature: signature
                },
                fileKey: 'file'
            }
        }
    } catch(err) {
        data = {
            success: false,
            message: err.message
        }
    } finally {
        this.body = data
    }
}

function* getResult() {
    this.body = yield render('result', {message: JSON.stringify(this.query)})
}

function* getIndex() {
    this.body = yield render('index')
}
