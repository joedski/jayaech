// converter.js
// convert a template compilation product into various JS source strings.

var functionPreamble = [
	"(function template( $item, $index, $iterable ){",
	"    $item = $item || {};",
	"    function write( thing ) {",
	"        if( thing instanceof Array ) {",
	"            output += thing.join( '' );",
	"        }",
	"        else {",
	"            output += String( thing );",
	"        }",
	"    }",
	"    var output = '';"//,
	// "    with( $item ) {"
].join( '\n' );

var functionPostamble = [
	// "    }",
	"    return output;",
	"})"
].join( '\n' );

var modulePreamble = [
	"function $template( path, context ) {",
	"    var t = require( path );",
	"    if( context ) {",
	"        return t( context );",
	"    }",
	"    else {",
	"        return t;",
	"    }",
	"}",
	"function $json( path ) {",
	"    return require( path ); // node specific...",
	"}"
].join( '\n' );
var modulePostamble = '';

var interpolationPreamble = "        write( ";
var interpolationPostamble = " );";

var htmlTextBlockPreamble = "        write( \"";
var htmlTextBlockPostamble = "\" );";

function makeStringSafeForSourceString( string ) {
	return string
		.replace( /\n/g, '\\n' )
		.replace( /\t/g, '    ' )
		.replace( /"/g, '\\"' );
}

function getWriteStatementOf( string ) {
	return '        write( ' + string + ' );';
}

function trim( string ) {
	return string.replace( /^\s+|\s+$/g, '' );
}

var toFunctionSource = exports.toFunctionSource = function toFunctionSource( templateProduct ) {
	var functionSource = getSourceForTemplate( templateProduct );

	return functionSource;
}

var toModuleSource = exports.toModuleSource = function toModuleSource( templateProduct ) {
	var functionSource = getSourceForTemplate( templateProduct );
	var moduleSource = getModuleSourceForFunctionSource( functionSource );

	return moduleSource;
}

function getSourceForTemplate( templateProduct ) {
	var blockSources = templateProduct.blocks.map( function getSourceForBlock( block ) {
		switch( block.type ) {
		case 'javascriptBlock':
			return getSourceForJavascriptBlock( block );
			
		case 'htmlBlock':
			return getSourceForHTMLBlock( block );
		}
	});

	var parts = [ functionPreamble ].concat( blockSources );
	parts.push( functionPostamble );

	return parts.join( '\n' );
}

function getModuleSourceForFunctionSource( functionSource ) {
	var moduleSourceParts = [ modulePreamble, 'module.exports = ' + functionSource, modulePostamble ];

	return moduleSourceParts.join( '\n' );
}

function getSourceForJavascriptBlock( block ) {
	var blockPartSources = block.contentParts.map( function getSourceForBlockPart( part ) {
		switch( part.type ) {
		case 'javascriptSourceBlock':
			return getSourceForJavascriptSourceBlock( part );

		case 'anonymousTemplateBlock':
			return getSourceForTemplate( part.content );
		}
	});

	var blockSource = blockPartSources.join( '\n' );

	return blockSource;
}

function getSourceForJavascriptSourceBlock( block ) {
	return block.content;
}

function getSourceForHTMLBlock( block ) {
	var blockPartSources = block.contentParts.map( function getSourceForBlockPart( part ) {
		switch( part.type ) {
		case 'interpolationBlock':
			return getSourceForInterpolationBlock( part );

		case 'htmlTextBlock':
			return getSourceForHTMLTextBlock( part );
		}
	});

	var blockSource = blockPartSources.join( '\n' );

	return blockSource;
}

function getSourceForInterpolationBlock( block ) {
	return [ interpolationPreamble, trim( getSourceForJavascriptBlock( block.content ) ), interpolationPostamble ].join( '' );
}

function getSourceForHTMLTextBlock( block ) {
	return [ htmlTextBlockPreamble, makeStringSafeForSourceString( block.content ), htmlTextBlockPostamble ].join( '' );
}
