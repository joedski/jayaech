// compiler.js

exports.compile = compile;

function compile( templateProduction, callback ) {
	try {
		var templateProduct = compileTemplate( templateProduction );

		callback( null, templateProduct );
	}
	catch( error ) {
		callback( error );
	}
}

function compileTemplate( templateProduction ) {
	return {
		type: 'template',
		blocks: compileTemplateBlocks( templateProduction )
	};
}

function compileTemplateBlocks( templateProduction ) {
	var blockProductions = templateProduction.contents.filter( function rejectSeparators( production ) {
		return production.ruleName != '<terminal>';
	});

	return blockProductions.map( function compileEachTemplateBlock( blockProduction ) {
		if( blockProduction.ruleName == 'htmlBlock' ) {
			return compileHTMLBlock( blockProduction );
		}
		else if( blockProduction.ruleName == 'javascriptBlock' ) {
			return compileJavascriptBlock( blockProduction );
		}
		else {
			throw new Error( "Cannot compile unknown block type '" + blockProduction.ruleName + "'." );
		}
	});
}

function compileHTMLBlock( htmlBlockProduction ) {
	return {
		type: 'htmlBlock',
		contentParts: htmlBlockProduction.contents.map( function( production ) {
			switch( production.ruleName ) {
				case 'interpolationBlock':
					return {
						type: 'interpolationBlock',
						content: compileJavascriptBlock( production.contents[ 1 ] )
					};

				case 'htmlTextBlock':
					return {
						type: 'htmlTextBlock',
						content: compileTextBlock( production )
					};
			}
		})
	}
}

function compileJavascriptBlock( javascriptBlockProduction ) {
	return {
		type: 'javascriptBlock',
		contentParts: javascriptBlockProduction.contents.map( function( production ) {
			switch( production.ruleName ) {
				case 'javascriptSourceBlock':
					return {
						type: 'javascriptSourceBlock',
						content: compileTextBlock( production )
					};

				case 'anonymousTemplateBlock':
					return {
						type: 'anonymousTemplateBlock',
						content: compileTemplate( production.contents[ 1 ] )
					}
			}
		})
	};
}

function compileTextBlock( textBlockProduction ) {
	return textBlockProduction.contents.map( stringifyContentPart ).join( '' );
}



////////

function stringifyContentPart( production ) {
	if( production.ruleName == '<terminal>' ) {
		switch( production.terminal.type ) {
			default:
				return production.terminal.value;
		}
	}
	else {
		switch( production.ruleName ) {
			case 'escapedToken':
				return production.contents[ 1 ].terminal.value;

			default:
				throw new Error( "Cannot stringify unexpected content item '" + production.ruleName + "'." );
		}
	}
}
