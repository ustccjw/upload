'use strict'

var path = require('path')
var gulp = require('gulp')
var uglify = require('gulp-uglify')
var rename = require('gulp-rename')
var sourcemaps = require('gulp-sourcemaps')
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')

gulp.task('image-upload', function () {
    return browserify([
        './client/image_upload.js',
    ]).
    bundle().
    pipe(source('image_upload.min.js')).
    pipe(buffer()).
    pipe(sourcemaps.init({loadMaps: true})).
    pipe(uglify()).
    pipe(sourcemaps.write('./')).
    pipe(gulp.dest('./public/javascript'))
})

gulp.task('upload', function () {
    return browserify([
        './client/lib/upload.js',
    ], {
        standalone: 'Upload'
    }).
    bundle().
    pipe(source('upload.min.js')).
    pipe(buffer()).
    pipe(sourcemaps.init({loadMaps: true})).
    pipe(uglify()).
    pipe(sourcemaps.write('./')).
    pipe(gulp.dest('./public/javascript'))
})

gulp.task('copy', function () {
    gulp.src('./client/**/*.js').
        pipe(gulp.dest('../'))
    gulp.src('./public/javascript/image_upload.min.js').
        pipe(gulp.dest('../dist'))
    gulp.src('./public/javascript/upload.min.js').
        pipe(gulp.dest('../dist'))
})

gulp.task('default', ['image-upload', 'upload'], function () {
    gulp.start('copy')
})
