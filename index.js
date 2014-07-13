'use strict';

var help = require('gulp-help');
var istanbul = require('gulp-istanbul');
var istanbulEnforcer = require('gulp-istanbul-enforcer');
var jshint = require('gulp-jshint');
var merge = require('merge');
var mocha = require('gulp-mocha');
var plato = require('gulp-plato');
var util = require('gulp-util');
var stylish = require('jshint-stylish');
//var fs = require('fs');
//var path = require('path');
//var spawn = require('child_process').spawn;

var DEFAULT_OPTIONS = {
  paths: {
    complexity: 'target/complexity',
    coverage: {
      src: [
        'index.js',
        'lib/**/*.js'
      ],
      dest: 'target/coverage'
    },
    lint: [
      '*.js',
      'lib/**/*.js',
      'test/**.js',
      '!node_modules'
    ],
    test: 'test/**/*.js'
  },
  complexity: {
    trycatch: true,
    halstead: [10, 13, 20],
    maintainability: 90
  },
  coverage: {
    thresholds: {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100
    }
  },
  test: {
    reporter: 'spec'
  }
};

function handleError(error) {
  util.log(error.message);
  util.log(error.stack);
  process.exit(1);
}

module.exports = function (gulp, options) {
  gulp.options = merge(DEFAULT_OPTIONS, options);

  help(gulp);

  gulp.task('default', ['lint', 'coverage']);

  gulp.task('test', function () {
    return gulp
      .src(gulp.options.paths.test)
      .pipe(mocha(gulp.options.test));
  });

  gulp.task('lint', function () {
    return gulp
      .src(gulp.options.paths.lint)
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
  });

  gulp.options.coverage = merge({
    coverageDirectory: gulp.options.paths.coverage.dest,
    rootDirectory: ''
  }, gulp.options.coverage);

  gulp.task('coverage', function (callback) {
    gulp.src(gulp.options.paths.coverage.src)
      .pipe(istanbul())
      .on('finish', function () {
        gulp.src(gulp.options.paths.test)
          .pipe(mocha(gulp.options.test))
          .pipe(istanbul.writeReports(gulp.options.paths.coverage.dest))
          .pipe(istanbulEnforcer(gulp.options.coverage))
          .on('end', callback);
      });
  });

  gulp.task('complexity', function () {
    return gulp.src(gulp.options.paths.coverage.src)
      .pipe(plato(gulp.options.paths.complexity));
  });

};

