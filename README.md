JayAech - Minimal Glue Between HTML and JS
==========================================

JayAech is a small tool I wrote to ease the creation of static HTML pages by decoupling the data being presented from the HTML wrappings.  It is implemented as a minimal syntactic glue between HTML and Javascript, allowing the writing of complex templating logic without having to munge data to fit before hand.  Instead of the controller or parent worrying about the particular presentation, only the template displaying that particular data has to worry about just how to display it.

Because JayAech is essentially the Javascript equivalent of PHP, yet amazingly enough uglier, it is easy to shoot yourself in not just one of your feet, but both as well as your hands, the rest of your extremeties, and also your pelvis.  Contrast this to something like Handlebars, where you must explicitly write your own helpers if you want to shoot yourself anywhere.



Writing Templates
-----------------

All Templates are functions with the signature `( $item, $index, $iterable ) -> :String` where `$item` is required and `$index` and `$iterable` are optional.



### The Tokens

These represent the extant of additional syntax that JayAech adds.

- `###` separates blocks of HTML and Javascript.
- `{# #}` interpolates a Javascript value, usually either a string or array of strings, into HTML.
- `@@@ @@@` defines an anonymous template.

Templates have two main contexts, HTML and Javascript.  Templates, like in PHP, always start in the HTML context.  Switching between these contexts is accomplished by using the `###` token.  It is not required that a template end in the HTML or Javascript context.

Values are interpolated into HTML using the interpolation symbol `{# #}`, preferably with some sort of value in there, such as a string, `{# "beep" #}`, a number, `{# 42 #}`, or most commonly a variable, `{# foo.text #}`.  The value may be any valid Javascript expression (*not _Javascript statement_*), so function calls are allowed and encouraged.

Anonymous Templates are indicated by a block surrounded by `@@@`s.  An anonymous template is compiled into another template right inside its parent, although it uses its parent's `$template` and `$json` functions since it's in the same file context as its parent.  However, it has its own values for `$item`, `$index`, and `$iterable`.  See below under *Environment* on an explanation of these `$`-prefixed thingies.

#### Escaping Tokens

If you want to output a token directly, simply place a single back-slash in before it.

```
<p>The token \### is used to switch between HTML and Javascript contexts, but does not do so in this case because it's been escaped!  The back-slash itself will not appear, however.</p>
###
// now in JS-land!
var foo = "It's necessary to escape tokens like \### here, too, even in JS strings.";
```



### Environment

Each template has an Environment with certain values pre-defined.

- `$template` loads another template by its node-style/commonJS module path.  Usually, this will be relative to the current template.
- `$json` loads and parses a JSON file, returning the value of it.  Values can be stored in a variable or used directly.
- `$item` refers to the item or context that the template is being applied to.  This is the only way to access the values being passed into the template.
- `$index` is the current index if the template is being used in `Array#map`.
- `$iterable` is the current array or other iterable object if the template is being used in `Array#map`.

`$index` and `$iterable` are both undefined if the template is not being used in `Array#map` or another similar iteration function.



### Interpolating Lists

Interpolation works for both scalar values (strings, numbers, other non-array values) and array values.  In the case of array values, the array has `join( '' )` called on it prior to actual interpolation.

The most common case of interplolating arrays is mapping an item-template over a list of items.  This is accomplished using the native `Array#map` method.

Where the template is small, an Anonymous Template is likely to be used.  Supposing we have a file `foo-items.json` with the following values:

```json
[
	{ "text": "foo" },
	{ "text": "bar" },
	{ "text": "baz" }
]
```

We can iterate over that like so, using `$json` to load the value of the JSON file, and `Array#map` to map those values over a template.

Note how the property `text` is referred to as `$item.text`, rather than being referred to directly.

```
<ul>
{# $json( './foo-items' ).map(
	@@@
	<li>{# $index #}: {# $item.text #}</li>
	@@@
) #}
</ul>
```

Evaluating the above results in the following:

```html
<ul>
	
	<li>0: foo</li>

	<li>1: bar</li>

	<li>2: baz</li>

</ul>
```

The extra spaces are from the extra white space between the `@@@`s.

To show that using an Anonymous Template in this fashion is identical to using a separate template, we can simply place the contents of that Anonymous Template into another file, say `foo-item-template.jh`, then load it using `$template`.

```
<!-- main template file -->
<ul>
{# $json( './foo-items' ).map( $template( './foo-item-template' ) ) #}
</ul>
```

```
<!-- foo-item-template.jh -->
<li>{# $index #}: {# $item.text #}</li>
```

Evaluating the main template above will result in the following:

```html
<!-- main template file -->
<ul>
<!-- foo-item-template.jh -->
<li>0: foo</li>
<!-- foo-item-template.jh -->
<li>1: bar</li>
<!-- foo-item-template.jh -->
<li>2: baz</li>
</ul>
```

Yes, the comments would be duplicated if included.



API
---

To use JayAech programmatically, add it to your package's dependencies and load it using `require( 'jayaech' )`.  This presents a few methods:

- `loadTemplate` loads a file with `compileFileToFunction` and returns it with `$template` and `$json` functions defined to allow loading of other templates and JSON files relative to that template.
- `compileFile` loads a file (synchronously) and parses it into module source.
- `compileFileToFunction` loads a file (synchronously) and parses it into function source.
- `compileToFunctionSource` *(Subject to change)* compiles a template in the form of a string into a function value.  You can pass this to `eval` and assign it to variable.  It doesn't define `$template` or `$json`, however.
- `compileToModuleSource` compiles a template handed to it in the form of a string into a function value.  You can pass this to `module._compile` if you want to create a proper nodey module.

Actually loading templates as modules can be done by requiring `jayaech/register`, which will allow you to `require` a template directly.  See *Usage* on what value will be presented when you `require` a template.
