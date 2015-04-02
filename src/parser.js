var Tokenizer = require( 'no-frills-tokenizer' );
var expect = require( 'expectation-parser' );
var productions = require( 'expectation-parser/productions' );

// The magic of function statements.
exports.parse = parse;

/*
escaper = '\\';
blockSeparator = /###/;
interpolationBegin = /\{#/;
interpolationEnd = /#\}/;
anonymousTemplateSeparator = /@@@/;
otherText = /./;

templateStartingWithHTML = htmlBlock, [ (templateJavascriptPart) ];
templateStartingWithJavascript = javascriptBlock, [ (templateHTMLPart) ];
(templateJavascriptPart) = blockSeparator, javascriptBlock, [ (templateHTMLPart) ];
(templateHTMLPart) = blockSeparator, htmlBlock, [ (templateJavascriptPart) ];

htmlBlock = { interpolationBlock | htmlTextBlock };
htmlTextBlock = (htmlTextBlockBit), { (htmlTextBlockBit) };
(htmlTextBlockBit) = otherText | escapedToken;
javascriptBlock = { (javascriptBlockBit) };
(javascriptBlockBit) = javascriptSourceBlock | anonymousTemplateBlock;
javascriptSourceBlock = (javascriptSourceBlockBit), { (javascriptSourceBlockBit) };
(javascriptSourceBlockBit) = otherText | escapedToken;
escapedToken = escaper, ( blockSeparator | interpolationBegin | interpolationEnd | anonymousTemplateSeparator );
interpolationBlock = interpolationBegin, javascriptBlock, interpolationEnd;
anonymousTemplateBlock = anonymousTemplateSeparator, ...?, anonymousTemplateSeparator;
 */

var tokenRules = [
	[ ('\\'), 'escaper' ],
	[ ('###'), 'blockSeparator' ],
	[ ('{#'), 'interpolationBegin' ],
	[ ('#}'), 'interpolationEnd' ],
	[ ('@@@'), 'anonymousTemplateSeparator' ],
	// character by character.  Slow, but prevents stomping on other tokens.
	[ (/./), 'text' ]
];

var tokenizer = new Tokenizer({
	rules: tokenRules//,
	// onFlush: function() { this.onToken = function() {}; }
});

function parse( templateFileContents, options, callback ) {
	if( typeof options == 'function' ) {
		callback = options;
		options = {};
	}

	options = options || {};

	var tokens = [];

	tokenizer.onToken = function collectToken( token ) {
		tokens.push( token );
	};

	tokenizer.onFlush = function parseTokens() {
		if( ! options.startWith || options.startWith == 'html' ) {
			callback( null, parseStartingWithHTML( tokens, options ) );
		}
		else if( options.startWith == 'javascript' ) {
			callback( null, parseStartingWithJavascript( tokens, options ) );
		}
	};

	try {
		tokenizer.tokenize( templateFileContents, true );
	}
	catch( error ) {
		callback( error );
	}
}

function parseStartingWithJavascript( tokens, options ) {
	// Potentially problematic.
	expectAnonymousTemplate = expectTemplateStartingWithJavascript;

	return expectTemplateStartingWithJavascript( tokens );
}

function parseStartingWithHTML( tokens, options ) {
	expectAnonymousTemplate = expectTemplateStartingWithHTML;

	return expectTemplateStartingWithHTML( tokens );
}

function expectTemplateStartingWithHTML( tokens ) {
	return productionWithNameOrNull( 'template', expect.sequence([
		expectHTMLBlock,
		expect.optional( expectTemplateJavascriptPart )
	]), tokens );
}

function expectTemplateStartingWithJavascript( tokens ) {
	return productionWithNameOrNull( 'template', expect.sequence([
		expectJavascriptBlock,
		expect.optional( expectTemplateHTMLPart )
	]), tokens );
}

function expectTemplateJavascriptPart( tokens ) {
	return expect.sequence([
		expect.terminal({ type: 'blockSeparator' }),
		expectJavascriptBlock,
		expect.optional( expectTemplateHTMLPart )
	], tokens );
}

function expectTemplateHTMLPart( tokens ) {
	return expect.sequence([
		expect.terminal({ type: 'blockSeparator' }),
		expectHTMLBlock,
		expect.optional( expectTemplateJavascriptPart )
	], tokens );
}

