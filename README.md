# Yet another frontend build process #

By the way - The hipster name of this project is: YAFBP

This front-end build process is more for old-school developers but uses the newest tools to get you up and running fast.
Use it as it is or as a boilerplate or tutorial for your own build process.

## Design decisions: ##

* Templates should be readable like simple HTML but super powers are needed.
* No non-standard javascript-Module-System.
* No Sass because Less is more javascript.
* No icon-fonts because inline-SVGs are scriptable/stylable.
* No hassle with CORS in development.
* No time to for manually reloading a Browser.
* No time to write all these browser-prefixes.
* No time for manually optimizing images.

## Features ##

* Templating(Nunjucks)
* Scripting(Javascript)
* Styling(Less)
* Inline-SVG injection(Iconic's SVGInjector)
* Proxy(CORS Anywhere)
* Autoreload(Livereload)
* Autoprefixer(Less-autoprefix)
* Image optimization(Imagemin)
* Sourcemaps for styles and scripts


## Installation ##

If you have not already installed nodejs and npm: [https://nodejs.org/](https://nodejs.org/ "https://nodejs.org/")

If you have not already installed git: [https://git-scm.com](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git") (Optional)

Install gulp-cli via Terminal.

```
npm install --g gulp-cli
```

## Setup ##

Clone this repository via Terminal. Or just click on the download-button in the right corner...

```
git clone https://github.com/koljakutschera/yafbp && cd yafbp
```

Install dependencies via Terminal(Maybe sudo is needed).

```
npm install
```

## Usage ##

In the project directory start devserver with autoreload and watch for file-changes.

```
gulp
```

Or with minification for styles, scripts, images and html.

```
gulp --production
```

## Configuration ##

All the magic happens in /gulpfile.js. Feel free to configure/extend it to your needs.

## Templating ##

In **source/templates** [Nunjucks](https://mozilla.github.io/nunjucks/templating.html "Nunjucks") is used for templating with all its features like block inheritance(layouts), autoescaping, macros and more.
Every .html file on the root of the directory is compiled to the build/ directory. Templates on the root-level are your "pages".
Files in sub-directories are ignored, but can be used in root-templates via Nunjucks [template-inheritance-system](https://mozilla.github.io/nunjucks/templating.html#template-inheritance "Nunjucks template-inheritance"). 
The default directory structure is only a recommendation - feel free to delete everything and start from scratch.

Example: Simple Nunjucks-Template

```html
---
pagename: Home
---

{% extends "layouts/basic.html" %}

{% block meta %}
<title>{{ pagename }}</title>
{% endblock %}

{% block styles %}
<link rel="stylesheet" href="styles/home.css">
{% endblock %}

{% block body %}
<h1>Updated at: {{ build.date }}</h1>
{% include "partials/loremipsum.html" %}
<img data-inject="svg" data-src="/images/coffee.svg" class="coffee">
{% endblock %}

{% block scripts %}
<script type="text/javascript" src="scripts/home.js"></script>
{% endblock %}
```

See [https://mozilla.github.io/nunjucks/](https://mozilla.github.io/nunjucks/) for more.

### Templating with data ###

In **data/index.js** you can export global data to use it in all your templates.
This is how most static-page-generators work.
Think about generating navigation from json or reading data from csv-files.
You can import/require all the npm-modules or any other script via node's require.
The default directory structure is only a recommendation - feel free to delete everything except for data/index.js and start from scratch.

> Hint: There is a helper-function in data/tools/requireUncached.js to import node-modules uncached. Use this if you dont want node to cache your modules while watching files.

Example: Export build-date to templates.

```javascript
// data/index.js
module.exports = {
    // The following example data is accessible in all templates.
    build : {
        date : new Date()
    }
}
```

Example: Access build-date in templates:

```html
<h1>Updated at: {{ build.date }}</h1>
```

### Templating with YAML-Front-Matter ###

Also you can provide data directly to a template via **YAML-Front-Matter** at the top of each template.

> Hint: Data provided by YAML-Front-Matter overrides global data from data/index.js. Think about the possibilities.


Example: YAML-Front-Matter at the top of a template:

```
---
pagename: Home
---
```


Example: Access YAML-Front-Matter in template:

```html
<title>{{ pagename }}</title>
```


## Styling with Less ##

In **source/styles** every .less file on the root of the directory is compiled to the build/styles/ directory.
Files in sub-directories are ignored, but can be imported in root-stylesheets via less-imports.
The default directory structure is only a recommendation - feel free to delete everything and start from scratch.

For example and depending on your needs you can use one core.less file and import all stylesheets in it for single-page-apps. Or you can use the core.less file for shared styles and multiple other files for per-page styles in a multi-page setup.

> Hint: You can also pass options to less-imports. [http://lesscss.org/](http://lesscss.org/features/#import-options "import-options")

Example: Importing another stylesheet.

```less
@import "mod1/dep1.less";
```

See [http://lesscss.org/](http://lesscss.org/) for more.

## Scripting with Javascript ##

In **source/scripts** every .js file on the root of the directory is compiled to the build/scripts/ directory.
Files in sub-directories are ignored, but can be included in root-scripts via a special comment/directive.
The default directory structure is only a recommendation - feel free to delete everything and start from scratch.

Depending on your needs you can use one core.js file and require all libs and scripts in it for single-page-apps. Or you can use the core.js file for shared libraries and multiple other files for per-page scripts in a multi-page setup.

> Hint: Script including works recursively (files can include files that can include files, and so on)

Example: Importing another script.

```javascript
//=require mod1/dep1.js
```

See [https://www.npmjs.com/package/gulp-include](https://www.npmjs.com/package/gulp-include) for more.

## Images ##

In **source/images** every .jpg, .png, .gif and .svg file is compiled/optimized to the build/images/ directory.
The default directory structure is only a recommendation - feel free to delete everything and start from scratch.

### SVG Images ###

To unlock the full potential of SVG, including full element-level CSS styling and evaluation of embedded JavaScript,
 the full SVG markup must be included directly in the DOM. This is done by a fast, caching, dynamic inline-SVG DOM injection [library](https://github.com/iconic/SVGInjector "SVGInjector") that injects SVGs to img-tags as inline-code.

To inject an SVG just use an img-tag with data-inject="svg" and src="/path/to/svg" attributes.

> Hint: You can configure the SVG-injection in scripts/tools/injectSVGs.js

Example: Injecting an SVG

```html
<img data-inject="svg" src="/images/coffee.svg" class="coffee" alt="I need coffee">
```

Because browsersupport for SVG starts with IE9 you can use data-fallback attribute to set a per-element PNG fallback for older Browsers.

Example: Injecting an SVG with png-fallback:

```html
<img data-inject="svg" src="/images/coffee.svg" data-fallback="/images/coffee.png" class="coffee" alt="I need coffee">
```

If you want to animate/script an SVG via javascript you have to wait for the "all-SVGs-injected"-Event on document.

Example: Log when all SVGs are injected.

```javascript
$(document).on('all-SVGs-injected', function (event) {
    console.log('now you can animate/script the SVGs')
});
```

If you got dynamic views rendered by javascript you have to call window.injectSVGs in your script after the view is rendered to inject new SVGs. Already rendered SVGs are cached.

```javascript
window.injectSVGs();
```

See [Inline SVG vs Icon Fonts](https://css-tricks.com/icon-fonts-vs-svg/) and [https://github.com/iconic/SVGInjector](https://github.com/iconic/SVGInjector) for more.


## Static Files ##

In **source/statics** you can put fonts, media etc. Every file and directory is copied to the build/statics/ directory.


## Proxy ##

The proxy is listening on port: 9090. Use it for example if you cant access an api-endpoint via ajax because of Cross-Origin Resource Sharing (CORS).

> Hint: You can add http-authentication to the proxy in /gulpfile.js

Example: Proxy usage with jQuery:

```javascript
var proxy = 'http://localhost:9090/';
var endpoint = 'www.echojs.com/'; // change this to your api-endpoint.

$.getJSON(proxy + endpoint, function( data ) {
    console.log(data)
});
```

## Autoreload ##

When the build process is started a file-watcher watches for file-changes and autoreloads the browser on every change. Sometimes on first start you have to do a manual reload because the process is faster than the browser.

## Autoprefixer ##

When writing less/css browser-prefixes are automaticaly added. You can configure Browserversions in /gulpfile.js

## Where do I start? ##

This is just a starter with some basic example contents.
Just look at the contents of the source/ directory.
There are just a few example files that should be self-documenting.

To start from scratch -  You can delete everything in source/images/, source/scripts/, source/styles/, source/templates/ directories. In the data/ directory only /index.js is required.
For scripts and styles remember that files on the root-level act as entry-points.

Feel free to configure anything in /gulpfile.js to your needs.

## Contribution ##

Please don't! Except for bugs. Iam not interested in extending this project with more crazy stuff. This is just a starter.
If you want babel, react or your shiny whatever JS-Framework just fork this repo put it in and do it your self :P

## Thank you ##

Thank you to all funky developers listed in /package.json. Special thanks to Waybury for [SVGInjector](https://github.com/iconic/SVGInjector).

## Licence ##

The MIT License (MIT)

Copyright (c) 2016 [Kolja Kutschera](http://koljakutschera.de/ "Kolja Kutschera")

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.