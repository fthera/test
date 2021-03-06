/*
 * General token sanitizer. Strips out (or encapsulates) unsafe and disallowed
 * tag types and attributes. Should run last in the third, synchronous
 * expansion stage. Tokens from extensions which should not be sanitized
 * can bypass sanitation by setting their rank to 3.
 *
 * A large part of this code is a straight port from the PHP version.
 */
'use strict';
require('../../../core-upgrade.js');

var semver = require('semver');

var JSUtils = require('../../utils/jsutils.js').JSUtils;
var Util = require('../../utils/Util.js').Util;
var defines = require('../parser.defines.js');
var WikitextConstants = require('../../config/WikitextConstants.js').WikitextConstants;

// define some constructor shortcuts
var TagTk = defines.TagTk;
var SelfclosingTagTk = defines.SelfclosingTagTk;
var EndTagTk = defines.EndTagTk;


/**
 * @class SanitizerModule
 * @singleton
 */

var SanitizerConstants = {
	// Assumptions:
	// 1. This is "constant" -- enforced via Util.deepFreeze.
	// 2. All sanitizers have the same global config.
	globalConfig: {
		allowRdfaAttrs: true,
		allowMicrodataAttrs: true,
		html5Mode: true,
	},

	// Character entity aliases accepted by MediaWiki
	htmlEntityAliases: {
		'רלמ': 'rlm',
		'رلم': 'rlm',
	},

	/**
	 * List of all named character entities defined in HTML 4.01
	 * http://www.w3.org/TR/html4/sgml/entities.html
	 * As well as &apos; which is only defined starting in XHTML1.
	 * @private
	 */
	htmlEntities: {
		'Aacute':   193,
		'aacute':   225,
		'Acirc':    194,
		'acirc':    226,
		'acute':    180,
		'AElig':    198,
		'aelig':    230,
		'Agrave':   192,
		'agrave':   224,
		'alefsym':  8501,
		'Alpha':    913,
		'alpha':    945,
		'amp':      38,
		'and':      8743,
		'ang':      8736,
		'apos':     39, // New in XHTML & HTML 5; avoid in output for compatibility with IE.
		'Aring':    197,
		'aring':    229,
		'asymp':    8776,
		'Atilde':   195,
		'atilde':   227,
		'Auml':     196,
		'auml':     228,
		'bdquo':    8222,
		'Beta':     914,
		'beta':     946,
		'brvbar':   166,
		'bull':     8226,
		'cap':      8745,
		'Ccedil':   199,
		'ccedil':   231,
		'cedil':    184,
		'cent':     162,
		'Chi':      935,
		'chi':      967,
		'circ':     710,
		'clubs':    9827,
		'cong':     8773,
		'copy':     169,
		'crarr':    8629,
		'cup':      8746,
		'curren':   164,
		'dagger':   8224,
		'Dagger':   8225,
		'darr':     8595,
		'dArr':     8659,
		'deg':      176,
		'Delta':    916,
		'delta':    948,
		'diams':    9830,
		'divide':   247,
		'Eacute':   201,
		'eacute':   233,
		'Ecirc':    202,
		'ecirc':    234,
		'Egrave':   200,
		'egrave':   232,
		'empty':    8709,
		'emsp':     8195,
		'ensp':     8194,
		'Epsilon':  917,
		'epsilon':  949,
		'equiv':    8801,
		'Eta':      919,
		'eta':      951,
		'ETH':      208,
		'eth':      240,
		'Euml':     203,
		'euml':     235,
		'euro':     8364,
		'exist':    8707,
		'fnof':     402,
		'forall':   8704,
		'frac12':   189,
		'frac14':   188,
		'frac34':   190,
		'frasl':    8260,
		'Gamma':    915,
		'gamma':    947,
		'ge':       8805,
		'gt':       62,
		'harr':     8596,
		'hArr':     8660,
		'hearts':   9829,
		'hellip':   8230,
		'Iacute':   205,
		'iacute':   237,
		'Icirc':    206,
		'icirc':    238,
		'iexcl':    161,
		'Igrave':   204,
		'igrave':   236,
		'image':    8465,
		'infin':    8734,
		'int':      8747,
		'Iota':     921,
		'iota':     953,
		'iquest':   191,
		'isin':     8712,
		'Iuml':     207,
		'iuml':     239,
		'Kappa':    922,
		'kappa':    954,
		'Lambda':   923,
		'lambda':   955,
		'lang':     9001,
		'laquo':    171,
		'larr':     8592,
		'lArr':     8656,
		'lceil':    8968,
		'ldquo':    8220,
		'le':       8804,
		'lfloor':   8970,
		'lowast':   8727,
		'loz':      9674,
		'lrm':      8206,
		'lsaquo':   8249,
		'lsquo':    8216,
		'lt':       60,
		'macr':     175,
		'mdash':    8212,
		'micro':    181,
		'middot':   183,
		'minus':    8722,
		'Mu':       924,
		'mu':       956,
		'nabla':    8711,
		'nbsp':     160,
		'ndash':    8211,
		'ne':       8800,
		'ni':       8715,
		'not':      172,
		'notin':    8713,
		'nsub':     8836,
		'Ntilde':   209,
		'ntilde':   241,
		'Nu':       925,
		'nu':       957,
		'Oacute':   211,
		'oacute':   243,
		'Ocirc':    212,
		'ocirc':    244,
		'OElig':    338,
		'oelig':    339,
		'Ograve':   210,
		'ograve':   242,
		'oline':    8254,
		'Omega':    937,
		'omega':    969,
		'Omicron':  927,
		'omicron':  959,
		'oplus':    8853,
		'or':       8744,
		'ordf':     170,
		'ordm':     186,
		'Oslash':   216,
		'oslash':   248,
		'Otilde':   213,
		'otilde':   245,
		'otimes':   8855,
		'Ouml':     214,
		'ouml':     246,
		'para':     182,
		'part':     8706,
		'permil':   8240,
		'perp':     8869,
		'Phi':      934,
		'phi':      966,
		'Pi':       928,
		'pi':       960,
		'piv':      982,
		'plusmn':   177,
		'pound':    163,
		'prime':    8242,
		'Prime':    8243,
		'prod':     8719,
		'prop':     8733,
		'Psi':      936,
		'psi':      968,
		'quot':     34,
		'radic':    8730,
		'rang':     9002,
		'raquo':    187,
		'rarr':     8594,
		'rArr':     8658,
		'rceil':    8969,
		'rdquo':    8221,
		'real':     8476,
		'reg':      174,
		'rfloor':   8971,
		'Rho':      929,
		'rho':      961,
		'rlm':      8207,
		'rsaquo':   8250,
		'rsquo':    8217,
		'sbquo':    8218,
		'Scaron':   352,
		'scaron':   353,
		'sdot':     8901,
		'sect':     167,
		'shy':      173,
		'Sigma':    931,
		'sigma':    963,
		'sigmaf':   962,
		'sim':      8764,
		'spades':   9824,
		'sub':      8834,
		'sube':     8838,
		'sum':      8721,
		'sup':      8835,
		'sup1':     185,
		'sup2':     178,
		'sup3':     179,
		'supe':     8839,
		'szlig':    223,
		'Tau':      932,
		'tau':      964,
		'there4':   8756,
		'Theta':    920,
		'theta':    952,
		'thetasym': 977,
		'thinsp':   8201,
		'THORN':    222,
		'thorn':    254,
		'tilde':    732,
		'times':    215,
		'trade':    8482,
		'Uacute':   218,
		'uacute':   250,
		'uarr':     8593,
		'uArr':     8657,
		'Ucirc':    219,
		'ucirc':    251,
		'Ugrave':   217,
		'ugrave':   249,
		'uml':      168,
		'upsih':    978,
		'Upsilon':  933,
		'upsilon':  965,
		'Uuml':     220,
		'uuml':     252,
		'weierp':   8472,
		'Xi':       926,
		'xi':       958,
		'Yacute':   221,
		'yacute':   253,
		'yen':      165,
		'Yuml':     376,
		'yuml':     255,
		'Zeta':     918,
		'zeta':     950,
		'zwj':      8205,
		'zwnj':     8204,
	},

	UTF8_REPLACEMENT: "\xef\xbf\xbd",

	/**
	 * Regular expression to match various types of character references in
	 * Sanitizer::normalizeCharReferences and Sanitizer::decodeCharReferences
	 */
	CHAR_REFS_RE_G: /&([A-Za-z0-9\x80-\xff]+);|&\#([0-9]+);|&\#[xX]([0-9A-Fa-f]+);|(&)/g,

	/**
	 * Blacklist for evil uris like javascript:
	 * WARNING: DO NOT use this in any place that actually requires blacklisting
	 * for security reasons. There are NUMEROUS[1] ways to bypass blacklisting, the
	 * only way to be secure from javascript: uri based xss vectors is to whitelist
	 * things that you know are safe and deny everything else.
	 * [1]: http://ha.ckers.org/xss.html
	 */
	EVIL_URI_RE: /(^|\s|\*\/\s*)(javascript|vbscript)([^\w]|$)/i,

	XMLNS_ATTRIBUTE_RE: /^xmlns:[:A-Z_a-z-.0-9]+$/,

	IDN_RE_G: new RegExp(
		"[\t ]|" +  // general whitespace
		"\u00ad|" + // 00ad SOFT HYPHEN
		"\u1806|" + // 1806 MONGOLIAN TODO SOFT HYPHEN
		"\u200b|" + // 200b ZERO WIDTH SPACE
		"\u2060|" + // 2060 WORD JOINER
		"\ufeff|" + // feff ZERO WIDTH NO-BREAK SPACE
		"\u034f|" + // 034f COMBINING GRAPHEME JOINER
		"\u180b|" + // 180b MONGOLIAN FREE VARIATION SELECTOR ONE
		"\u180c|" + // 180c MONGOLIAN FREE VARIATION SELECTOR TWO
		"\u180d|" + // 180d MONGOLIAN FREE VARIATION SELECTOR THREE
		"\u200c|" + // 200c ZERO WIDTH NON-JOINER
		"\u200d|" + // 200d ZERO WIDTH JOINER
		"[\ufe00-\ufe0f]", // fe00-fe0f VARIATION SELECTOR-1-16
		"g"
	),

	setDerivedConstants: function() {
		function computeCSSDecodeRegexp() {
			// Decode escape sequences and line continuation
			// See the grammar in the CSS 2 spec, appendix D.
			// This has to be done AFTER decoding character references.
			// This means it isn't possible for this function to return
			// unsanitized escape sequences. It is possible to manufacture
			// input that contains character references that decode to
			// escape sequences that decode to character references, but
			// it's OK for the return value to contain character references
			// because the caller is supposed to escape those anyway.
			var space = '[\\x20\\t\\r\\n\\f]';
			var nl = '(?:\\n|\\r\\n|\\r|\\f)';
			var backslash = '\\\\';
			return new RegExp(backslash +
				"(?:" +
					"(" + nl + ")|" + // 1. Line continuation
					"([0-9A-Fa-f]{1,6})" + space + "?|" + // 2. character number
					"(.)|" + // 3. backslash cancelling special meaning
					"()$" + // 4. backslash at end of string
				")");
		}

		// SSS FIXME:
		// If multiple sanitizers with different configs can be active at the same time,
		// attrWhiteList code would have to be redone to cache the white list in the
		// Sanitizer object rather than in the SanitizerConstants object.
		function computeAttrWhiteList(config) {
			// base list
			var common = ["id", "class", "lang", "dir", "title", "style"];

			// RDFa attributes
			var rdfa = ["about", "property", "resource", "datatype", "typeof"];
			if (config.allowRdfaAttrs) {
				common = common.concat(rdfa);
			}

			// MicroData attrs
			var mda = ["itemid", "itemprop", "itemref", "itemscope", "itemtype"];
			if (config.allowMicrodataAttrs) {
				common = common.concat(mda);
			}

			var block = common.concat(["align"]);
			var tablealign = ["align", "char", "charoff", "valign"];
			var tablecell = [
				"abbr", "axis", "headers", "scope", "rowspan", "colspan",
				// these next 4 are deprecated
				"nowrap", "width", "height", "bgcolor",
			];

			// Numbers refer to sections in HTML 4.01 standard describing the element.
			// See: http://www.w3.org/TR/html4/
			return {
				// 7.5.4
				'div':    block,
				'center': common, // deprecated
				'span':   block,  // ??

				// 7.5.5
				'h1': block,
				'h2': block,
				'h3': block,
				'h4': block,
				'h5': block,
				'h6': block,

				// 7.5.6
				// address

				// 8.2.4
				'bdo': common,

				// 9.2.1
				'em':     common,
				'strong': common,
				'cite':   common,
				'dfn':    common,
				'code':   common,
				'samp':   common,
				'kbd':    common,
				'var':    common,
				'abbr':   common,
				// acronym

				// 9.2.2
				'blockquote': common.concat([ 'cite' ]),
				'q': common.concat([ 'cite' ]),

				// 9.2.3
				'sub': common,
				'sup': common,

				// 9.3.1
				'p': block,

				// 9.3.2
				'br': [ 'id', 'class', 'title', 'style', 'clear' ],

				// 9.3.4
				'pre': common.concat([ 'width' ]),

				// 9.4
				'ins': common.concat([ 'cite', 'datetime' ]),
				'del': common.concat([ 'cite', 'datetime' ]),

				// 10.2
				'ul': common.concat([ 'type' ]),
				'ol': common.concat([ 'type', 'start' ]),
				'li': common.concat([ 'type', 'value' ]),

				// 10.3
				'dl': common,
				'dd': common,
				'dt': common,

				// 11.2.1
				'table': common.concat([
					'summary', 'width', 'border', 'frame',
					'rules', 'cellspacing', 'cellpadding',
					'align', 'bgcolor',
				]),

				// 11.2.2
				'caption': common.concat([ 'align' ]),

				// 11.2.3
				'thead': common.concat(tablealign),
				'tfoot': common.concat(tablealign),
				'tbody': common.concat(tablealign),

				// 11.2.4
				'colgroup': common.concat([ 'span', 'width' ]).concat(tablealign),
				'col':      common.concat([ 'span', 'width' ]).concat(tablealign),

				// 11.2.5
				'tr': common.concat([ 'bgcolor' ]).concat(tablealign),

				// 11.2.6
				'td': common.concat(tablecell).concat(tablealign),
				'th': common.concat(tablecell).concat(tablealign),

				// 12.2 # NOTE: <a> is not allowed directly, but the attrib whitelist is used from the Parser object
				'a': common.concat([ 'href', 'rel', 'rev' ]), // rel/rev esp. for RDFa

				// Add in link tags so we can pass in categories, etc.
				'link': common.concat([ 'href', 'rel' ]), // rel/rev esp. for RDFa

				// 13.2
				// Not usually allowed, but may be used for extension-style hooks
				// such as <math> when it is rasterized, or if wgAllowImageTag is
				// true
				'img': common.concat([ 'alt', 'src', 'width', 'height', 'srcset' ]),

				// 15.2.1
				'tt':     common,
				'b':      common,
				'i':      common,
				'big':    common,
				'small':  common,
				'strike': common,
				's':      common,
				'u':      common,

				// 15.2.2
				'font': common.concat([ 'size', 'color', 'face' ]),
				// basefont

				// 15.3
				'hr': common.concat([ 'noshade', 'size', 'width' ]),

				// XHTML Ruby annotation text module, simple ruby only.
				// http://www.w3c.org/TR/ruby/
				'ruby': common,
				// rbc
				'rb':  common,
				'rp':  common,
				'rt':  common,  // common.concat([ 'rbspan' ]),
				'rtc': common,

				// MathML root element, where used for extensions
				// 'title' may not be 100% valid here; it's XHTML
				// http://www.w3.org/TR/REC-MathML/
				'math': [ 'class', 'style', 'id', 'title' ],

				// HTML 5 section 4.5
				'figure':     common,
				'figcaption': common,

				// HTML 5 section 4.6
				'bdi': common,
				'wbr': [ 'id', 'class', 'title', 'style' ],

				// HTML5 elements, defined by http://www.whatwg.org/html/
				'data': common.concat(['value']),
				'time': common.concat(['datetime']),
				'mark': common,
			};
		}

		// Tags whose end tags are not accepted, but whose start /
		// self-closing version might be legal.
		this.noEndTagSet = new Set(['br']);

		// |/?[^/])[^\\s]+$");
		this.cssDecodeRE = computeCSSDecodeRegexp();
		this.attrWhiteList = computeAttrWhiteList(this.globalConfig);
	},
};

