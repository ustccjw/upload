'use strict'

var crypto = require('crypto')
var router = require('koa-router')
var objectAssign = require('object-assign')
var app = require('../app')
var render = require('../lib/render')

// router
app.use(router(app))
app.get('/', getIndex)
app.get('/config/:server/', getConfig)
app.get('/return/', getResult)

function* getConfig() {
    var server = this.params.server
    var data = {}

    try{
        if (server === 'upyun') {
            var options = {
                bucket: 'bxmedia',
                expiration: Math.floor(new Date().getTime() / 1000) + 3600,
                'save-key': '/{filemd5}{.suffix}'
            }
            objectAssign(options, this.query)
            if (options['return-url']) {
                options['return-url'] = this.protocol + '://' + this.host + '/return/'
            }
            var policy = new Buffer(JSON.stringify(options)).toString('base64')
            var hash = crypto.createHash('md5')
            var str = policy + '&' + '9sMCIBryAo8INghVqfOQXtsvTNI='
            var signature = hash.update(str, 'utf8').digest('hex')
            data.success = true
            data.message = {
                bucket: options.bucket,
                policy: policy,
                signature: signature
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
