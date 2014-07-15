'use strict';

var help = require('gulp-help');
var istanbul = require('gulp-istanbul');
var istanbulEnforcer = require('gulp-istanbul-enforcer');
var jshint = require('gulp-jshint');
var merge = require('merge');
var mocha = require('gulp-mocha');
var stylish = require('jshint-stylish');

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

module.exports = function (gulp, options) {
  gulp.options = merge(DEFAULT_OPTIONS, options);

  help(gulp);

  gulp.task('test', 'Perform tests only.', function () {
    return gulp
      .src(gulp.options.paths.test)
      .pipe(mocha(gulp.options.test));
  });

  gulp.task('lint', 'Perform lint tests.', function () {
    return gulp
      .src(gulp.options.paths.lint)
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
  });

  gulp.options.coverage = merge({
    coverageDirectory: gulp.options.paths.coverage.dest,
    rootDirectory: ''
  }, gulp.options.coverage);

  gulp.task('coverage', 'Perform coverage tests.', function (callback) {
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

  gulp.task('complexity', 'Perform complexity tests.', function () {
    //return gulp.src(gulp.options.paths.coverage.src)
    //  .pipe(plato(gulp.options.paths.complexity));
  });

};

