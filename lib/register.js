// register.js

var jayaech = require( './index' );

function loadFile( module, fileName ) {
	moduleSource = jayaech.compileFile( fileName );
	return module._compile( moduleSource, fileName );
}

if( require.extensions ) {
	// ...?
	require.extensions[ '.jh' ] = loadFile;
}
