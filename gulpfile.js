var gulp = require('gulp');
var util = require('gulp-util');
var plumber = require('gulp-plumber');
var less = require('gulp-less');
var include = require("gulp-include");
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
var gulpData = require('gulp-data');
var fm = require('front-matter');
var _ = require('underscore');
var fs = require('fs');
var sitemap = require('gulp-sitemap');
var accounting = require('accounting');
var ngrok = require('ngrok');
var psi = require('psi');
var purify = require('gulp-purifycss');

// Configuration - Change to your needs...
var config = {
	source_dir : './source/',
	build_dir : './build/',
	statics_dir : 'statics/',
	templates_dir : 'templates/',
	data_dir : 'data/',
	styles_dir : 'styles/',
	scripts_dir : 'scripts/',
	images_dir : 'images/',
	connect_port : 8080,
	proxy_port : 9090,
	proxyAuth : '', // 'user:passw'
	autoprefix : ["> 1%","last 4 versions"], // https://github.com/ai/browserslist#queries
}

config.production = !!util.env.production; // do not change!
config.tunnel = !!util.env.tunnel; // do not change!
config.psi = !!util.env.psi; // do not change!
config.purify = !!util.env.purify; // do not change!

// Configure autoprefixing
var autoprefix = new LessPluginAutoPrefix({browsers: config.autoprefix});

// We will use our own nunjucks environment...
var nunjucksEnv = nunjucks.configure(config.source_dir + config.templates_dir, {
	noCache : true,
});

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
    config.build_dir + '**/*',
  ]);
});

// Statics
gulp.task('statics',function(){
	gulp.src([config.source_dir + config.statics_dir + '**/*'])
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(gulp.dest(config.build_dir + config.statics_dir))
	.pipe(connect.reload());
});

// Templates
gulp.task('templates',function(){
	gulp.src([config.source_dir + config.templates_dir + '[^_]*.html'])
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(gulpData(function(file) {

		var data = {};
		var fileName = file.relative;
		var fileContent = fm(String(file.contents));
		//file.contents = new Buffer(fileContent.body);

		// delete page-obj from pages-data if template gets deleted/renamed
		// todo: check performance
		_.each(dataPages, function (value, key, list) {

			try {
				fs.statSync(config.source_dir + config.templates_dir + key +'.html');
			} catch(err) {
				
				delete dataPages[key];
			}
		});

		// cut off .html from filename for pages-data obj
		if (fileName.indexOf('.html') >= 0) {
			fileName = fileName.slice(0, -5);
		}

		// adding page-data to pages-data...
		dataPages[fileName] = fileContent.attributes;
		dataPages[fileName].path = file.relative;

		// collecting data...
		data.global = requireUncached(config.source_dir + config.data_dir + 'index.js');
		data.pages = dataPages;
		data.page = fileContent.attributes;
		data.page.path = file.relative;

		// siteUrl is used by sitemap-generator
		siteUrl = data.global.siteUrl;
		// global- and pages data added to nunjucks-environment = accessible in macros too
		nunjucksEnv.addGlobal('global', data.global);
		nunjucksEnv.addGlobal('pages', data.pages)

		// write global and pages to json-file for ajax access
		// todo: check performance
		try {
			fs.writeFileSync(config.build_dir + 'data.json', JSON.stringify({
				global : data.global,
				pages : data.pages
			}, null, 2) , 'utf-8');
		} catch(err) {

			console.log(config.build_dir + 'data.json not writable')
		}

		// only page-data is directly returned to template
		return {
			page : data.page
		};
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
	.pipe(gulp.dest(config.build_dir))
	.pipe(connect.reload());
});

// Sitemap
gulp.task('sitemap', function () {
	gulp.src([config.source_dir + config.templates_dir + '[^_]*.html'], {
		read: false
	})
	.pipe(sitemap({
		siteUrl: require(config.source_dir + config.data_dir + 'index.js').siteUrl
	}))
	.pipe(gulp.dest(config.build_dir));
});

// Styles
gulp.task('styles',function(){
	gulp.src([config.source_dir + config.styles_dir + '[^_]*.{less,css}'])
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? util.noop() : sourcemaps.init())
	.pipe(less({
		plugins: [autoprefix]
	}))
	.pipe(config.production ? util.noop() : sourcemaps.write(''))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.purify ? purify([config.source_dir + config.scripts_dir + '[^_]*.js', config.source_dir + config.templates_dir + '[^_]*.html']) : util.noop())	
	.pipe(config.production ? cssnano() : util.noop())
	.pipe(gulp.dest(config.build_dir + config.styles_dir))
	.pipe(connect.reload());
});

// Scripts
gulp.task('scripts',function(){
	gulp.src([config.source_dir + config.scripts_dir + '[^_]*.js'])
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? util.noop() : sourcemaps.init())
	.pipe(include())
	.pipe(config.production ? util.noop() : sourcemaps.write(''))
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? uglify() : util.noop())
	.pipe(gulp.dest(config.build_dir + config.scripts_dir))
	.pipe(connect.reload());
});

