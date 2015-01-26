'use strict'

var $ = require('jquery')
var ES6Promise = require('es6-promise')
ES6Promise.polyfill()

/**
 * compress (now only support image)
 * @param  {File}    file
 * @param  {object}  options {max_width, max_height, quality}
 * @return {Promise}
 */
function compress(file, options) {
    options = options || {}
    return new Promise(function (resolve, reject) {
        if (!window.File) {
            reject(new Error('not support'))
            return
        }
        if (!(file instanceof File)) {
            reject(new Error('file error'))
        }
        if(!(/image/i).test(file.type)) {
            resolve({
                blob: file,
                fileName: file.name
            })
            return
        }

        // read the files
        var reader = new FileReader()
        reader.readAsArrayBuffer(file)
        reader.onload = function (event) {

            // blob stuff
            var blob = new Blob([event.target.result])
            window.URL = window.URL || window.webkitURL
            var blobURL = window.URL.createObjectURL(blob)

            // helper Image object
            var image = new Image()
            image.src = blobURL
            image.onload = function() {

                // have to wait till it's loaded
                // send it to canvas
                // var ext = file.name.slice(file.name.lastIndexOf('.') + 1)
                var resized = resize(image, file.type, options.max_width, options.max_height, options.quality)
                var blob = dataURItoBlob(resized)
                resolve({
                    blob: blob,
                    fileName: file.name
                })
            }
        }
    })
}

/**
 * resize Image through canvas
 * @param  {Image}  img
 * @param  {number} max_width
 * @param  {number} max_height
 * @param  {number} quality
 * @return {string} base64/URLEncoded data
 */
function resize(img, type, max_width, max_height, quality) {
    var width = img.width
    var height = img.height
    max_width = max_width || width
    max_height = max_height || height
    quality = quality || 0.7

    // calculate the width and height, constraining the proportions
    if (width > height) {
        if (width > max_width) {
            height = Math.round(height *= max_width / width)
            width = max_width
        }
    } else {
        if (height > max_height) {
            width = Math.round(width *= max_height / height)
            height = max_height
        }
    }

    // resize the canvas and draw the image data into it
    var canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    var ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL(type, quality)
}

/**
 * convert base64/URLEncoded data component to raw binary data held in a string
 * @param  {string} dataURI base64/URLEncoded data
 * @return {string}         raw binary data
 */
function dataURItoBlob(dataURI) {
    var byteString
    if (dataURI.split(',')[0].indexOf('base64') >= 0) {
        byteString = atob(dataURI.split(',')[1])
    }
    else {
        byteString = unescape(dataURI.split(',')[1])
    }

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length)
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ia], {type:mimeString})
}

module.exports = compress