// init caches, convert lists to hashtables, etc.
SanitizerConstants.setDerivedConstants();

var ignoreFields;
if (semver.gte(process.version, '6.5.0')) {
	// We're ignoring non-global RegExps in >=6.5.0 because it's the first
	// version of node to contain this lastIndex writable bug,
	// https://github.com/nodejs/node/blob/2cc29517966de7257a2f1b34c58c77225a21e05d/deps/v8/test/webkit/fast/regex/lastIndex-expected.txt#L45
	ignoreFields = {
		EVIL_URI_RE: true,
		XMLNS_ATTRIBUTE_RE: true,
	};
} else {
	ignoreFields = {};
}

// Can't freeze the regexp state variables w/ global flag
ignoreFields.IDN_RE_G = true;
ignoreFields.CHAR_REFS_RE_G = true;

// Freeze it blocking all accidental changes
JSUtils.deepFreezeButIgnore(SanitizerConstants, ignoreFields);

/**
 * @class
 *
 * @constructor
 * @param {TokenTransformManager} manager The manager for this part of the pipeline.
 */
function Sanitizer(manager, options) {
	this.options = options;
	// FIXME: would be good to make the sanitizer independent of the manager
	// so that it can be used separately. See
	// https://phabricator.wikimedia.org/T54941
	this.manager = manager;
	this.register(manager);
	this.constants = SanitizerConstants;
	this.attrWhiteListCache = {};
}

