module.exports = function( grunt ) {

	"use strict";

	var fs = require( "fs" ),
		distpaths = [
			"dist/jquery.js",
			"dist/jquery.min.map",
			"dist/jquery.min.js"
		];

	// Process files for distribution
	grunt.registerTask( "dist", function() {
		var stored, flags, paths, nonascii;

		// Check for stored destination paths
		// ( set in dist/.destination.json )
		stored = Object.keys( grunt.config( "dst" ) );

		// Allow command line input as well
		flags = Object.keys( this.flags );

		// Combine all output target paths
		paths = [].concat( stored, flags ).filter(function( path ) {
			return path !== "*";
		});

		// Ensure the dist files are pure ASCII
		nonascii = false;

		distpaths.forEach(function( filename ) {
			var i, c,
				text = fs.readFileSync( filename, "utf8" );

			// Ensure files use only \n for line endings, not \r\n
			if ( /\x0d\x0a/.test( text ) ) {
				grunt.log.writeln( filename + ": Incorrect line endings (\\r\\n)" );
				nonascii = true;
			}

			// Ensure only ASCII chars so script tags don't need a charset attribute
			if ( text.length !== Buffer.byteLength( text, "utf8" ) ) {
				grunt.log.writeln( filename + ": Non-ASCII characters detected:" );
				for ( i = 0; i < text.length; i++ ) {
					c = text.charCodeAt( i );
					if ( c > 127 ) {
						grunt.log.writeln( "- position " + i + ": " + c );
						grunt.log.writeln( "-- " + text.substring( i - 20, i + 20 ) );
						break;
					}
				}
				nonascii = true;
			}

			// Modify map/min so that it points to files in the same folder;
			// see https://github.com/mishoo/UglifyJS2/issues/47
			if ( /\.map$/.test( filename ) ) {
				text = text.replace( /"dist\//g, "\"" );
				fs.writeFileSync( filename, text, "utf-8" );

			// Use our hard-coded sourceMap directive instead of the autogenerated one (#13274; #13776)
			} else if ( /\.min\.js$/.test( filename ) ) {
				i = 0;
				text = text.replace( /(?:\/\*|)\n?\/\/@\s*sourceMappingURL=.*(\n\*\/|)/g,
					function( match ) {
						if ( i++ ) {
							return "";
						}
						return match;
					});
				fs.writeFileSync( filename, text, "utf-8" );
			}

			// Optionally copy dist files to other locations
			paths.forEach(function( path ) {
				var created;

				if ( !/\/$/.test( path ) ) {
					path += "/";
				}

				created = path + filename.replace( "dist/", "" );
				grunt.file.write( created, text );
				grunt.log.writeln( "File '" + created + "' created." );
			});
		});

		return !nonascii;
	});
};
