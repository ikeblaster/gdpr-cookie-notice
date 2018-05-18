var path = require('path'),
	gulp = require('gulp'),
	watch = require('gulp-watch'),
	sourcemaps = require('gulp-sourcemaps'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	notify = require('gulp-notify'),
	plumber = require('gulp-plumber'),
	sass = require('gulp-sass'),
	rename = require("gulp-rename"),
	browserify = require('gulp-browserify'),
	autoprefixer = require('gulp-autoprefixer'),
	http = require('http');
	ecstatic = require('ecstatic');
	htmlToJs = require('gulp-html-to-js'),
	html2js = require('gulp-html2js'),
	css2js = require('gulp-css2js'),
	replace = require('gulp-replace'),
	eslint = require('gulp-eslint');

var config = {
	javascript: {
		path: {
			src: path.join('src/js'),
			dist: path.join('dist')
		}
	},
	sass: {
		path: {
			src: path.join('src/sass'),
			dist: path.join('dist')
		}
	},
	html: {
		path: {
			src: path.join('src/html')
		}
	},
};

var onJSError = function(err) {
	notify({
		message: err
	});
};

gulp.task('sass', function() {
	return gulp.src(path.join(config.sass.path.src, '**', '*.scss'))
		//.pipe(sourcemaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
		.pipe(autoprefixer())
		//.pipe(sourcemaps.write("./"))
		.pipe(gulp.dest(config.sass.path.dist));
});

gulp.task('css2js', ['sass'], function() {
	return gulp.src(['dist/style.css'])
		.pipe(css2js({splitOnNewline: false}))
		.pipe(gulp.dest(config.javascript.path.src));
});

gulp.task('javascript', function() {
	return gulp.src(['node_modules/js-cookie/src/js.cookie.js', 'src/js/templates.js', 'src/js/script.js', 'src/langs/cs.js', 'src/js/style.js'])
		//.pipe(sourcemaps.init())
		.pipe(concat('cookieconsent.js'))
		.pipe(uglify())
		//.pipe(sourcemaps.write("./"))
		.pipe(replace(/^/, "/* cookies consent, v1 */\n"))
		.pipe(replace(/[^\p{L}\s!-~]/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; })) // accents

		.pipe(gulp.dest(config.javascript.path.dist))
});

gulp.task('html', function() {
	return gulp.src('src/html/*.html')
		.pipe(replace(/\s+/g, ' '))
		.pipe(html2js('templates.js', {
			adapter: 'javascript',
			base: 'src/html',
			name: 'gdpr-cookie-notice-templates',
		}))
		.pipe(gulp.dest(config.javascript.path.src));
});

gulp.task('lint',() => {
	return gulp.src(['src/js/script.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});

gulp.task("watch:sass", function() {
	return gulp.watch(path.join(config.sass.path.src, '**', '*.scss'), function() {
		return gulp.start('css2js');
	}, {read: false})
});

gulp.task("watch:javascript", function() {
	return watch(path.join('src', '**', '*.js'), function() {
		return gulp.start('javascript');
	}, {read: false});
});

gulp.task("watch:html", function() {
	return watch(path.join(config.html.path.src, '**', '*.html'), function() {
		return gulp.start('html');
	}, {read: false});
});


gulp.task('default', ['lint'], function() {
	http.createServer(
	  ecstatic({ root: __dirname })
	).listen(3000);

	console.log('Listening on :3000');

	gulp.start('watch:sass');
	gulp.start('watch:html');
	gulp.start('watch:javascript');
});