// Images
gulp.task('images',function(){
	gulp.src([config.source_dir + config.images_dir + '**/*.{jpg,png,gif,svg}'])
	.pipe(plumber({
		handleError: handleError
	}))
	.pipe(config.production ? imagemin({
		progressive: true,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()]
	}) : util.noop())
	.pipe(gulp.dest(config.build_dir + config.images_dir))
	.pipe(connect.reload());
});

// Connect
gulp.task('connect', function() {

	var httpProxyOptions = {};

	if(config.proxyAuth && config.proxyAuth.length > 0){

		httpProxyOptions.auth = config.proxyAuth;
	}
	
	corsAnywhere.createServer({
		originWhitelist: [],
		httpProxyOptions : httpProxyOptions
	}).listen(config.proxy_port, 'localhost', function() {
		console.log('Running CORS Anywhere on ' + 'localhost' + ':' + config.proxy_port);
	});
	
	connect.server({
		root: config.build_dir,
		livereload: true,
		port: config.connect_port
	});
});

// Openuri
gulp.task('openuri', function(){
	gulp.src(config.build_dir + '*',{
		read: false
	}).pipe(open({uri: 'http://localhost:' + config.connect_port}));
});

gulp.task('tunnel', function(cb) {
	return ngrok.connect({
		proto: 'http', // http|tcp|tls 
		addr: config.connect_port, // port or network address 
		//auth: 'yafbp:yafbp', // http basic authentication for tunnel 
		//subdomain: 'alex', // reserved tunnel name https://alex.ngrok.io 
		//authtoken: '12345', // your authtoken from ngrok.com 
		//region: 'eu' // one of ngrok regions (us, eu, au, ap), defaults to us 
	}, function (err, url) {
		site = url;
		console.log('Exposing localhost:'+ config.connect_port +' via public URL: ' + site);

		cb();

		if(config.psi){

			_.each(dataPages, function (value, key, list) {

				console.log('Awaiting psi-report for: ' + url + '/' + key +'.html');

				psi.output(url + '/' + key +'.html',{
					nokey: 'true', // or use key: ‘YOUR_API_KEY’
					strategy: 'desktop',
				}).then(() => {
					
					psi.output(url + '/' + key +'.html',{
						nokey: 'true', // or use key: ‘YOUR_API_KEY’
						strategy: 'mobile',
					});
				});
			});
		}
  });
});

// Default task
gulp.task(
	'default',
	['clean','templates','styles','scripts','images','statics','connect','sitemap'],
	function(){

		// WATCHERS
		watch([config.source_dir + config.templates_dir + '**/*.html', config.source_dir + config.data_dir + '*.{js,json}'], {
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('templates');
		});

		watch([config.source_dir + config.templates_dir + '**/*.html'], {
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('sitemap');
		});
		
		watch(config.source_dir + config.styles_dir + '**/*.{less,css}', {
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('styles');
		});
		
		watch(config.source_dir + config.scripts_dir + '**/*.js', {
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('scripts');
		});
		
		watch(config.source_dir + config.images_dir + '**/*.{jpg,png,gif,svg}',	{
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('images');
		});
		
		watch(config.source_dir + config.statics_dir + '**/*', {
			read: false,
			readDelay: 100
		}, function() {

			gulp.start('statics');
		});

		// Workaround for indexing all pages data on first run(only)
		setTimeout(function () {

			console.log('Running templates again to index initial data.');

			gulp.start('templates'); // templates must be triggert twice because not all pages are indexed in dataPages in the first run

			setTimeout(function () {

				gulp.start('openuri');

				if(config.tunnel){

					gulp.start('tunnel');
				}
			}, 1000);
		}, 1000);
	}
);