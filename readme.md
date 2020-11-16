# SIM Static Site

🔥 Static Site for SIM conference

## Architecture


* Static files are manually uploaded to the Wordpress file system
* HTML is included in the Wordpress page using [CSI.js](https://github.com/LexmarkWeb/csi.js)
* When the page is loaded, JS in the static page executes, parsing the injected JSON and rendering the schedule.


## Development

Custom build script powered by Gulp.

```bash
npm i
gulp # Watches source directory and autorebuilds on changes. 
# you'll need to manually reload the browser (Cmd + R in Chrome)
```

> Slow build systems should not exist. This build script is optimized to run everything blazing fast. In live rebuild mode the site rebuilds in less than 16ms. Production builds take less than 4 seconds (most of which is Tailwind stripping away all unused CSS styles)

## Customization

The UI is generated from several config files.
* `config/schedules` Contains TSV files that hold the channel schedules. See the example file `/config/example.tsv`
* `/config/config.json` Configures all UI - the titles, links, and channel details. Each channel should specify a TSV file within `config/schedules` that contains its schedule. See the example file `/config/config.example.json`

Edit these files to change the UI.
These files are all combined into a single JSON file (`/configs/config.built.json`) that Gulp injects directly into the page HTML.

> To pick up changes to these files, you'll need to stop and restart `gulp`. You can also run `npm run build-config-json` to update `config.built.json`, and then change an HTML file to force a reload.

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
deploy.sh # Builds and uploads to S3
```

> To deploy to WordPress, manually copy these files into your WordPress file system. See _Deploying on WordPress_ below.

## Thank You

* [Alpine.js](https://github.com/alpinejs/alpine) (JS microframework)
* [Tailwind CSS](https://tailwindcss.com) (Totally awesome CSS utilities)
* [Bootstrap's modal component](https://getbootstrap.com/docs/4.5/components/modal/) The WordPress site already uses Bootstrap anyway 🤷‍♂️
* [FeatherIcons](https://feathericons.com) Icons, embedded as SVGs
* [Clipboard.js](https://github.com/zenorocha/clipboard.js) Cross-platform clipboard library
* [Gulp](https://gulpjs.com) (Build scripts) + a dozen Gulp plugins


## Appendixes

### Deploying on Wordpress

1. `gulp build`
2. Copy the contents of `/dist` to `/wp-content/themes/sim-static/`
3. In the page you'd like to embed, drop in the following code in HTML blocks:

```html
<script>
// csi.min.js 
// From https://github.com/LexmarkWeb/csi.js
window.onload=function(){function a(a,b){var c=/^(?:file):/,d=new XMLHttpRequest,e=0;d.onreadystatechange=function(){4==d.readyState&&(e=d.status),c.test(location.href)&&d.responseText&&(e=200),4==d.readyState&&200==e&&(a.outerHTML=d.responseText)};try{d.open("GET",b,!0),d.send()}catch(f){}}var b,c=document.getElementsByTagName("*");for(b in c)c[b].hasAttribute&&c[b].hasAttribute("data-include")&&a(c[b],c[b].getAttribute("data-include"))};
</script>

<div data-include="/wp-content/themes/sim-static/main.html"></div>
```

```html
<link rel="stylesheet" href="/wp-content/themes/sim-static/styles.css"> 
<script src="/wp-content/themes/sim-static/scripts.js"></script> 
<script>
<!--- Embed the contents of the first script tag in main.html here--->
</script> 
```