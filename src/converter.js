// converter.js
// convert a template compilation product into various JS source strings.

var preamble = [
	"(function template( $item, $index, $iterable ){",
	"    function write( thing ) {",
	"        if( thing instanceof Array ) {",
	"            output += thing.join( '' );",
	"        }",
	"        else {",
	"            output += String( thing );",
	"        }",
	"    }",
	"    var output = '';",
	"    with( $item ) {"
].join( '\n' );

var postamble = [
	"    }",
	"    return output;",
	"})"
].join( '\n' );

function makeStringSafeForSourceString( string ) {
	return string
		.replace( /\n/g, '\\n' )
		.replace( /\t/g, '    ' )
		.replace( /"/g, '\\"' );
}

function getWriteStatementOf( string ) {
	return '        write( ' + string + ' );';
}

function getSourceForHTMLTextBlock( htmlTextBlockProduct ) {
	var stringSource = '"' + makeStringSafeForSourceString( htmlTextBlockProduct.content ) + '"';
	return getWriteStatementOf( stringSource );
}

function getSourceForInterpolationBlock( interpolationBlockProduct ) {
	var interpolationSource = 'function() { return ' + interpolationBlockProduct.content + ' }';
	return getWriteStatementOf( interpolationSource );
}

function getSourceForJavascriptBlock( javascriptBlock ) {
	return javascriptBlock.content;
}

function getSourceForAnonymousTemplateBlock( anonymousTemplateBlockProduct ) {
	return toFunctionSource( anonymousTemplateBlockProduct );
}

var toFunctionSource = exports.toFunctionSource = function toFunctionSource( templateProduct ) {

}
