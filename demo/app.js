'use strict'

var crypto = require('crypto')
var koa = require('koa')
var serve = require('koa-static')
var router = require('koa-router')
var json = require('koa-json')
var compress = require('koa-compress')
var logger = require('koa-logger')
var objectAssign = require('object-assign')
var render = require('./lib/render')

var app = koa()

if (app.env !== 'production' && app.env !== 'test') {
    app.use(logger())
}

app.use(compress())
app.use(json())

// static server
app.use(serve('public/image', {maxage: 3600*1000}))
app.use(serve('public/javascript', {maxage: 3600*1000}))

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
                options['return-url'] = this.originalUrl + 'return/'
            }
            var policy = new Buffer(JSON.stringify(options)).toString('base64')
            var hash = crypto.createHash('md5')
            var str = policy + '&' + 'form-api xxxxx'
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

app.listen(3000)
