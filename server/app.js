var crypto = require('crypto')
var koa = require('koa')
var app = koa()
var router = require('koa-router')
var compress = require('koa-compress')
var cors = require('koa-cors')
var logger = require('koa-logger')

if (app.env !== 'production' && app.env !== 'test') {
    app.use(logger())
}
app.use(cors())
app.use(compress())
app.use(router(app))
app.get('/config/:server', getServerConfig)
app.get('/return/', getResult)

function merge(a, b) {
    for (var k in b) {
        a[k] = b[k]
    }
    return a
}

function* getServerConfig () {
    var server = this.params.server
    var data = {}
    data.success = true

    try{
        if (server === 'upyun') {
            var options = {
                bucket: 'bxmedia',
                expiration: Math.floor(new Date().getTime() / 1000) + 3600,
                'save-key': '/{filemd5}{.suffix}'
            }
            if (this.query.returnUrl === 'true') {
                options['return-url'] = 'http://172.17.4.71:3000/return/'
            }
            var policy = new Buffer(JSON.stringify(options)).toString('base64')
            var hash = crypto.createHash('md5')
            var str = policy + '&' + 'form-api xxxxxxx'
            var signature = hash.update(str, 'utf8').digest('hex')
            merge(data, {
                bucket: options.bucket,
                policy: policy,
                signature: signature
            })
        }
    } catch(err) {
        merge(data, {
            success: false,
            message: err.message
        })
    } finally {
        this.type = 'application/javascript; charset=utf-8'
        this.body = this.query.callback + '(' + JSON.stringify(data) + ')'
    }
}

function* getResult() {
    this.body = JSON.stringify(this.query)
}

app.listen(3000)