/**
 * Utility function: Sanitize an array of tokens. Not used in normal token
 * pipelines. The only caller is currently in tableFixups.js.
 *
 * TODO: Move to Util / generalize when working on T54941?
 */
Sanitizer.prototype.sanitizeTokens = function(tokens) {
	return tokens.map(function(token) {
		return this.onAny(token).token;
	}, this);
};

Sanitizer.prototype.getAttrWhiteList = function(tag) {
	var awlCache = this.attrWhiteListCache;
	if (!awlCache[tag]) {
		awlCache[tag] = new Set(this.constants.attrWhiteList[tag] || []);
	}
	return awlCache[tag];
};

// constants
Sanitizer.prototype.anyRank = 2.91;

// Register this transformer with the TokenTransformer
Sanitizer.prototype.register = function(manager) {
	this.manager = manager;
	manager.addTransform(this.onAny.bind(this), "Sanitizer:onAny", this.anyRank, 'any');
};

Sanitizer._stripIDNs = function(host) {
	return host.replace(SanitizerConstants.IDN_RE_G, '');
};

Sanitizer.cleanUrl = function(env, href) {
	href = Sanitizer.decodeCharReferences(href);
	href = href.replace(/([\][<>"\x00-\x20\x7F\|])/g, Util.phpURLEncode);

	var bits = href.match(/^((?:[a-zA-Z][^:\/]*:)?(?:\/\/)?)([^\/]+)(\/?.*)/);
	var proto, host, path;
	if (bits) {
		proto = bits[1];
		if (proto && !env.conf.wiki.hasValidProtocol(proto)) {
			// invalid proto, disallow URL
			return null;
		}
		host = Sanitizer._stripIDNs(bits[2]);
		var match = /^%5B([0-9A-Fa-f:.]+)%5D((:\d+)?)$/.exec(host);
		if (match) {
			// IPv6 host names
			host = '[' + match[1] + ']' + match[2];
		}
		path = bits[3];
	} else {
		proto = '';
		host = '';
		path = href;
	}
	return proto + host + path;
};

/**
 * Sanitize any tag.
 *
 * XXX: Make attribute sanitation reversible by storing round-trip info in
 * token.dataAttribs object (which is serialized as JSON in a data-parsoid
 * attribute in the DOM).
 */
Sanitizer.prototype.onAny = function(token) {
	var env = this.manager.env;
	env.log("trace/sanitizer", this.manager.pipelineId, function() {
		return JSON.stringify(token);
	});

	// Pass through a transparent line meta-token
	if (Util.isEmptyLineMetaToken(token)) {
		env.log("trace/sanitizer", this.manager.pipelineId, "--unchanged--");
		return { token: token };
	}

	var i, l, k, v, kv;
	var attribs = token.attribs;
	var noEndTagSet = this.constants.noEndTagSet;
	var tagWhiteList = WikitextConstants.Sanitizer.TagWhiteList;

	if (Util.isHTMLTag(token) && (
		!tagWhiteList.has(token.name.toUpperCase()) ||
		(token.constructor === EndTagTk && noEndTagSet.has(token.name))
	)) { // unknown tag -- convert to plain text
		if (!this.options.inTemplate && token.dataAttribs.tsr) {
			// Just get the original token source, so that we can avoid
			// whitespace differences.
			token = token.getWTSource(this.manager.env);
		} else if (token.constructor !== EndTagTk) {
			// Handle things without a TSR: For example template or extension
			// content. Whitespace in these is not necessarily preserved.
			var buf = "<" + token.name;
			for (i = 0, l = attribs.length; i < l; i++) {
				kv = attribs[i];
				buf += " " + kv.k + "='" + kv.v + "'";
			}
			if (token.constructor === SelfclosingTagTk) {
				buf += " /";
			}
			buf += ">";
			token = buf;
		} else {
			token = "</" + token.name + ">";
		}
	} else {
		// Convert attributes to string, if necessary.
		// XXX: Likely better done in AttributeTransformManager when processing is
		// complete
		if (attribs && attribs.length > 0) {
			for (i = 0, l = attribs.length; i < l; i++) {
				kv = attribs[i];
				if (!kv.v) {
					kv.v = "";
				}
				if (kv.k.constructor !== String || kv.v.constructor !== String) {
					k = kv.k;
					v = kv.v;
					if (Array.isArray(k)) {
						kv.k = Util.tokensToString(k);
					}
					if (Array.isArray(v)) {
						kv.v = Util.tokensToString(v);
					}
					attribs[i] = kv;
				}
			}
			// Sanitize attributes
			if (token.constructor === TagTk || token.constructor === SelfclosingTagTk) {
				this.sanitizeTagAttrs(token, attribs);
			} else {
				// EndTagTk, drop attributes
				token.attribs = [];
			}
		}
	}

	env.log("trace/sanitizer", this.manager.pipelineId, function() {
		return " ---> " + JSON.stringify(token);
	});
	return { token: token };
};

/**
 * If the named entity is defined in the HTML 4.0/XHTML 1.0 DTD,
 * return the UTF-8 encoding of that character. Otherwise, returns
 * pseudo-entity source (eg "&foo;")
 *
 * gwicke: Use Util.decodeEntities instead?
 */
Sanitizer.decodeEntity = function(name) {
	if (SanitizerConstants.htmlEntityAliases[name]) {
		name = SanitizerConstants.htmlEntityAliases[name];
	}
	var e = SanitizerConstants.htmlEntities[name];
	return e ? Util.codepointToUtf8(e) : "&" + name + ";";
};

/**
 * Return UTF-8 string for a codepoint if that is a valid
 * character reference, otherwise U+FFFD REPLACEMENT CHARACTER.
 */
Sanitizer.decodeChar = function(codepoint) {
	if (Util.validateCodepoint(codepoint)) {
		return Util.codepointToUtf8(codepoint);
	} else {
		return SanitizerConstants.UTF8_REPLACEMENT;
	}
};

/**
 * Decode any character references, numeric or named entities,
 * in the text and return a UTF-8 string.
 */
Sanitizer.decodeCharReferences = function(text) {
	return text.replace(SanitizerConstants.CHAR_REFS_RE_G, function() {
		if (arguments[1]) {
			return Sanitizer.decodeEntity(arguments[1]);
		} else if (arguments[2]) {
			return Sanitizer.decodeChar(parseInt(arguments[2], 10));
		} else if (arguments[3]) {
			return Sanitizer.decodeChar(parseInt(arguments[3], 16));
		} else {
			return arguments[4];
		}
	});
};

function removeMismatchedQuoteChar(str, quoteChar) {
	var re1, re2;
	if (quoteChar === "'") {
		re1 = /'/g;
		re2 = /'([^'\n\r\f]*)$/;
	} else {
		re1 = /"/g;
		re2 = /"([^"\n\r\f]*)$/;
	}
	var mismatch = ((str.match(re1) || []).length) % 2 === 1;
	if (mismatch) {
		str = str.replace(re2, function() {
			// replace the mismatched quoteChar with a space
			return " " + arguments[1];
		});
	}
	return str;
}

