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
            './client/upload.js',
            './client/upyun.js'
        ]).
        require([{
            file: './client/upload.js',
            expose: 'upload'
        }, {
            file: './client/upyun.js',
            expose: 'upyun'
        }]).
        bundle().
        pipe(source('bundle.js')).
        pipe(buffer()).
        pipe(sourcemaps.init({loadMaps: true})).
        pipe(uglify()).
        pipe(rename('bundle.min.js')).
        pipe(sourcemaps.write('./')).
        pipe(gulp.dest('./public/javascript'))
})

gulp.task('copy', function () {
    return gulp.src('./client/**/*.js').
        pipe(gulp.dest('../'))
})

gulp.task('default', ['browserify', 'copy'])
