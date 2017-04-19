const loaderUtils = require('loader-utils')
const posthtml = require('posthtml')
const postcss = require('posthtml-postcss')
const path = require('path')

const postcssPlugins = [
	require('autoprefixer')({ browsers: ['last 2 versions'] }),
	require('postcss-nested')
]
const postcssOptions = {}

const filterType = /^text\/css$/

module.exports = function(source) {
	// const options = loaderUtils.getLoaderConfig(this);
	// console.log(options);
	//

	let callback = this.async();

	posthtml(
		[postcss(postcssPlugins, postcssOptions, filterType)]
	)
		.process(source)
		.then(result => {
			// console.log(result);

			result.tree.match({ tag: 'style' }, node => {

				node.attrs = {
					type: 'text/css'
				}

				return node;
			})

			let html = result.html;

			if(this.resourcePath.search('block') != -1) {
				let blockName = path.basename(this.resourcePath, path.extname(this.resourcePath));

				html = `<!-- BEGIN of "${blockName}"-->\n<!-- file: "src/includes/blocks/${blockName}.html" -->\n${html}\n<!-- END of ${blockName} -->\n`
			}

			callback(null, html);
		})
};
