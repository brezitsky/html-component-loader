const path = require('path')
const loaderUtils = require('loader-utils')
const fs = require('fs-extra')
const posthtml = require('posthtml')
const sass = require('node-sass')
const postcss = require('postcss')
const babel = require('babel-core')


module.exports = function(source) {
	let callback = this.async();
	// const options = loaderUtils.getLoaderConfig(this);
	const options = loaderUtils.getOptions(this);

	// console.log(source);
	// console.log('=============================');
	// console.log('options.src: ', options.src);
	// console.log('this.context: ', this.context);
	// console.log('this.resourcePath: ', this.resourcePath);
	// console.log('=============================');

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
		// console.log(result.tree);
		callback(null, result.html);
	}

	let plugin = () => {
		return function MY_PLUGIN(tree) {
			// console.log(this);
			// console.log(tree);

			tree.match({ tag: 'style' }, node => {
				// console.log(node);

				let text;

				if(node.attrs.scope) {
					text = `.${node.attrs.scope} {${node.content[0]}}`
				}
				else {
					text = node.content[0];
				}

				/*
				створи тимчасовий файл і підключим його в штмл файл, щоб можна було
				обробити його лоадером
				*/
				// let p = path.resolve(options.src, `.tmp/_${new Date().getTime()}.scss`);

				// fs.outputFileSync(p, text);

				// node.content[0] = `\${require('${p}')}`;

				// console.log(path.resolve(options.src, `.tmp/_${new Date().getTime()}.scss`));

				let scss = sass.renderSync({
					data: text,
					outputStyle: 'compressed',
					sourceComments: false
				})

				// console.log(scss.css.toString());

				let css = postcss([require('autoprefixer')]).process(scss.css.toString()).css

				node.content[0] = `\n${css}`;

				node.attrs = {
					type: 'text/css'
				}

				return node;
			})

			tree.match({ tag: 'script' }, node => {

				let options = {
					ast: false,
					presets: ['es2015']
				};

				if(typeof node.attrs.stack === 'string') {
					let content = '';
					node.content.forEach(block => {
						content += block;
					});
					node.content = [];
					node.content[0] = `\nEXE(function($) {\n${babel.transform(content, options).code}\n})\n`;
				}

				node.attrs = {
					'type': 'text/javascript'
				};

				return node;
			})

			return tree;
		}
	}

	posthtml([plugin()]).process(source).then(success, error)
};
