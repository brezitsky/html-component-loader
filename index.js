const path = require('path')
const loaderUtils = require('loader-utils')
const fs = require('fs-extra')
const posthtml = require('posthtml')
const sass = require('node-sass')
const postcss = require('postcss')
const babel = require('babel-core')

let scopesSCSS = [];
let scopesJS = [];

module.exports = function(source) {
	let callback = this.async();

	const options = loaderUtils.getOptions(this);


	if(this.context !== options.src) {

		// TODO: add variable, that will be contains 'src' path
		let block = this.resourcePath.replace(path.resolve(options.src, 'src'), '');
		block = block.replace(/\\/g, '/');

		let time = new Date().getTime();
		source = `\n<!--#BEGIN-${time}#-->\n<!-- ${block} -->\n<!-- #TIME=${time}# -->\n${source}\n<!--#END-${time}#-->\n`;
	}

	let error = error => {
		callback(error);
	}

	let success = result => {
		callback(null, result.html);
	}

	let plugin = () => {
		return function MY_PLUGIN(tree) {

			tree.match({ tag: 'style' }, node => {

				if(node.attrs.hasOwnProperty('scope')) {
					let flag = true;

					for(let i = 0; i < scopesSCSS.length; i++) {
						if(node.attrs.scope == scopesSCSS[i]) {
							flag = false;
							break;
						}
					}

					if(flag) {
						scopesSCSS.push(node.attrs.scope);

						let scss = sass.renderSync({
							data: node.content[0],
							outputStyle: 'compressed',
							sourceComments: false
						})

						let css = postcss([require('autoprefixer')]).process(scss.css.toString()).css

						fs.writeFileSync(path.resolve(options.src, '.tmp/inline.css'), `/* SCOPE = ${node.attrs.scope} */\n${css}\n`, {flag: 'a+'});

						node = '';
					}
				}

				return node;
			})

			tree.match({ tag: 'script' }, node => {

				if(node.attrs.hasOwnProperty('scope')) {
					let flag = true;

					for(let i = 0; i < scopesJS.length; i++) {
						if(node.attrs.scope == scopesJS[i]) {
							flag = false;
							break;
						}
					}

					if(flag) {

						scopesJS.push(node.attrs.scope);

						let opts = {
							ast: false,
							presets: ['es2015'],
							comments: false,
							minified: true
						};

						let content = '';

						node.content.map(block => {
							content += block;
						});

						fs.writeFileSync(
							path.resolve(options.src, '.tmp/inline.js'),
							`/* SCOPE = ${node.attrs.scope} */\nEXE(function($) {if(document.querySelectorAll('${node.attrs.scope}').length) {${babel.transform(content, opts).code}}})\n`,
							{flag: 'a+'});

						node = '';
					}
				}




				return node;
			})

			return tree;
		}
	}

	posthtml([plugin()]).process(source).then(success, error)
};
