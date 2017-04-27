const path = require('path')
const loaderUtils = require('loader-utils')

const posthtml = require('posthtml')

const sass = require('node-sass')
const postcss = require('postcss')


module.exports = function(source) {
	let callback = this.async();
	// const options = loaderUtils.getLoaderConfig(this);
	const options = loaderUtils.getOptions(this);

	// console.log(source);
	// console.log('=============================');
	// console.log(options.src);
	// console.log(this.context);
	// console.log(this.resourcePath);
	// console.log('=============================');

	if(options.src !== this.context) {

		// TODO: add variable, that will be contains 'src' path
		let block = this.resourcePath.replace(path.resolve(options.src, 'src'), '');
		block = block.replace(/\\/g, '/');

		source = `\n<!--#BEGIN#-->\n<!-- ${block} -->\n${source}\n<!--#END#-->\n`;
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
				// console.log(node.content.length);

				let text;

				if(node.attrs.scope) {
					text = `.${node.attrs.scope} {${node.content[0]}}`
				}
				else {
					text = node.content[0];
				}

				let scss = sass.renderSync({
					data: text,
					outputStyle: 'expanded',
					sourceComments: false
				})

				// console.log(scss.css.toString());

				let css = postcss([require('autoprefixer')]).process(scss.css.toString()).css

				node.content[0] = css;

				node.attrs = {
					type: 'text/css'
				}

				return node;
			})

			tree.match({ tag: 'script' }, node => {

				if(typeof node.attrs.stack === 'string') {
					node.content[0] = `\nEXE(function($) {\n${node.content[0]}\n})\n`;
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
