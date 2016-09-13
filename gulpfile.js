var gulp = require('gulp');
var util = require('gulp-util');
var plumber = require('gulp-plumber');
var less = require('gulp-less');
var include = require("gulp-include");
var rename = require("gulp-rename");
var path = require('path');
var watch = require('gulp-watch');
var nunjucks = require('gulp-nunjucks');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var connect = require('gulp-connect');
var cssnano = require('gulp-cssnano');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var open = require('gulp-open');
var corsAnywhere = require('cors-anywhere');
var LessPluginAutoPrefix = require('less-plugin-autoprefix'),
    autoprefix= new LessPluginAutoPrefix({browsers: ["> 1%","last 4 versions"]});
var cache = require('gulp-cached');
var data = require('gulp-data');
var fm = require('front-matter');
var _ = require('underscore');

var config = {
	production : !!util.env.production
}

console.log('Production: ' + !!util.env.production);

function handleError (err) {

	console.log(err);
	this.emit('end');
}

gulp.task('clean', function () {
  return del.sync([
    'build/**/*',
  ]);
});

gulp.task('statics',function(){
	gulp.src(['source/statics/**/*'])
	.pipe(cache('staticscache', {
		optimizeMemory : true
	}))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(gulp.dest('build/statics/'))
	.pipe(connect.reload());
});

gulp.task('templates',function(){
	gulp.src(['source/templates/*.html'])
	/*.pipe(cache('templatescache', { // does not work with dependend files
		optimizeMemory : true
	}))*/
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(data(function(file) {

		function requireUncached(module){
			delete require.cache[require.resolve(module)]
			return require(module)
		}

		var appData = requireUncached('./source/data/index.js');

		var content = fm(String(file.contents));
		file.contents = new Buffer(content.body);

      return _.defaults(content.attributes, appData);;
    }))
	.pipe(nunjucks.compile())
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? htmlmin({
		collapseWhitespace: true
	}) : util.noop())
	.pipe(gulp.dest('build/'))
	.pipe(connect.reload());
});

gulp.task('styles',function(){
	gulp.src(['source/styles/*.{less,css}'])
	/*.pipe(cache('stylescache', { // does not work with dependend files
		//optimizeMemory : true
	}))*/
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? util.noop() : sourcemaps.init())
	.pipe(less({
		plugins: [autoprefix]
	}))
	.pipe(config.production ? util.noop() : sourcemaps.write())
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? cssnano() : util.noop())
	.pipe(gulp.dest('build/styles/'))
	.pipe(connect.reload());
});

gulp.task('scripts',function(){
	gulp.src(['source/scripts/*.js'])
	/*.pipe(cache('scriptscache', { // does not work with dependend files
		optimizeMemory : true
	}))*/
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? util.noop() : sourcemaps.init())
	.pipe(include())
	.pipe(config.production ? util.noop() : sourcemaps.write())
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? uglify() : util.noop())
	.pipe(gulp.dest('build/scripts/'))
	.pipe(connect.reload());
});

gulp.task('images',function(){
	gulp.src(['source/images/**/*.{jpg,png,gif,svg}'])
	.pipe(cache('imagescache', {
		optimizeMemory : true
	}))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? imagemin({
		progressive: true,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()]
	}) : util.noop())
	.pipe(gulp.dest('build/images/'))
	.pipe(connect.reload());
});

gulp.task('connect', function() {
	
	corsAnywhere.createServer({
		originWhitelist: [], // Allow all origins 
		httpProxyOptions : {
			//auth : 'test:test'
		}
	}).listen((process.env.PORT || 9090), 'localhost', function() {
		console.log('Running CORS Anywhere on ' + 'localhost' + ':' + (process.env.PORT || 9090));
	});
	
	connect.server({
		root: 'build',
		livereload: true
	});
});

gulp.task('openuri', function(){
	gulp.src('').pipe(open({uri: 'http://localhost:8080'}));
});

gulp.task(
	'default',
	['clean','templates','styles','scripts','images','statics','connect','openuri'],
	function(){
		
		watch(['source/templates/**/*.html','source/data/*.js'], function() {

			gulp.start('templates');
		});
		
		watch('source/styles/**/*.less', function() {

			gulp.start('styles');
		});
		
		watch('source/scripts/**/*.js', function() {

			gulp.start('scripts');
		});
		
		watch('source/images/**/*.{jpg,png,gif,svg}', function() {

			gulp.start('images');
		});
		
		watch('source/statics/**/*', function() {

			gulp.start('statics');
		});
	}
);