// javascriptBlock = (javascriptBlockBit), { (javascriptBlockBit) };
// (javascriptBlockBit) = javascriptSourceBlock | anonymousTemplateBlock;
// javascriptSourceBlock = (javascriptSourceBlockBit), { (javascriptSourceBlockBit) };
// (javascriptSourceBlockBit) = otherText | escapedToken;

function expectJavascriptBlock( tokens ) {
	// return productionWithNameOrNull( 'javascriptBlock', expect.sequence([
	// 	expectJavascriptBlockBit,
	// 	expect.repetition( expectJavascriptBlockBit )
	// ]), tokens );
	return productionWithNameOrNull( 'javascriptBlock', expect.repetition( expectJavascriptBlockBit ), tokens );
}

function expectJavascriptBlockBit( tokens ) {
	return expect.alternation([
		// expect.terminal({ type: 'text' }),
		// expectEscapedToken,
		expectJavascriptSourceBlock,
		expectAnonymousTemplateBlock
	], tokens );
}

function expectJavascriptSourceBlock( tokens ) {
	return productionWithNameOrNull( 'javascriptSourceBlock', expect.sequence([
		expectJavascriptSourceBlockBit,
		expect.repetition( expectJavascriptSourceBlockBit )
	]), tokens );
}

function expectJavascriptSourceBlockBit( tokens ) {
	return expect.alternation([
		expect.terminal({ type: 'text' }),
		expectEscapedToken
	], tokens );
}

function expectHTMLBlock( tokens ) {
	return productionWithNameOrNull( 'htmlBlock', expect.repetition( expect.alternation([
		expectInterpolationBlock,
		// expectAnonymousTemplateBlock,
		expectHTMLTextBlock
	])), tokens );
}

function expectHTMLTextBlock( tokens ) {
	return productionWithNameOrNull( 'htmlTextBlock', expect.sequence([
		expectHTMLTextBlockBit,
		expect.repetition( expectHTMLTextBlockBit )
	]), tokens );
}

function expectHTMLTextBlockBit( tokens ) {
	return expect.alternation([
		expect.terminal({ type: 'text' }),
		expectEscapedToken
	], tokens );
}

function expectEscapedToken( tokens ) {
	return productionWithNameOrNull( 'escapedToken', expect.sequence([
		expect.terminal({ type: 'escaper' }),
		expect.alternation([
			expect.terminal({ type: 'escaper' }),
			expect.terminal({ type: 'blockSeparator' }),
			expect.terminal({ type: 'interpolationBegin' }),
			expect.terminal({ type: 'interpolationEnd' }),
			expect.terminal({ type: 'anonymousTemplateSeparator' })
		])
	]), tokens );
}

// interpolationBlock = interpolationBegin, javascriptBlock, interpolationEnd;

function expectInterpolationBlock( tokens ) {
	return productionWithNameOrNull( 'interpolationBlock', expect.sequence([
		expect.terminal({ type: 'interpolationBegin' }),
		expectJavascriptBlock,
		expect.terminal({ type: 'interpolationEnd' })
	]), tokens );
}

// anonymousTemplateBlock = anonymousTemplateSeparator, anonymousTemplate, anonymousTemplateSeparator;

var expectAnonymousTemplate;

function expectAnonymousTemplateBlock( tokens ) {
	return productionWithNameOrNull( 'anonymousTemplateBlock', expect.sequence([
		expect.terminal({ type: 'anonymousTemplateSeparator' }),
		expectAnonymousTemplate,
		expect.terminal({ type: 'anonymousTemplateSeparator' })
	]), tokens );
}

////////////////////////////////

function productionWithNameOrNull( name, expectation, tokens ) {
	var production = expectation( tokens );
	var normalizedProduction = newProductionOrNull( name, production );

	return normalizedProduction;
}

function newProductionOrNull( ruleName, production ) {
	if( production ) {
		if( production.anonymous )
			return new productions.Production( ruleName, production.contents );
		else
			// This only occurs in one case, with the out statement.
			return new productions.Production( ruleName, [ production ] );
	}
	else {
		return null;
	}
}

function CompileError( message, options ) {
	Error.call( this, message );

	this.cause = options.cause || null;
}

CompileError.prototype = new Error();
