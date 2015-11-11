var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

// Plugins para montagem de webserver
var browserSync = require('browser-sync').create();
var modRewrite  = require('connect-modrewrite');

// Plugin para sequenciar tarefas
var runSequence = require('run-sequence');

// Plugins para deploy
var ftp = require('vinyl-ftp');
var minimist = require('minimist');


// Tasks de deploy para ambiente de develop e produção
gulp.task('deploy', function () {
    var args = minimist(process.argv.slice(2));
    var conn = ftp.create({
        host: 'brunoramalho.com.br',
        user: args.u,
        password: args.p,
        parallel: 5,
        maxConnections: 8,
        log: plugins.util.log
    });
    var path = '/public_html/develop';
    return gulp.src(['dist/**/*','.htaccess'])
        .pipe( conn.newer( path ) )
        .pipe( conn.dest( path ) );
});

gulp.task('deploy:prod', function () {
    var args = minimist(process.argv.slice(2));
    var conn = ftp.create({
        host: 'brunoramalho.com.br',
        user: args.u,
        password: args.p,
        parallel: 5,
        maxConnections: 8,
        log: plugins.util.log
    });
    var path = '/public_html';
    return gulp.src(['dist/**/*','.htaccess'])
        .pipe( conn.newer( path ) )
        .pipe( conn.dest( path ) );
});


// Task de criação de Template Cache do AngularJS
gulp.task('templates', function () {
    return gulp.src('src/views/**/*.html')
        .pipe(plugins.minifyHtml())
        .pipe(plugins.angularTemplatecache({
            standalone: true
        }))
        .pipe(gulp.dest('.tmp/js'))
        .pipe(browserSync.stream());
});


// Envio de fonts para a pasta de build do projeto
gulp.task('fonts', ['vendor:fonts'], function() {
    return gulp.src(['.tmp/fonts/*', 'src/fonts/**.{eot,ttf,svg,woff,woff2}'])
        .pipe(plugins.flatten())
        .pipe(gulp.dest('dist/fonts'));
});


// Compilação dos SASS para CSS
gulp.task('css', ['sass','vendor:css']);

gulp.task('sass', function () {
    return plugins.rubySass('src/sass/',{
            lineNumbers: true,
            stopOnError: true,
            emitCompileError: true,
            style: "expanded"
        })
        .on('error', function (err) {
            console.error('Error!', err.message);
        })
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.autoprefixer())
        .pipe(plugins.concat('app.css'))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest('.tmp/css'))
        .pipe(browserSync.stream());
});

gulp.task('css:dist', ['sass','vendor:css'], function () {
    return gulp.src(['.tmp/css/vendor.css','.tmp/css/**/*.css'])
        .pipe(plugins.concat('app.min.css'))
        .pipe(plugins.minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(gulp.dest('dist/css'));
});


// Envio de imagens para a pasta de build do projeto
gulp.task('images', function () {
    return gulp.src('src/imgs/**/*')
        .pipe(plugins.imagemin())
        .pipe(gulp.dest('dist/imgs'));
});


// JSHint, Concatenação e Minificação de arquivos JS do projeto
gulp.task('js', function () {
    return gulp.src('src/app/**/*.js')
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('.tmp/js'));
});

gulp.task('js:dist', ['js','templates','vendor:js'], function () {
    return gulp.src(['.tmp/js/vendor.js','.tmp/js/**/*.js'])
        .pipe(plugins.concat('app.min.js'))
        .pipe(plugins.uglify())
        .pipe(gulp.dest('dist/js'));
});


// Concatenação dos arquivos das dependencias do projeto
gulp.task('vendor:css', function(){
    return gulp.src('bower.json')
        .pipe(plugins.mainBowerFiles())
        .pipe(plugins.filter('**/*.css'))
        .pipe(plugins.flatten())
        .pipe(plugins.concat('vendor.css'))
        .pipe(gulp.dest('.tmp/css'));
});

gulp.task('vendor:js', function(){
    return gulp.src('bower.json')
        .pipe(plugins.mainBowerFiles())
        .pipe(plugins.filter('**/*.js'))
        .pipe(plugins.flatten())
        .pipe(plugins.concat('vendor.js'))
        .pipe(gulp.dest('.tmp/js'));
});

gulp.task('vendor:fonts', function() {
    return gulp.src('bower_components/**/fonts/*.{eot,ttf,svg,woff,woff2}')
        .pipe(plugins.flatten())
        .pipe(gulp.dest('.tmp/fonts'));
});


// Limpeza do projeto
gulp.task('clean', function () {
    return gulp.src(['.tmp'])
        .pipe(plugins.clean());
});

gulp.task('clean:all', ['clean'], function () {
    return gulp.src(['.sass-cache','dist'])
        .pipe(plugins.clean());
});


// Minificação do HTML para geração do build
gulp.task('html', function () {
    return gulp.src('src/index.html')
        .pipe(plugins.useref())
        .pipe(plugins.minifyHtml())
        .pipe(gulp.dest('dist'));
});


// Watch dos arquivos para desenvolvimento
gulp.task('watch' , ['default'], function() {
    gulp.watch('src/sass/**/*.sass', ['sass']);
    gulp.watch('src/app/**/*.js', ['js']);
    gulp.watch('src/views/**/*.html', ['templates']);
    gulp.watch('bower.json', ['vendor:css','vendor:js','vendor:fonts']);
});


// Servidor de arquivos para testes e desenvolvimento
gulp.task('serve', function () {
    browserSync.init({
        server: ['src','.tmp'],
        middleware: [
            modRewrite([
                '!\\.\\w+$ /index.html [L]'
            ])
        ]
    });
});


// Tarefas de testes
gulp.task('test:css', ['sass'], function(){
    return gulp.src('.tmp/css/app.css')
        .pipe(plugins.csslint())
        .pipe(plugins.csslint.reporter())
        .pipe(plugins.csslint.reporter('fail'));
});

gulp.task('test:js', function () {
    return gulp.src('src/app/**/*.js')
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'));
});


// Tasks de execução
gulp.task('default', function () {
    runSequence(['clean'], 'sass', 'vendor:css', 'vendor:fonts', 'js', 'vendor:js', 'templates', 'serve');
});

gulp.task('build', function () {
    runSequence(['clean:all'], 'css:dist', 'js:dist', 'fonts', 'images', 'html');
});
