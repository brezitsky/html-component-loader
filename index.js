const path 			= 	require('path')
const loaderUtils = 	require('loader-utils')
const fs 			= 	require('fs-extra')
const posthtml 	= 	require('posthtml')
const sass 			= 	require('node-sass')
const postcss 		= 	require('postcss')
const babel 		= 	require('babel-core')

let scopesSCSS = 	[];
let scopesJS 	= 	[];

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
		return function HTML_COMPONENT_LOADER(tree) {

			tree.match({ tag: 'style' }, node => {

				/*
				Дивимся на наявність атрибута "scope".
				Якщо він є, то працюєм із тегом.
				*/
				if(node.attrs.hasOwnProperty('scope')) {

					/*
					У продакшн-моді ми видираєм інлайнові стилі та скріпти в окремі файли.
					Це сильно б'є по швидкодії і не працює при дев-моді.
					Тому логіка розділена на продакшн і девелопмент.
					*/
					if(process.env.NODE_ENV === 'production') {

						let flag = true;

						for(let i = 0; i < scopesSCSS.length; i++) {
							if(node.attrs.scope == scopesSCSS[i]) {
								flag = false;
								break;
							}
						}

						if(flag) {
							scopesSCSS.push(node.attrs.scope);

							try {
								let scss = sass.renderSync({
									data: node.content[0],
									outputStyle: 'compressed',
									sourceComments: false
								})

								let css = postcss([require('autoprefixer')]).process(scss.css.toString()).css

								fs.writeFileSync(path.resolve(options.src, '.tmp/inline.css'), `/* SCOPE = ${node.attrs.scope} */\n${css}\n`, {flag: 'a+'});
							}
							catch(e) {
								console.log(e);
							}
						}

						node = '';
					}

					/*
					Не продакшн-мод (скоріш за все, девелопмент).
					Запускаєм стару версію лоадера.
					Вона впихає інлайново, працює шидко.
					*/
					else {
						let text;

						text = node.content[0];

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
					}

				}


				return node;
			})

			tree.match({ tag: 'script' }, node => {

				/*
				Дивимся на наявність атрибута "scope".
				Якщо він є, то працюєм із тегом.
				*/
				if(node.attrs.hasOwnProperty('scope')) {

					/*
					У продакшн-моді ми видираєм інлайнові стилі та скріпти в окремі файли.
					Це сильно б'є по швидкодії і не працює при дев-моді.
					Тому логіка розділена на продакшн і девелопмент.
					*/
					if(process.env.NODE_ENV === 'production') {
						let flag = true;

						for(let i = 0; i < scopesJS.length; i++) {
							if(node.attrs.scope == scopesJS[i]) {
								flag = false;
								break;
							}
						}

						if(flag) {

							try {
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
							}
							catch(e) {
								console.log(e);
							}

						}
					}


					node = '';
				}

				/*
				Не продакшн-мод (скоріш за все, девелопмент).
				Запускаєм стару версію лоадера.
				Вона впихає інлайново, працює шидко.
				*/
				else {
					let options = {
						ast: false,
						presets: ['es2015']
					};

					if(node.attrs.hasOwnProperty('scope')) {
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
				}

				return node;
			})

			return tree;
		}
	}

	posthtml([plugin()]).process(source).then(success, error)
};
