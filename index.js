'use strict';

var eventStream = require('event-stream');
var plugins = require('gulp-load-plugins')({
  config: __dirname + '/package.json'
});
var merge = require('merge');
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
    cyclomatic: [3, 7, 12],
    halstead: [8, 13, 20],
    maintainability: 100
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

  plugins.help(gulp);

  gulp.task('add-lint-files', 'Add lint files.', function (done) {
    var jshintPaths = ['**/*.jshintrc', '!node_modules/**/*'];
    eventStream.concat(
      gulp
        .src(jshintPaths, {dot: true})
        .pipe(plugins.debug())
        .pipe(plugins.rename(function (path) {
          path.extname = '.old';
        }))
        .pipe(gulp.dest(process.cwd())),
      gulp
        .src(jshintPaths, {dot: true, cwd: __dirname})
        .pipe(plugins.debug())
        .pipe(gulp.dest(process.cwd()))
    ).on('end', done);
  });

  gulp.task('test', 'Perform unit tests only.', function (done) {
    gulp
      .src(gulp.options.paths.test, {read: false})
      .pipe(plugins.mocha(gulp.options.test))
      .pipe(end(done))
      .pipe(plugins.exit());
  });

  gulp.task('lint', 'Perform lint tests.', function () {
    return gulp
      .src(gulp.options.paths.lint, {read: false})
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter(stylish));
  });

  gulp.options.coverage = merge({
    coverageDirectory: gulp.options.paths.coverage.dest,
    rootDirectory: ''
  }, gulp.options.coverage);

  gulp.task('coverage', 'Perform coverage tests.', function (done) {
    gulp
      .src(gulp.options.paths.coverage.src)
      .pipe(plugins.istanbul())
      .on('finish', function () {
        var coverageError;
        gulp.src(gulp.options.paths.test)
          .pipe(plugins.mocha(gulp.options.test))
          .pipe(plugins.istanbul.writeReports({
            dir: gulp.options.paths.coverage.dest,
            reporters: ['json', 'lcov']
          }))
          .pipe(plugins.istanbulEnforcer(gulp.options.coverage))
          .on('error', function (error) {
            coverageError = error;
          })
          .on('end', function () {
            done(coverageError);
          })
          .pipe(plugins.exit());
      });
  });

  gulp.task('complexity', 'Perform complexity tests.', function () {
    return gulp.src(gulp.options.paths.lint)
      .pipe(plugins.complexity(gulp.options.complexity));
  });

};

