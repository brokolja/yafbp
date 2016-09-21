var gulp = require('gulp');
var util = require('gulp-util');
var plumber = require('gulp-plumber');
var less = require('gulp-less');
var include = require("gulp-include");
var rename = require("gulp-rename");
var path = require('path');
var watch = require('gulp-watch');
var gulpNunjucks = require('gulp-nunjucks');
var nunjucks = require('nunjucks');
var moment = require('moment');
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
var LessPluginAutoPrefix = require('less-plugin-autoprefix');
var autoprefix = new LessPluginAutoPrefix({browsers: ["> 1%","last 4 versions"]});
var cache = require('gulp-cached');
var data = require('gulp-data');
var fm = require('front-matter');
var _ = require('underscore');
var fs = require('fs');
var sitemap = require('gulp-sitemap');
var accounting = require('accounting');

// Configuration
var config = {
	production : !!util.env.production
}

// We will use our own nunjucks environment...
var nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('./source/templates/'), {})

// ... because we want to add globals etc.
nunjucksEnv.addGlobal('moment', moment);
nunjucksEnv.addGlobal('accounting', accounting)

// This is where the data for all pages gets indexed
var dataPages = {};

// Handle gulp errors
function handleError (err) {

	console.log(err);
	this.emit('end');
}

// Require modules without caching them
function requireUncached(module){
	delete require.cache[require.resolve(module)]
	return require(module)
}

// Are we in production or development?
console.log('Production: ' + !!util.env.production);

// GULP TASKS

// Clean build directory
gulp.task('clean', function () {
  return del.sync([
    './build/**/*',
  ]);
});

// Statics
gulp.task('statics',function(){
	gulp.src(['./source/statics/**/*'])
	.pipe(cache('staticscache', {
		optimizeMemory : true
	}))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(gulp.dest('./build/statics/'))
	.pipe(connect.reload());
});

// Templates
gulp.task('templates',function(){
	gulp.src(['./source/templates/[^_]*.html'])
	/*.pipe(cache('templatescache', { // does not work with dependend files
		optimizeMemory : true
	}))*/
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(data(function(file) {

		var data;
		var fileName = file.relative;
		var fileContent = fm(String(file.contents));
		//file.contents = new Buffer(fileContent.body);

		if (fileName.indexOf('.html') >= 0) {
			fileName = fileName.slice(0, -5);
		}

		_.each(dataPages, function (value, key, list) {

			try {
				fs.statSync('./source/templates/' + key +'.html');
			} catch(err) {
				
				delete dataPages[key];
			}
		});

		dataPages[fileName] = fileContent.attributes;

		dataPages[fileName].path = file.relative;

		data = {
			global : requireUncached('./source/data/index.js'),
			pages : dataPages
		}

		siteUrl = data.global.siteUrl;

		try {
			fs.writeFileSync('./build/data.json', JSON.stringify(data, null, 2) , 'utf-8');
		} catch(err) {
			
			console.log('./build/data.json not writable')
		}

		data.page = fileContent.attributes;

		data.path = file.relative;

		return data;
    }))
	.pipe(gulpNunjucks.compile(null, {
		env : nunjucksEnv
	}))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? htmlmin({
		collapseWhitespace: true
	}) : util.noop())
	.pipe(gulp.dest('./build/'))
	.pipe(connect.reload());
});

// Sitemap
gulp.task('sitemap', function () {
	gulp.src(['./source/templates/[^_]*.html'], {
		read: false
	})
	.pipe(sitemap({
		siteUrl: require('./source/data/index.js').siteUrl
	}))
	.pipe(gulp.dest('./build/'));
});

// Styles
gulp.task('styles',function(){
	gulp.src(['./source/styles/[^_]*.{less,css}'])
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
	.pipe(gulp.dest('./build/styles/'))
	.pipe(connect.reload());
});

// Scripts
gulp.task('scripts',function(){
	gulp.src(['./source/scripts/[^_]*.js'])
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
	.pipe(gulp.dest('./build/scripts/'))
	.pipe(connect.reload());
});

// Images
gulp.task('images',function(){
	gulp.src(['./source/images/**/*.{jpg,png,gif,svg}'])
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
	.pipe(gulp.dest('./build/images/'))
	.pipe(connect.reload());
});

// Connect
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
		root: './build',
		livereload: true
	});
});

// Openuri
gulp.task('openuri', function(){
	gulp.src('./build/*',{
		read: false
	}).pipe(open({uri: 'http://localhost:8080'}));
});

// Default task
gulp.task(
	'default',
	['clean','templates','styles','scripts','images','statics','connect','sitemap'],
	function(){

		// WATCHERS

		watch(['source/templates/**/*.html','source/data/*.js'], function() {

			gulp.start('templates');
		});

		watch(['source/templates/**/*.html'], function() {

			gulp.start('sitemap');
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

		// Workaround for indexing all pages data on first run
		setTimeout(function () {

			console.log('Running templates again to index initial data.');

			gulp.start('templates'); // templates must be triggert twice because not all pages are indexed in dataPages in the first run

			setTimeout(function () {

				gulp.start('openuri');
			}, 1000);
		}, 1000);
	}
);