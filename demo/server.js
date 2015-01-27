'use strict'

var port = process.env.PORT || 3000
var server = module.exports = require('./').listen(port)
console.log('app listening on port ' + port + '.')
