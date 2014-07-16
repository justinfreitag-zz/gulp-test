'use strict';

var help = require('gulp-help');
var istanbul = require('gulp-istanbul');
var istanbulEnforcer = require('gulp-istanbul-enforcer');
var jshint = require('gulp-jshint');
var merge = require('merge');
var mocha = require('gulp-mocha');
var exit = require('gulp-exit');
var rimraf = require('gulp-rimraf');
var stylish = require('jshint-stylish');
var through = require('through2');

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
      'test/**.js'
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
    checkLeaks: true,
    reporter: 'spec',
    timeout: 2000
  }
};

function end(done) {
  return through.obj(
    function (data, encoding, callback) {
      callback();
    },
    function (callback) {
      callback();
      done();
    }
  );
}

module.exports = function (gulp, options) {
  gulp.options = merge(DEFAULT_OPTIONS, options);

  help(gulp);

  gulp.task('clean', 'Clean target folder.', function () {
    return gulp
      .src('target', {read: false})
      .pipe(rimraf({force: true}));
  });

  gulp.task('copy-lint-files', 'Copy lint files.', function () {
    return gulp
      .src(__dirname + '/**/*.jshintrc')
      .pipe(gulp.dest('tmp'));
  });

  gulp.task('test', 'Perform tests only.', function (done) {
    gulp
      .src(gulp.options.paths.test, {read: false})
      .pipe(mocha(gulp.options.test))
      .pipe(end(done))
      .pipe(exit());
  });

  gulp.task('lint', 'Perform lint tests.', function () {
    return gulp
      .src(gulp.options.paths.lint, {read: false})
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
  });

  gulp.options.coverage = merge({
    coverageDirectory: gulp.options.paths.coverage.dest,
    rootDirectory: ''
  }, gulp.options.coverage);

  gulp.task('coverage', 'Perform coverage tests.', function (done) {
    gulp
      .src(gulp.options.paths.coverage.src)
      .pipe(istanbul())
      .on('finish', function () {
        var coverageError;
        gulp.src(gulp.options.paths.test)
          .pipe(mocha(gulp.options.test))
          .pipe(istanbul.writeReports({
            dir: gulp.options.paths.coverage.dest,
            reporters: ['json', 'lcov']
          }))
          .pipe(istanbulEnforcer(gulp.options.coverage))
          .on('error', function (error) {
            coverageError = error;
          })
          .on('end', function () {
            done(coverageError);
          })
          .pipe(exit());
      });
  });

  gulp.task('complexity', 'Perform complexity tests.', function () {
    //return gulp.src(gulp.options.paths.coverage.src)
    //  .pipe(plato(gulp.options.paths.complexity));
  });

};

