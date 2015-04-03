// register.js

var jayaech = require( './' );

function loadFile( module, fileName ) {
	moduleSource = jayaech.compileFile( fileName );
	return module._compile( moduleSource, fileName );
}

if( require.extensions ) {
	// ...
	require.extensions[ '.jh' ] = loadFile;
}
