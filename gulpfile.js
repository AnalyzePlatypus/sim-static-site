// Imports

const fs = require("fs");
const { src, watch, symlink, dest, series, parallel } = require('gulp');
const  { execSync } = require("child_process");

var sass = require('gulp-sass');
sass.compiler = require('node-sass');

const postcss = require('gulp-postcss');

const replace = require('gulp-replace');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const uglifycss = require('gulp-uglifycss');
const terser = require('gulp-terser');
const rename = require("gulp-rename");

const { minify }  = require("terser");

/* Dev
1. Link Tailwind
2. Compile + link SCSS
3. Link JS libs (Alpine, clipboard)
4. Link custom libs

*/

// Fonts
// Production: <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,500;0,700;1,400;1,500;1,700&display=swap" rel="stylesheet">


const defaultTask = function() {
  execSync('node scripts/configJsonBuilder.js'); // Rebuild the JSON file once
  watch('src/**/*', series(
      removePreviousBuild,
      buildCss,
      buildHtml
    )
  );
}

const productionBuild = series(
  removeProductionBuild,
  buildProdHtml,
  buildProdJs,
  buildProdCss,  
)


function buildProdCss() {
  return src(['src/*.scss', 'src/*.css'])
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      require('tailwindcss'),
      require('autoprefixer'),
    ])).
    pipe(concat('styles.css')).
    pipe(uglifycss())
    .pipe(dest('dist'));
}

function buildProdJs() {
  return src([
    "node_modules/clipboard/dist/clipboard.js",
    "node_modules/alpinejs/dist/alpine.js",
    "src/javascript/bootstrap.min.js",
    "src/javascript/timeDifference.js"
  ]).
    pipe(concat("scripts.js")).
    pipe(terser()).
    pipe(dest("dist"))
}

async function buildProdHtml() {
  execSync('node scripts/configJsonBuilder.js'); // Build the latest config JSON

  const gitCommitHash = execSync('git rev-parse HEAD').toString();
  const configJson = "CHANNEL_CONFIG=" + fs.readFileSync("./config/config.built.json").toString();

  const mainHtmlPartial = fs.readFileSync("./src/partials/main.html");

  const buildInfo = {
    buildType: "prod",
    builtAt: new Date().toISOString(),
    commitHash: gitCommitHash
  };

  // return src('src/partials/main.html').
  return src('src/index.html').
    pipe(replace("<!-- INJECT_MAIN_HTML --->", mainHtmlPartial)).
    pipe(replace("/* INJECT_CONFIG_JSON */", configJson)).
    pipe(replace("/* INJECT_BUILD_INFO */", `window.BUILD_INFO=${JSON.stringify(buildInfo)};`)).
    pipe(replace("<!-- TAILWIND_DEV -->", "")).
    pipe(replace("<!-- JS_LIBS -->", `<script src="scripts.js"></script>`)).
    pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.css">`)).
    pipe(dest('dist'));
}


function removePreviousBuild() {
  return src('tmp', {read: false, allowEmpty: true})
    .pipe(clean());
}

function removeProductionBuild() {
  return src('dist', {read: false, allowEmpty: true})
    .pipe(clean());
}


async function buildHtml() {
  // Symlink the prebuild Tailwind file into /tmp #perfmatters
  src('dev_static/tailwind_full.css')
    .pipe(symlink('tmp/'));

  src("node_modules/alpinejs/dist/alpine.js")
    .pipe(symlink('tmp/'));
  
  src("node_modules/clipboard/dist/clipboard.js",)
    .pipe(symlink('tmp/'));

  src("src/bootstrap-theme.min.css")
    .pipe(symlink('tmp/'));
  
  src("src/bootstrap.min.css")
    .pipe(symlink('tmp/'));
  
  src("src/javascript/bootstrap.min.js")
    .pipe(symlink('tmp/'));
  
  
  
    const javascriptToInline = fs.readFileSync("src/javascript/timeDifference.js");
    const inlinedJsScriptTag = `<script>${javascriptToInline}</script>`;

    const mainHtmlPartial = fs.readFileSync("./src/partials/main.html");
    const configJson = "CHANNEL_CONFIG=" + fs.readFileSync("./config/config.built.json").toString();

    const buildInfo = {
      buildType: "dev",
      builtAt: new Date().toISOString(),
      commitHash: ""
    }


    // Inject a link to the stylesheet into the HTML
    return src('src/index.html').
      pipe(replace("<!-- INJECT_MAIN_HTML --->", mainHtmlPartial)).
      pipe(replace("/* INJECT_CONFIG_JSON */", configJson)).
      pipe(replace("/* INJECT_BUILD_INFO */", `window.BUILD_INFO=${JSON.stringify(buildInfo)};`)).
      pipe(replace("<!-- TAILWIND_DEV -->", "<link rel=\"stylesheet\" href=\"tailwind_full.css\">")).
      pipe(replace("<!-- JS_LIBS -->", `<script src=\"alpine.js\"><script src="clipboard.js"></script></script><script src=\"bootstrap.min.js\"></script>`)).
      pipe(replace("<!-- CSS -->", `<link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="bootstrap.min.css"><link rel="stylesheet" href="bootstrap-theme.min.css">`)).
      pipe(replace("<!-- JS_INLINE -->", inlinedJsScriptTag)).
      pipe(dest('tmp'));
}


async function buildCss (cb) {
  return src('src/styles.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('tmp'));
}


exports.default = defaultTask
exports.build = productionBuild;