var ieReplace = new Map(Object.entries({
	'ʀ': 'r',
	'ɴ': 'n',
	'ⁿ': 'n',
	'ʟ': 'l',
	'ɪ': 'i',
	'⁽': '(',
	'₍': '(',
}));

Sanitizer.normalizeCss = function(text) {
	// Decode character references like &#123;
	text = Sanitizer.decodeCharReferences(text);

	text = text.replace(SanitizerConstants.cssDecodeRE, function cssDecodeCallback() {
		var c;
		if (arguments[1] !== undefined) {
			// Line continuation
			return '';
		} else if (arguments[2] !== undefined) {
			c = Util.codepointToUtf8(parseInt(arguments[2], 16));
		} else if (arguments[3] !== undefined) {
			c = arguments[3];
		} else {
			c = '\\';
		}

		if (c === "\n" || c === '"' || c === "'" || c === '\\') {
			// These characters need to be escaped in strings
			// Clean up the escape sequence to avoid parsing errors by clients
			return '\\' + (c.charCodeAt(0)).toString(16) + ' ';
		} else {
			// Decode unnecessary escape
			return c;
		}
	});

	// Normalize Halfwidth and Fullwidth Unicode block that IE6 might treat as ascii
	text = text.replace(/[\uFF00-\uFFEF]/g, function(u) {
		if (/\uFF3c/.test(u)) {
			return u;
		} else {
			var cp = Util.utf8ToCodepoint(u);
			return String.fromCodePoint(cp - 65248);  // ASCII range \x21-\x7A
		}
	});

	// Convert more characters IE6 might treat as ascii
	text = text.replace(/\u0280|\u0274|\u207F|\u029F|\u026A|\u207D|\u208D/g, function(u) {
		return ieReplace.get(u) || u;
	});

	// Remove any comments; IE gets token splitting wrong
	// This must be done AFTER decoding character references and
	// escape sequences, because those steps can introduce comments
	// This step cannot introduce character references or escape
	// sequences, because it replaces comments with spaces rather
	// than removing them completely.
	text = text.replace(/\/\*.*\*\//g, ' ');

	// Fix up unmatched double-quote and single-quote chars
	// Full CSS syntax here: http://www.w3.org/TR/CSS21/syndata.html#syntax
	//
	// This can be converted to a function and called once for ' and "
	// but we have to construct 4 different REs anyway
	text = removeMismatchedQuoteChar(text, "'");
	text = removeMismatchedQuoteChar(text, '"');

	/* --------- shorter but less efficient alternative to removeMismatchedQuoteChar ------------
	text = text.replace(/("[^"\n\r\f]*")+|('[^'\n\r\f]*')+|([^'"\n\r\f]+)|"([^"\n\r\f]*)$|'([^'\n\r\f]*)$/g, function() {
		return arguments[1] || arguments[2] || arguments[3] || arguments[4]|| arguments[5];
	});
	* ----------------------------------- */

	// Remove anything after a comment-start token, to guard against
	// incorrect client implementations.
	var commentPos = text.indexOf('/*');
	if (commentPos >= 0) {
		text = text.substr(0, commentPos);
	}

	// S followed by repeat, iteration, or prolonged sound marks,
	// which IE will treat as "ss"
	text = text.replace(/s(?:\u3031|\u309D|\u30FC|\u30FD|\uFE7C|\uFE7D|\uFF70)/ig, 'ss');

	return text;
};

var insecureRE = new RegExp(
	"expression" +
		"|filter\\s*:" +
		"|accelerator\\s*:" +
		"|-o-link\\s*:" +
		"|-o-link-source\\s*:" +
		"|-o-replace\\s*:" +
		"|url\\s*\\(" +
		"|image\\s*\\(" +
		"|image-set\\s*\\(" +
		"|attr\\s*\\([^)]+[\\s,]+url",
	"i"
);

Sanitizer.checkCss = function(text) {
	text = Sanitizer.normalizeCss(text);
	// \000-\010\013\016-\037\177 are the octal escape sequences
	if (/[\u0000-\u0008\u000B\u000E-\u001F\u007F]/.test(text) ||
			text.indexOf(SanitizerConstants.UTF8_REPLACEMENT) > -1) {
		return '/* invalid control char */';
	} else if (insecureRE.test(text)) {
		return '/* insecure input */';
	} else {
		return text;
	}
};

Sanitizer.normalizeSectionIdWhiteSpace = function(id) {
	return id.replace(/[ _]+/g, ' ').trim();
};

Sanitizer.escapeId = function(id, options) {
	options = options || {};

	id = Sanitizer.decodeCharReferences(id);

	// Assume $wgExperimentalHtmlIds is `false` for now.

	id = id.replace(/ /g, '_');
	id = Util.phpURLEncode(id);
	id = id.replace(/%3A/g, ':');
	id = id.replace(/%/g, '.');

	if (!/^[a-zA-Z]/.test(id) && !options.hasOwnProperty('noninitial')) {
		// Initial character must be a letter!
		id = 'x' + id;
	}

	return id;
};

// SSS FIXME: There is a test in mediawiki.environment.js that doles out
// and tests about ids. There are probably some tests in mediawiki.Util.js
// as well. We should move all these kind of tests somewhere else.
Sanitizer.prototype.isParsoidAttr = function(k, v, attrs) {
	// NOTES:
	// 1. Currently the tokenizer unconditionally escapes typeof and about
	//    attributes from wikitxt to data-x-typeof and data-x-about. So,
	//    this check will only pass through Parsoid inserted attrs.
	// 2. But, if we fix the over-aggressive escaping in the tokenizer to
	//    not escape non-Parsoid typeof and about, then this will return
	//    true for something like typeof='mw:Foo evilScriptHere'. But, that
	//    is safe since this check is only used to see if we should
	//    unconditionally discard the entire attribute or process it further.
	//    That further processing will catch and discard any dangerous
	//    strings in the rest of the attribute
	return (/^(?:typeof|property|rel)$/).test(k) && /(?:^|\s)mw:.+?(?=$|\s)/.test(v) ||
		k === "about" && /^#mwt\d+$/.test(v) ||
		k === "content" && /(?:^|\s)mw:.+?(?=$|\s)/.test(Util.lookup(attrs, 'property'));
};

// RDFa and microdata properties allow URLs, URIs and/or CURIs.
var microData = new Set([
	'rel', 'rev', 'about', 'property', 'resource', 'datatype', 'typeof', // RDFa
	'itemid', 'itemprop', 'itemref', 'itemscope', 'itemtype', // HTML5 microdata
]);

Sanitizer.prototype.sanitizeTagAttrs = function(token, attrs) {
	var tag       = token.name;
	var allowRdfa = this.constants.globalConfig.allowRdfaAttrs;
	var allowMda  = this.constants.globalConfig.allowMicrodataAttrs;
	var html5Mode = this.constants.globalConfig.html5Mode;
	var xmlnsRE   = this.constants.XMLNS_ATTRIBUTE_RE;
	var evilUriRE = this.constants.EVIL_URI_RE;

	var wlist = this.getAttrWhiteList(tag);
	var newAttrs = {};
	var n = attrs.length;
	for (var i = 0; i < n; i++) {
		var a = attrs[i];
		var origK = a.ksrc || a.k;
		var k = a.k.toLowerCase();
		var v = a.v;
		var origV = a.vsrc || v;
		var psdAttr = this.isParsoidAttr(k, v, attrs);

		// Bypass RDFa/whitelisting checks for Parsoid-inserted attrs
		// Safe to do since the tokenizer renames about/typeof attrs.
		// unconditionally. FIXME: The escaping solution in the tokenizer
		// may be aggressive. There is no need to escape typeof strings
		// that or about ids that don't resemble Parsoid types/about ids.
		if (!psdAttr) {
			// php's `getAttribsRegex` only permits attribute keys matching
			// these classes.
			if (!/^[:A-Z_a-z0-9][:A-Z_a-z-.0-9]*$/.test(k)) {
				newAttrs[k] = [null, origV, origK];
				continue;
			}

			// If RDFa is enabled, don't block XML namespace declaration
			if (allowRdfa && xmlnsRE.test(k)) {
				if (!evilUriRE.test(v)) {
					newAttrs[k] = [v, origV, origK];
				} else {
					newAttrs[k] = [null, origV, origK];
				}
				continue;
			}

			// If in HTML5 mode, don't block data-* attributes
			// (But always block data-ooui attributes for security: T105413)
			if (!(html5Mode && (/^data-(?!ooui)[^:]*$/i).test(k)) && !wlist.has(k)) {
				newAttrs[k] = [null, origV, origK];
				continue;
			}
		}

		// Strip javascript "expression" from stylesheets.
		// http://msdn.microsoft.com/workshop/author/dhtml/overview/recalc.asp
		if (k === 'style') {
			v = Sanitizer.checkCss(v);
		}

		if (k === 'id') {
			v = Sanitizer.escapeId(v, { 'noninitial': true });
		}

		// RDFa and microdata properties allow URLs, URIs and/or CURIs.
		// Check them for sanity
		if (microData.has(k)) {
			// Paranoia. Allow "simple" values but suppress javascript
			if (evilUriRE.test(v)) {
				// Retain the Parsoid typeofs for Parsoid attrs
				var newV = psdAttr ? origV.replace(/(?:^|\s)(?!mw:\w)[^\s]*/g, '').trim() : null;
				newAttrs[k] = [newV, origV, origK];
				continue;
			}
		}

		// NOTE: Even though elements using href/src are not allowed directly,
		// supply validation code that can be used by tag hook handlers, etc
		if (k === 'href' || k === 'src') {
			// `origV` will always be `v`, because `a.vsrc` isn't set, since
			// this attribute didn't come from source.  However, in the
			// LinkHandler, we may have already shadowed this value so use
			// that instead.
			var origHref = token.getAttributeShadowInfo(k).value;
			var newHref = Sanitizer.cleanUrl(this.manager.env, v);
			if (newHref !== v) {
				newAttrs[k] = [newHref, origHref, origK];
				continue;
			}
		}

		// SSS FIXME: This logic is not RT-friendly.
		// If this attribute was previously set, override it.
		// Output should only have one attribute of each name.
		newAttrs[k] = [v, origV, origK];

		if (!allowMda) {
			// itemtype, itemid, itemref don't make sense without itemscope
			if (newAttrs.itemscope === undefined) {
				// SSS FIXME: This logic is not RT-friendly.
				newAttrs.itemtype = undefined;
				newAttrs.itemid = undefined;
			}
			// TODO: Strip itemprop if we aren't descendants of an itemscope.
		}
	}

	// SSS FIXME: We are right now adding shadow information for all sanitized
	// attributes.  This is being done to minimize dirty diffs for the first
	// cut.  It can be reasonably argued that we can permanently delete dangerous
	// and unacceptable attributes in the interest of safety/security and the
	// resultant dirty diffs should be acceptable.  But, this is something to do
	// in the future once we have passed the initial tests of parsoid acceptance.
	//
	// Reset token attribs and rebuild
	token.attribs = [];
	Object.keys(newAttrs).forEach(function(j) {
		var vs = newAttrs[j];
		// explicit check against null to prevent discarding empty strings
		if (vs[0] !== null) {
			token.addNormalizedAttribute(j, vs[0], vs[1]);
		} else {
			token.setShadowInfo(vs[2], vs[0], vs[1]);
		}
	});
};

if (typeof module === "object") {
	module.exports.Sanitizer = Sanitizer;
	module.exports.SanitizerConstants = SanitizerConstants;
}
