// index.js

var assert = require( 'assert' ).ok;
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
