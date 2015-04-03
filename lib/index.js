// index.js

var path = require( 'path' );
var fs = require( 'fs' );
var parser = require( './parser' );
var compiler = require( './compiler' );
var writer = require( './writer' );

var compileToFunctionSource = exports.compileToFunctionSource = function compileToFunctionSource( sourceString ) {
	// something something $template and $json.
	return writer.toFunctionSource( compiler.compile( parser.parse( sourceString ) ) );
};

var compileToModuleSource = exports.compileToModuleSource = function compileToModuleSource( sourceString ) {
	return writer.toModuleSource( compiler.compile( parser.parse( sourceString ) ) );
};

var compileFileToFunction = exports.compileFileToFunction = function compileFileToFunction( fileName ) {
	var fileContents = fs.readFileSync( fileName, 'utf8' );
	var strippedFileContents = (fileContents.charCodeAt( 0 ) === 0xFEFF) ? fileContents.substr( 1 ) : fileContents;
	return compileToFunctionSource( fileContents );
};

var compileFile = exports.compileFile = function compileFile( fileName ) {
	var fileContents = fs.readFileSync( fileName, 'utf8' );
	var strippedFileContents = (fileContents.charCodeAt( 0 ) === 0xFEFF) ? fileContents.substr( 1 ) : fileContents;
	return compileToModuleSource( fileContents );
};

function getExts( filePath ) {
	var exts = [];
	var cext = '';

	do {
		cext = path.extname( filePath );
		if( cext ) {
			exts.push( cext );
		}
	} while( cext );

	return exts;
}

var loadTemplate = exports.loadTemplate = function loadTemplate( templatePath ) {
	var pathDir = path.dirname( templatePath );
	var templateExts;
	var templateFunctionSource;

	function resolveOtherPath( otherPath ) {
		var qualified = false;
		var resolvedPath;

		if( /^\.|^\//.test( otherPath ) ) {
			qualified = true;
			resolvedPath = path.resolve( pathDir, otherPath );
		}

		return { path: resolvedPath, qualified: qualified };
	}

	function $template( otherPath ) {
		var resolved = resolveOtherPath( otherPath );

		if( ! resolved.qualified ) {
			return require( resolved.path );
		}

		return loadTemplate( resolved.path );
	}

	function $json( otherPath ) {
		var resolved = resolveOtherPath( otherPath );
		var jsonSource;

		if( ! resolved.qualified ) {
			return require( resolved.path );
		}

		try {
			jsonSource = fs.readFileSync( resolved.path, 'utf8' );
		}
		catch( error ) {}

		if( ! jsonSource ) {
			var jsonExts = getExts( otherPath );

			if( jsonExts.indexOf( '.json' ) === -1 ) {
				resolved.path += '.json';
			}

			// if still not there, allow error to propagate.
			jsonSource = fs.readFileSync( resolved.path, 'utf8' );
		}

		return JSON.parse( jsonSource );
	}

	try {
		templateFunctionSource = compileFileToFunction( templatePath );
	}
	catch( error ) {}

	if( ! templateFunctionSource ) {
		templateExts = getExts( templatePath );

		if( templateExts.indexOf( '.jh' ) === -1 ) {
			templatePath = templatePath + '.jh';
		}

		// if this doesn't work either, throw.
		templateFunctionSource = compileFileToFunction( templatePath );
	}

	return eval( templateFunctionSource );
};
