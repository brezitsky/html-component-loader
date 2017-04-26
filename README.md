HTML Webpack Plugin
===================

[![NPM](https://nodei.co/npm/html-component-loader.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/html-component-loader/)

This is a [webpack](http://webpack.github.io/) loader for html files, that are
looks like 'components': contain `html`, inline `js` and `scss`.

Maintainer: vtlk [@vtlk7](http://telegram.me/vtlk7)

Installation
------------
Install the plugin with npm:
```shell
$ npm install html-component-loader --save-dev
```

Important
---------
It works with [html-loader](https://webpack.js.org/loaders/html-loader/).

Basic Usage
-----------

```javascript
var webpackConfig = {
	...
	module: [
		{
			test: /\.html$/,
			use: [
				{
					loader: 'html-loader',
					options: {
						minimize: false,
						interpolate: 'require',
						attrs: false
					}
				},
				{
					loader: 'html-component-loader',
					options: {
						src: __dirname
					}
				}
			]
		}
	],
	...
};
```

This will generate from this:
```html
<!DOCTYPE html>
<html lang="en">
<head>
	${require('./src/includes/head.html')}
</head>
<body>
	<div class="row">
		<div class="cols s_12">12</div>
		<div class="cols s_12">12</div>
	</div>

	<div class="row">
		<div class="cols s_24">
			<img src="img/logo.png" alt="">
		</div>
	</div>

	${require('./src/includes/blocks/some.html')}

	<div id="app"></div>
</body>
</html>
```
this:
```html
<!DOCTYPE html>
<html lang="en">
<head>

	<!--#BEGIN#-->
	<!-- /includes/head.html -->
	<meta charset="utf-8">
	<title>vue-simple</title>

	<script>
	window.STACK = [];
	function EXE(func) {
		STACK.push(func);
	}
	</script>
	<!--#END#-->

	<link href="bundles/commons.css" rel="stylesheet">
	<link href="bundles/index.css" rel="stylesheet">
</head>
<body>
	<div class="row">
		<div class="cols s_12">12</div>
		<div class="cols s_12">12</div>
	</div>

	<div class="row">
		<div class="cols s_24">
			<img src="img/logo.png" alt="">
		</div>
	</div>


	<!--#BEGIN#-->
	<!-- /includes/blocks/some.html -->
	<div class="Some">
		<span>hello world</span>
	</div>

	<style type="text/css">.Some {
		-webkit-transition: all 300ms ease;
		transition: all 300ms ease;
		background-color: red;
	}

	.Some span {
		display: -webkit-box;
		display: -ms-flexbox;
		display: flex;
		-webkit-box-pack: center;
		-ms-flex-pack: center;
		justify-content: center;
	}

	.Some span:after {
		content: 'qwd';
	}
	</style>

	<script type="text/javascript">
	EXE(function($) {
		console.log('i am Some!');
		console.log($('#body'));
	})
	</script>
	<!--#END#-->

	<div id="app"></div>
	<script type="text/javascript" src="bundles/commons.js"></script>
	<script type="text/javascript" src="bundles/index.bundle.js"></script>
</body>
</html>
```

As you are see, this loader just preprocess your included html components
and inject transformed code into main html file.

Example of `/includes/blocks/some.html`
```html
<div class='Some'>
	<span>hello world</span>
</div>

<style lang='scss' scope='Some'>
@import "scss/wanted";

@include single-transition;
background-color: red;

span {
	display: flex;
	justify-content: center;

	&:after {
		content: 'qwd';
	}
}
</style>

<script stack>
	console.log('i am Some!');
	console.log($('#body'));
</script>
```

Configuration
-------------
Allowed values are as follows:

- `src`: root of your project directory (`__dirname`)


# License

This project is licensed under [MIT](https://github.com/jantimon/html-webpack-plugin/blob/master/LICENSE).
