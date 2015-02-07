'use strict'

var path = require('path')
var gulp = require('gulp')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')
var sourcemaps = require('gulp-sourcemaps')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')

gulp.task('browserify', function () {
    return browserify([
        './client/image_upload.js',
    ], {
        standalone: 'imageUpload'
    }).
    bundle().
    pipe(source('bundle.min.js')).
    pipe(buffer()).
    pipe(sourcemaps.init({loadMaps: true})).
    pipe(uglify()).
    pipe(sourcemaps.write('./')).
    pipe(gulp.dest('./public/javascript'))
})

gulp.task('copy', function () {
    return gulp.src('./client/**/*.js').
        pipe(gulp.dest('../'))
})

gulp.task('default', ['browserify', 'copy'])
