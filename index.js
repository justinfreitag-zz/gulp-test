'use strict';

var merge = require('merge');
var plugins = require('gulp-load-plugins')();
var stylish = require('jshint-stylish');
var map = require('map-stream');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var mapstream = require('map-stream');

var DEFAULT_OPTIONS = {
  paths: {
    complexity: 'target/complexity',
    coverage: {
      src: [
        'index.js',
        'lib/**/*.js'
      ],
      target: 'target/coverage'
    },
    lint: [
      '*.js',
      'lib/**/*.js',
      'test/**/*.js',
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
  lint: {
  },
  'package': {
    spec: 'npm',
    warnings: true,
    recommendations: true
  },
  test: {
    reporter: 'spec'
  }
};

var exitCode = 0;
var lintErrors = 0;

function handleError(error) {
  plugins.util.beep();
  plugins.util.log(error.message);
  exitCode = 1;
  process.emit('exit');
}

function lint(gulp) {
  return gulp.src(gulp.options.paths.lint)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter(stylish))
    .pipe(map(function (file, callback) {
      if (!file.jshint.success) {
        lintErrors += file.jshint.results.length;
        exitCode = 1;
      }
      callback(null, file);
    }));
}

function taskPassed(taskName) {
  var msg = "gulp '" + taskName + "' passed";
  console.log(plugins.util.colors.green(msg));
}

function lintOnEnd(gulp) {
}

function validatePackage(gulp) {
  return gulp.src('package.json')
    .pipe(plugins.nicePackage(gulp.options['package'], gulp.options['package']));
}

function cover(gulp, callback) {
  return gulp.src(gulp.options.paths.coverage.src)
    .pipe(plugins.istanbul())
    .on('finish', callback);
}

module.exports = function (gulp, options) {
  gulp.options = merge(DEFAULT_OPTIONS, options);

  require('gulp-help')(gulp);

  process.on('exit', function () {
    process.nextTick(function () {
      var msg = "gulp '" + gulp.seq + "' failed";
      console.log(plugins.util.colors.red(msg));
      process.exit(exitCode);
    });
  });

  gulp.task('default', ['lint', 'coverage', 'package']);

  gulp.task('test', function () {
    return gulp.src(gulp.options.paths.test)
      .pipe(plugins.mocha()(gulp.options.test))
      .on('error', function (error) {
        handleError(error);
      });
  });

  gulp.task('lint', function () {
    return lint(gulp).on('end', function () {
      var errorString = lintErrors + '';
      if (exitCode) {
        console.log(plugins.util.colors.magenta(errorString), 'errors\n');
        plugins.util.beep();
        process.emit('exit');
      } else {
        taskPassed('lint');
      }
    });
  });

  gulp.task('coverage', function () {
    return cover(gulp, function () {
      return gulp.src(gulp.options.paths.test)
        .pipe(plugins.mocha(gulp.options.test))
        .on('error', function (error) {
          handleError(error);
        })
        .pipe(plugins.istanbul.writeReports(gulp.options.paths.coverage.target))
        .pipe(plugins.istanbulEnforcer(gulp.options.coverage))
        .on('error', function (error) {
          handleError(error);
        });
        // not calling .on('end' due to bug
        // https://github.com/SBoudrias/gulp-istanbul/issues/22
    });
  });

  gulp.task('complexity', function (callback) {
    // TODO load jshintrc via jshint
    return callback();
  });
  /*
    fs.readFile(gulp.options.jshintrc.server, 'utf8', function (error, data) {
      if (error) {
        throw error;
      }

      var commentRemovalRegex = /\/\*.+?\*\/|\/\/.*(?=[\n\r])/g;
      var jshintJson = JSON.parse(data.replace(commentRemovalRegex, ''));

      gulp.src(gulp.options.paths.cover)
        .pipe(plato(gulp.options.paths.complexity.target, {
          jshint: {
            options: jshintJson
          },
          complexity: gulp.options.complexity
        }));

      gulp.src(gulp.options.paths.complexity.target + '/index.html')
        .pipe(open());

      callback();
    });
  });
  */

  gulp.task('package', function () {
    var valid = true;
    return validatePackage(gulp)
      .pipe(mapstream(function (file, callback) {
        valid = file.nicePackage.valid;
        callback(null, file);
      }))
      .on('end', function () {
        if (!valid) {
          process.emit('exit');
        }
      });
  });

};
