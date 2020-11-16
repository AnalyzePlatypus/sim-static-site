# SIM Static Site

🔥 Static Site for 

* 🌍 Automatically translates to the users timezone
* ⚡ Entire site is 21 KB (!)
* 💪 100% Lighthouse performance score 
* 🤫 No network requests, servers, APIs or databases

## Architecture


* Static files (1 each of HTML, CSS, JS) are deployed to S3 behind Cloudfront (CDN)
* Wordpress site loads all in iFrame
* When the page is loaded, JS in the static page executes, parsing the injected JSON and rendering the schedule.


## Development

Custom build script powered by Gulp.

```bash
npm i
gulp # Watches source directory and autorebuilds on changes. 
# you'll need to manually reload the browder (Cmd + R in Chrome)
```

> Slow build systems should not exist. This build script is optimized to run everything blazing fast. In live rebuild mode the site rebuilds in less than 16ms. Production builds take less than 4 seconds (most of which is Tailwind stripping away all unused CSS styles)

## Deployment

There are two deployment modes:
1. Static page to S3
2. Static assets to upload to Wordpress

`gulp build` creates three files in `dist`:

* `index.html`
* `styles.css`
* `scripts.js`


```bash
gulp build # Builds dist directory
deploy.sh # Builds, uploads to S3, and calls the Lambda to generate the actual `index.html`.
```

## Thank You

* [Alpine.js](https://github.com/alpinejs/alpine) (JS microframework)
* [Tailwind CSS](https://tailwindcss.com) (Totally awesome CSS utilities)
* [FeatherIcons](https://feathericons.com) Icons, embedded as SVGs
* [Gulp](https://gulpjs.com) (Build scripts) + a dozen Gulp plugins
* AWS S3, Cloudfront, & Lambda


## Appendixes

### Deploying on Wordpress