'use strict'

var koa = require('koa')
var serve = require('koa-static')
var json = require('koa-json')
var compress = require('koa-compress')
var conditional = require('koa-conditional-get')
var logger = require('koa-logger')
var reponseTime = require('koa-response-time')

var app = module.exports = koa()

app.use(reponseTime())
if (app.env !== 'production' && app.env !== 'test') {
    app.use(logger())
}
app.use(conditional())
app.use(compress())
app.use(json())

// static server
app.use(serve('public/image', {maxage: 3600*1000}))
app.use(serve('public/javascript', {maxage: 3600*1000}))
