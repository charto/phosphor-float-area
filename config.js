System.config({
	map: {
		crypto: '@empty',
		css: 'www/js/css.js'
	},


	paths: {
		'node_modules/': 'www/modules/',
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
