System.config({
	transpiler: false,

	map: {
		crypto: '@empty',
		css: 'node_modules/systemjs-plugin-css/css.js'
	},

	meta: {
		'dist/bundle.js': {
			format: 'system'
		}
	},

	packages: {
		'dist/': {
			defaultExtension: 'js',
			meta: {
				'*.css': { loader: 'css' }
			}
		},
		'test/': {
			defaultExtension: 'js',
			meta: {
				'*.css': { loader: 'css' }
			}
		}
	}
});
