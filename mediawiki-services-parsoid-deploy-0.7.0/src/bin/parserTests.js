#!/usr/bin/env node
/*
 * Parsoid test runner
 *
 * This pulls all the parserTests.txt items and runs them through Parsoid.
 */
'use strict';
require('../core-upgrade.js');

var serviceWrapper = require('../tests/serviceWrapper.js');
var async = require('async');
var fs = require('fs');
var path = require('path');
var Alea = require('alea');
var DU = require('../lib/utils/DOMUtils.js').DOMUtils;
var Promise = require('../lib/utils/promise.js');
var ParsoidLogger = require('../lib/logger/ParsoidLogger.js').ParsoidLogger;
var PEG = require('pegjs');
var Util = require('../lib/utils/Util.js').Util;
var JSUtils = require('../lib/utils/jsutils.js').JSUtils;
var PTUtils = require('../tests/parserTests.utils.js');

// Fetch up some of our wacky parser bits...
var MWParserEnvironment = require('../lib/config/MWParserEnvironment.js').MWParserEnvironment;
var ParsoidConfig = require('../lib/config/ParsoidConfig.js').ParsoidConfig;
// be careful to load our extension code with the correct parent module.
var ParserHook = ParsoidConfig.loadExtension(
	path.resolve(__dirname, '../tests/parserTestsParserHook.js')
);

var exitUnexpected = new Error('unexpected failure');  // unique marker value

/**
 * @class
 *
 * Main class for the test environment.
 *
 * @singleton
 * @private
 */
function ParserTests(testFilePath, modes) {
	var parseFilePath = path.parse(testFilePath);
	this.testFileName = parseFilePath.base;
	this.testFilePath = testFilePath;

	// Name of file used to cache the parser tests cases
	this.cacheFileName = parseFilePath.name + '.cache';
	this.cacheFilePath = path.resolve(parseFilePath.dir, this.cacheFileName);

	var whiteListName = parseFilePath.name + '-whitelist.js';
	this.whiteListPath = path.resolve(parseFilePath.dir, whiteListName);
	try {
		this.testWhiteList = require(this.whiteListPath).testWhiteList;
		console.warn('Using whitelist from ' + this.whiteListPath);
	} catch (e) {
		this.testWhiteList = {};
	}

	var blackListName = parseFilePath.name + '-blacklist.js';
	this.blackListPath = path.resolve(parseFilePath.dir, blackListName);
	try {
		this.testBlackList = require(this.blackListPath).testBlackList;
	} catch (e) {
		console.warn('No blacklist found at ' + this.blackListPath);
		this.testBlackList = {};
	}

	this.articles = {};
	this.tests = new Set();

	// Test statistics
	this.stats = {};
	this.stats.passedTests = 0;
	this.stats.passedTestsWhitelisted = 0;
	this.stats.passedTestsUnexpected = 0;
	this.stats.failedTests = 0;
	this.stats.failedTestsUnexpected = 0;

	var newModes = {};
	for (var i = 0; i < modes.length; i++) {
		newModes[modes[i]] = Util.clone(this.stats);
		newModes[modes[i]].failList = [];
		newModes[modes[i]].result = '';  // XML reporter uses this.
	}
	this.stats.modes = newModes;
}

/**
 * @method
 *
 * Get an object holding our tests cases. Eventually from a cache file
 *
 * @param {Object} argv
 * @return {Object}
 */
ParserTests.prototype.getTests = function(argv) {
	// Startup by loading .txt test file
	var testFile = fs.readFileSync(this.testFilePath, 'utf8');

	if (!Util.booleanOption(argv.cache)) {
		// Cache not wanted, parse file and return object
		return this.parseTestCase(testFile);
	}

	// Track files imported / required
	var fileDependencies = [
		this.testFilePath,
		this.testParserFilePath,
	];

	// Find out modification time of all files dependencies and then hash those
	// to make a unique value using sha1.
	var mtimes = fileDependencies.sort().map(function(file) {
		return fs.statSync(file).mtime;
	}).join('|');

	var sha1 = require('crypto')
		.createHash('sha1')
		.update(mtimes)
		.digest('hex');

	// Look for a cacheFile
	var cacheContent;
	var cacheFileDigest;
	try {
		cacheContent = fs.readFileSync(this.cacheFilePath, 'utf8');
		// Fetch previous digest
		cacheFileDigest = cacheContent.match(/^CACHE: (\w+)\n/)[1];
	} catch (e4) {
		// cache file does not exist
	}

	if (cacheFileDigest === sha1) {
		// cache file match our digest.
		// Return contained object after removing first line (CACHE: <sha1>)
		return JSON.parse(cacheContent.replace(/^.*\n/, ''));
	} else {
		// Write new file cache, content preprended with current digest
		console.error("Cache file either not present or outdated");
		var parse = this.parseTestCase(testFile);
		fs.writeFileSync(this.cacheFilePath,
			"CACHE: " + sha1 + "\n" + JSON.stringify(parse),
			'utf8'
		);
		// We can now return the parsed object
		return parse;
	}
};

/**
 * @method
 *
 * Parse content of tests case file given as plaintext
 *
 * @param {string} content
 * @return {Array}
 */
ParserTests.prototype.parseTestCase = function(content) {
	return this.testParser.parse(content);
};

/**
 * @method
 *
 * Convert a DOM to Wikitext.
 *
 * @param {Object} options
 * @param {string} mode
 * @param {Object} item
 * @param {Node} body
 * @param {Function} processWikitextCB
 * @param {Error|null} processWikitextCB.err
 * @param {string|null} processWikitextCB.res
 */
ParserTests.prototype.convertHtml2Wt = function(options, mode, item, body, processWikitextCB) {
	var self = this;
	return Promise.try(function() {
		var startsAtWikitext = mode === 'wt2wt' || mode === 'wt2html' || mode === 'selser';
		if (startsAtWikitext) {
			// FIXME: All tests share an env.
			// => we need to initialize this each time over here.
			self.env.page.dom = DU.parseHTML(item.cachedBODYstr).body;
		}
		if (mode === 'selser') {
			self.env.setPageSrcInfo(item.wikitext);
		} else if (Util.booleanOption(options.use_source) && startsAtWikitext) {
			self.env.setPageSrcInfo(item.wikitext);
		} else {
			self.env.setPageSrcInfo(null);
		}
		var handler = self.env.getContentHandler();
		return handler.fromHTML(self.env, body, (mode === 'selser'));
	}).finally(function() {
		self.env.setPageSrcInfo(null);
		self.env.page.dom = null;
	}).nodify(processWikitextCB);
};

/**
 * @method
 *
 * For a selser test, check if a change we could make has already been tested in this round.
 * Used for generating unique tests.
 *
 * @param {Array} allChanges Already-tried changes
 * @param {Array} change Candidate change
 * @return {boolean}
 */
ParserTests.prototype.isDuplicateChangeTree = function(allChanges, change) {
	if (!Array.isArray(allChanges)) {
		return false;
	}

	var i;
	for (i = 0; i < allChanges.length; i++) {
		if (JSUtils.deepEquals(allChanges[i], change)) {
			return true;
		}
	}
	return false;
};

// Random string used as selser comment content
var staticRandomString = "ahseeyooxooZ8Oon0boh";

/**
 * @method
 *
 * Make changes to a DOM in order to run a selser test on it.
 *
 * @param {Object} item
 * @param {Node} body
 * @param {Array} changelist
 * @param {Function} cb
 * @param {Error} cb.err
 * @param {Node} cb.body
 */
ParserTests.prototype.applyChanges = function(item, body, changelist, cb) {
	var self = this;

	// Seed the random-number generator based on the item title
	var random = new Alea((item.seed || '') + (item.title || ''));

	// Keep the changes in the item object
	// to check for duplicates after the waterfall
	item.changes = changelist;

	// Helper function for getting a random string
	function randomString() {
		return random().toString(36).slice(2);
	}

	function insertNewNode(n) {
		// Insert a text node, if not in a fosterable position.
		// If in foster position, enter a comment.
		// In either case, dom-diff should register a new node
		var str = randomString();
		var ownerDoc = n.ownerDocument;
		var wrapperName;
		var newNode;

		// For these container nodes, it would be buggy
		// to insert text nodes as children
		switch (n.parentNode.nodeName) {
			case 'OL':
			case 'UL': wrapperName = 'LI'; break;
			case 'DL': wrapperName = 'DD'; break;
			case 'TR':
				var prev = n.previousElementSibling;
				if (prev) {
					// TH or TD
					wrapperName = prev.nodeName;
				} else {
					var next = n.nextElementSibling;
					if (next) {
						// TH or TD
						wrapperName = next.nodeName;
					} else {
						wrapperName = 'TD';
					}
				}
				break;
			case 'BODY': wrapperName = 'P'; break;
			default:
				if (DU.isBlockNodeWithVisibleWT(n)) {
					wrapperName = 'P';
				}
				break;
		}

		if (DU.isFosterablePosition(n) && n.parentNode.nodeName !== 'TR') {
			newNode = ownerDoc.createComment(str);
		} else if (wrapperName) {
			newNode = ownerDoc.createElement(wrapperName);
			newNode.appendChild(ownerDoc.createTextNode(str));
		} else {
			newNode = ownerDoc.createTextNode(str);
		}

		n.parentNode.insertBefore(newNode, n);
	}

	function removeNode(n) {
		n.parentNode.removeChild(n);
	}

	function applyChangesInternal(node, changes) {
		if (!node) {
			// FIXME: Generate change assignments dynamically
			self.env.log("error", "no node in applyChangesInternal, ",
					"HTML structure likely changed");
			return;
		}

		// Clone the array since it could be modified below
		var nodes = Util.clone(node.childNodes);

		for (var i = 0; i < changes.length; i++) {
			var child = nodes[i];
			var change = changes[i];

			if (Array.isArray(change)) {
				applyChangesInternal(child, change);
			} else {
				switch (change) {
					// No change
					case 0:
						break;

					// Change node wrapper
					// (sufficient to insert a random attr)
					case 1:
						if (DU.isElt(child)) {
							child.setAttribute('data-foobar', randomString());
						} else {
							self.env.log("error", "Buggy changetree. changetype 1 (modify attribute) cannot be applied on text/comment nodes.");
						}
						break;

					// Insert new node before child
					case 2:
						insertNewNode(child);
						break;

					// Delete tree rooted at child
					case 3:
						removeNode(child);
						break;

					// Change tree rooted at child
					case 4:
						insertNewNode(child);
						removeNode(child);
						break;

				}
			}
		}
	}

	if (this.env.conf.parsoid.dumpFlags &&
		this.env.conf.parsoid.dumpFlags.indexOf("dom:post-changes") !== -1) {
		DU.dumpDOM(body, 'Original DOM');
	}

	if (item.changes === 5) {
		// Hack so that we can work on the parent node rather than just the
		// children: Append a comment with known content. This is later
		// stripped from the output, and the result is compared to the
		// original wikitext rather than the non-selser wt2wt result.
		body.appendChild(body.ownerDocument.createComment(staticRandomString));
	} else if (item.changes !== 0) {
		applyChangesInternal(body, item.changes);
	}

	if (this.env.conf.parsoid.dumpFlags &&
		this.env.conf.parsoid.dumpFlags.indexOf("dom:post-changes") !== -1) {
		console.warn("Change tree : " + JSON.stringify(item.changes));
		DU.dumpDOM(body, 'Edited DOM');
	}

	if (cb) {
		cb(null, body);
	}
};

/**
 * @method
 *
 * Generate a change object for a document, so we can apply it during a selser test.
 *
 * @param {Object} options
 * @param {Object} item
 * @param {Node} body
 * @param {Function} cb
 * @param {Error|null} cb.err
 * @param {Node} cb.body
 * @param {Array} cb.changelist
 */
ParserTests.prototype.generateChanges = function(options, item, body, cb) {
	var self = this;
	var random = new Alea((item.seed || '') + (item.title || ''));

	/**
	 * If no node in the DOM subtree rooted at 'node' is editable in the VE,
	 * this function should return false.
	 *
	 * Currently true for template and extension content, and for entities.
	 */
	function domSubtreeIsEditable(env, node) {
		return !DU.isEncapsulationWrapper(node) &&
			!(DU.isElt(node) && node.getAttribute("typeof") === "mw:Entity");
	}

	/**
	 * Even if a DOM subtree might be editable in the VE,
	 * certain nodes in the DOM might not be directly editable.
	 *
	 * Currently, this restriction is only applied to DOMs generated for images.
	 * Possibly, there are other candidates.
	 */
	function nodeIsUneditable(node) {
		// Text and comment nodes are always editable
		if (!DU.isElt(node)) {
			return false;
		}

		// - Meta tag providing info about tpl-affected attrs is uneditable.
		//
		//   SSS FIXME: This is not very useful right now because sometimes,
		//   these meta-tags are not siblings with the element that it applies to.
		//   So, you can still end up deleting the meta-tag (by deleting its parent)
		//   and losing this property.  See example below.  The best fix for this is
		//   to hoist all these kind of meta tags into <head>, start, or end of doc.
		//   Then, we don't even have to check for editability of these nodes here.
		//
		//   Ex:
		//   ...
		//   <td><meta about="#mwt2" property="mw:objectAttrVal#style" ...>..</td>
		//   <td about="#mwt2" typeof="mw:ExpandedAttrs/Transclusion" ...>..</td>
		//   ...
		if ((/\bmw:objectAttr/).test(node.getAttribute('property'))) {
			return true;
		}

		// - Image wrapper is an uneditable image elt.
		// - Any node nested in an image elt that is not a fig-caption
		//   is an uneditable image elt.
		// - Entity spans are uneditable as well
		return (/\bmw:(Image|Entity)\b/).test(node.getAttribute('typeof')) ||
			(
				node.nodeName !== 'FIGCAPTION' &&
				node.parentNode &&
				node.parentNode.nodeName !== 'BODY' &&
				nodeIsUneditable(node.parentNode)
			);
	}

	function hasChangeMarkers(list) {
		// If all recorded changes are 0, then nothing has been modified
		return list.some(function(c) {
			return Array.isArray(c) ? hasChangeMarkers(c) : (c > 0);
		});
	}

	function genChangesInternal(node) {
		// Seed the random-number generator based on the item title
		var changelist = [];
		var children = node.childNodes;
		var n = children.length;

		for (var i = 0; i < n; i++) {
			var child = children[i];
			var changeType = 0;

			if (domSubtreeIsEditable(self.env, child)) {
				if (nodeIsUneditable(child) || random() < 0.5) {
					// This call to random is a hack to preserve the current
					// determined state of our blacklist entries after a
					// refactor.
					random.uint32();
					changeType = genChangesInternal(child);
				} else {
					if (!child.setAttribute) {
						// Text or comment node -- valid changes: 2, 3, 4
						// since we cannot set attributes on these
						changeType = Math.floor(random() * 3) + 2;
					} else {
						changeType = Math.floor(random() * 4) + 1;
					}
				}
			}

			changelist.push(changeType);
		}

		return hasChangeMarkers(changelist) ? changelist : 0;
	}

	var changeTree;
	var numAttempts = 0;
	do {
		numAttempts++;
		changeTree = genChangesInternal(body);
	} while (
		numAttempts < 1000 &&
		(changeTree.length === 0 || self.isDuplicateChangeTree(item.selserChangeTrees, changeTree))
	);

	if (numAttempts === 1000) {
		// couldn't generate a change ... marking as such
		item.duplicateChange = true;
	}

	cb(null, body, changeTree);
};

ParserTests.prototype.applyManualChanges = function(body, changes, cb) {
	var err = null;
	// changes are specified using jquery methods.
	//  [x,y,z...] becomes $(x)[y](z....)
	// that is, ['fig', 'attr', 'width', '120'] is interpreted as
	//   $('fig').attr('width', '120')
	// See http://api.jquery.com/ for documentation of these methods.
	// "contents" as second argument calls the jquery .contents() method
	// on the results of the selector in the first argument, which is
	// a good way to get at the text and comment nodes
	var jquery = {
		after: function(html) {
			var div, tbl;
			if (this.parentNode.nodeName === 'TBODY') {
				tbl = this.ownerDocument.createElement('table');
				tbl.innerHTML = html;
				// <tbody> is implicitly added when inner html is set to <tr>..</tr>
				DU.migrateChildren(tbl.firstChild, this.parentNode, this.nextSibling);
			} else if (this.parentNode.nodeName === 'TR') {
				tbl = this.ownerDocument.createElement('table');
				tbl.innerHTML = '<tbody><tr></tr></tbody>';
				tbl.firstChild.firstChild.innerHTML = html;
				DU.migrateChildren(tbl.firstChild.firstChild, this.parentNode, this.nextSibling);
			} else {
				div = this.ownerDocument.createElement('div');
				div.innerHTML = html;
				DU.migrateChildren(div, this.parentNode, this.nextSibling);
			}
		},
		attr: function(name, val) {
			this.setAttribute(name, val);
		},
		before: function(html) {
			var div, tbl;
			if (this.parentNode.nodeName === 'TBODY') {
				tbl = this.ownerDocument.createElement('table');
				tbl.innerHTML = html;
				// <tbody> is implicitly added when inner html is set to <tr>..</tr>
				DU.migrateChildren(tbl.firstChild, this.parentNode, this);
			} else if (this.parentNode.nodeName === 'TR') {
				tbl = this.ownerDocument.createElement('table');
				tbl.innerHTML = '<tbody><tr></tr></tbody>';
				tbl.firstChild.firstChild.innerHTML = html;
				DU.migrateChildren(tbl.firstChild.firstChild, this.parentNode, this);
			} else {
				div = this.ownerDocument.createElement('div');
				div.innerHTML = html;
				DU.migrateChildren(div, this.parentNode, this);
			}
		},
		removeAttr: function(name) {
			this.removeAttribute(name);
		},
		removeClass: function(c) {
			this.classList.remove(c);
		},
		addClass: function(c) {
			this.classList.add(c);
		},
		text: function(t) {
			this.textContent = t;
		},
		html: function(h) {
			this.innerHTML = h;
		},
		remove: function(optSelector) {
			// jquery lets us specify an optional selector to further
			// restrict the removed elements.
			// text nodes don't have the "querySelectorAll" method, so
			// just include them by default (jquery excludes them, which
			// is less useful)
			var what = !optSelector ? [ this ] :
				!DU.isElt(this) ? [ this ] /* text node hack! */ :
				this.querySelectorAll(optSelector);
			Array.prototype.forEach.call(what, function(node) {
				if (node.parentNode) { node.parentNode.removeChild(node); }
			});
		},
		empty: function() {
			while (this.firstChild) {
				this.removeChild(this.firstChild);
			}
		},
	};

	changes.forEach(function(change) {
		if (err) { return; }
		if (change.length < 2) {
			err = new Error('bad change: ' + change);
			return;
		}
		// use document.querySelectorAll as a poor man's $(...)
		var els = body.querySelectorAll(change[0]);
		if (!els.length) {
			err = new Error(change[0] + ' did not match any elements: ' + body.outerHTML);
			return;
		}
		if (change[1] === 'contents') {
			change = change.slice(1);
			els = Array.prototype.reduce.call(els, function(acc, el) {
				acc.push.apply(acc, el.childNodes);
				return acc;
			}, []);
		}
		var fun = jquery[change[1]];
		if (!fun) {
			err = new Error('bad mutator function: ' + change[1]);
			return;
		}
		Array.prototype.forEach.call(els, function(el) {
			fun.apply(el, change.slice(2));
		});
	});
	if (err) { console.log(err.toString().red); }
	cb(err, body);
};

/**
 * @method
 * @param {string} mode
 * @param {string} wikitext
 * @param {Function} processHtmlCB
 * @param {Error|null} processHtmlCB.err
 * @param {Node|null} processHtmlCB.body
 */
ParserTests.prototype.convertWt2Html = function(mode, wikitext, processHtmlCB) {
	var env = this.env;
	env.setPageSrcInfo(wikitext);
	env.getContentHandler().toHTML(env)
	.then(function(doc) {
		return doc.body;
	})
	.nodify(processHtmlCB);
};

/**
 * @method
 * @param {Object} item
 * @param {Object} options
 * @param {string} mode
 * @param {Function} endCb
 */
ParserTests.prototype.prepareTest = function(item, options, mode, endCb) {
	if (!('title' in item)) {
		return endCb(new Error('Missing title from test case.'));
	}

	item.time = {};

	if (item.options) {
		console.assert(item.options.extensions === undefined);

		this.env.conf.wiki.namespacesWithSubpages[0] = false;

		// Since we are reusing the 'env' object, set it to the default
		// so that relative link prefix is back to "./"
		this.env.initializeForPageName(this.env.defaultPageName);

		if (item.options.subpage !== undefined) {
			this.env.conf.wiki.namespacesWithSubpages[0] = true;
		}

		if (item.options.title !== undefined &&
				!Array.isArray(item.options.title)) {
			// Strip the [[]] markers.
			var title = item.options.title.replace(/^\[\[|\]\]$/g, '');
			// This sets the page name as well as the relative link prefix
			// for the rest of the parse.  Do this redundantly with the above
			// so that we start from the defaultPageName when resolving
			// absolute subpages.
			this.env.initializeForPageName(title);
		}
		// Page language matches "wiki language" (which is set by
		// the item 'language' option).
		this.env.page.pagelanguage = this.env.conf.wiki.lang;
		this.env.page.pagelanguagedir = this.env.conf.wiki.rtl ? 'rtl' : 'ltr';

		this.env.conf.wiki.allowExternalImages = [ '' ]; // all allowed
		if (item.options.wgallowexternalimages !== undefined &&
				!/^(1|true|)$/.test(item.options.wgallowexternalimages)) {
			this.env.conf.wiki.allowExternalImages = undefined;
		}

		this.env.scrubWikitext = item.options.parsoid &&
			item.options.parsoid.hasOwnProperty('scrubWikitext') ?
				item.options.parsoid.scrubWikitext :
				MWParserEnvironment.prototype.scrubWikitext;

		this.env.nativeGallery = item.options.parsoid &&
			item.options.parsoid.hasOwnProperty('nativeGallery') ?
				item.options.parsoid.nativeGallery :
				MWParserEnvironment.prototype.nativeGallery;

	}

	// Build a list of tasks for this test that will be passed to async.waterfall
	var finishHandler = function(err) {
		setImmediate(endCb, err);
	}.bind(this);

	var testTasks = [];

	// Some useful booleans
	var startsAtHtml = mode === 'html2html' || mode === 'html2wt';
	var endsAtWikitext = mode === 'wt2wt' || mode === 'selser' || mode === 'html2wt';
	var endsAtHtml = mode === 'wt2html' || mode === 'html2html';

	var parsoidOnly =
		('html/parsoid' in item) ||
		(item.options.parsoid !== undefined && !item.options.parsoid.normalizePhp);

	// Source preparation
	if (startsAtHtml) {
		testTasks.push(function(cb) {
			var html = item.html;
			if (!parsoidOnly) {
				// Strip some php output that has no wikitext representation
				// (like .mw-editsection) and won't html2html roundtrip and
				// therefore causes false failures.
				html = DU.normalizePhpOutput(html);
			}
			cb(null, DU.parseHTML(html).body);
		});
		testTasks.push(this.convertHtml2Wt.bind(this, options, mode, item));
	} else {  // startsAtWikitext
		// Always serialize DOM to string and reparse before passing to wt2wt
		if (item.cachedBODYstr === null) {
			testTasks.push(this.convertWt2Html.bind(this, mode, item.wikitext));
			// Caching stage 1 - save the result of the first two stages
			// so we can maybe skip them later
			testTasks.push(function(body, cb) {
				// Cache parsed HTML
				item.cachedBODYstr = DU.toXML(body);

				// - In wt2html mode, pass through original DOM
				//   so that it is serialized just once.
				// - In wt2wt and selser modes, pass through serialized and
				//   reparsed DOM so that fostering/normalization effects
				//   are reproduced.
				if (mode === "wt2html") {
					cb(null, body);
				} else {
					cb(null, DU.parseHTML(item.cachedBODYstr).body);
				}
			});
		} else {
			testTasks.push(function(cb) {
				cb(null, DU.parseHTML(item.cachedBODYstr).body);
			});
		}
	}

	// Generate and make changes for the selser test mode
	if (mode === 'selser') {
		if ((options.selser === 'noauto' || item.changetree === 'manual') &&
			item.options.parsoid && item.options.parsoid.changes) {
			testTasks.push(function(body, cb) {
				// Ensure that we have this set here in case it hasn't been
				// set in buildTasks because the 'selser=noauto' option was passed.
				item.changetree = 'manual';
				this.applyManualChanges(body, item.options.parsoid.changes, cb);
			}.bind(this));
		} else {
			var changetree = options.changetree ? JSON.parse(options.changetree) : item.changetree;
			if (changetree) {
				testTasks.push(function(content, cb) {
					cb(null, content, changetree);
				});
			} else {
				testTasks.push(this.generateChanges.bind(this, options, item));
			}
			testTasks.push(this.applyChanges.bind(this, item));
		}
		// Save the modified DOM so we can re-test it later
		// Always serialize to string and reparse before passing to selser/wt2wt
		testTasks.push(function(body, cb) {
			item.changedHTMLStr = DU.toXML(body);
			cb(null, DU.parseHTML(item.changedHTMLStr).body);
		});
	} else if (mode === 'wt2wt') {
		// handle a 'changes' option if present.
		if (item.options.parsoid && item.options.parsoid.changes) {
			testTasks.push(function(body, cb) {
				this.applyManualChanges(body, item.options.parsoid.changes, cb);
			}.bind(this));
		}
	}

	// Roundtrip stage
	if (mode === 'wt2wt' || mode === 'selser') {
		testTasks.push(this.convertHtml2Wt.bind(this, options, mode, item));
	} else if (mode === 'html2html') {
		testTasks.push(this.convertWt2Html.bind(this, mode));
	}

	// Processing stage
	if (endsAtWikitext) {
		testTasks.push(this.processSerializedWT.bind(this, item, options, mode));
	} else if (endsAtHtml) {
		testTasks.push(this.processParsedHTML.bind(this, item, options, mode));
	}

	item.time.start = Date.now();
	async.waterfall(testTasks, finishHandler);
};

/**
 * @method
 * @param {Object} item
 * @param {Object} options
 * @param {string} mode
 * @param {Node} body
 * @param {Function} cb
 */
ParserTests.prototype.processParsedHTML = function(item, options, mode, body, cb) {
	item.time.end = Date.now();
	// Check the result vs. the expected result.
	var checkPassed = this.checkHTML(item, body, options, mode);

	// Now schedule the next test, if any
	// Only pass an error if --exit-unexpected was set and there was an error
	// Otherwise, pass undefined so that async.waterfall continues
	var err = (options['exit-unexpected'] && !checkPassed) ?
			exitUnexpected : null;
	setImmediate(cb, err);
};

/**
 * @method
 * @param {Object} item
 * @param {Object} options
 * @param {string} mode
 * @param {string} wikitext
 * @param {Function} cb
 */
ParserTests.prototype.processSerializedWT = function(item, options, mode, wikitext, cb) {
	item.time.end = Date.now();

	var self = this;
	var checkAndReturn = function() {
		// Check the result vs. the expected result.
		var checkPassed = self.checkWikitext(item, wikitext, options, mode);

		// Now schedule the next test, if any.
		// Only pass an error if --exit-unexpected was set and there was an
		// error. Otherwise, pass undefined so that async.waterfall continues
		var err = (options['exit-unexpected'] && !checkPassed) ?
				exitUnexpected : null;
		setImmediate(cb, err);
	};

	if (mode === 'selser' && options.selser !== 'noauto') {
		if (item.changetree === 5) {
			item.resultWT = item.wikitext;
		} else {
			var body = DU.parseHTML(item.changedHTMLStr).body;
			this.convertHtml2Wt(options, 'wt2wt', item, body, function(err, wt) {
				if (err === null) {
					item.resultWT = wt;
				} else {
					// FIXME: what's going on here? Error handling here is suspect.
					self.env.log('warn', 'Convert html2wt erred!');
					item.resultWT = item.wikitext;
				}
				return checkAndReturn();
			});
			// Async processing
			return;
		}
	}

	// Sync processing
	return checkAndReturn();
};

/**
 * @param {Object} item
 * @param {string} out
 * @param {Object} options
 */
ParserTests.prototype.checkHTML = function(item, out, options, mode) {
	var normalizedOut, normalizedExpected;
	var parsoidOnly =
		('html/parsoid' in item) ||
		(item.options.parsoid !== undefined && !item.options.parsoid.normalizePhp);

	normalizedOut = DU.normalizeOut(out, parsoidOnly);
	out = DU.toXML(out, { innerXML: true });

	if (item.cachedNormalizedHTML === null) {
		if (parsoidOnly) {
			var normalDOM = DU.parseHTML(item.html).body;
			normalizedExpected = DU.normalizeOut(normalDOM, parsoidOnly);
		} else {
			normalizedExpected = DU.normalizeHTML(item.html);
		}
		item.cachedNormalizedHTML = normalizedExpected;
	} else {
		normalizedExpected = item.cachedNormalizedHTML;
	}

	var input = mode === 'html2html' ? item.html : item.wikitext;
	var expected = { normal: normalizedExpected, raw: item.html };
	var actual = { normal: normalizedOut, raw: out, input: input };

	return options.reportResult(this.testBlackList, this.testWhiteList, this.stats, item, options, mode, expected, actual);
};

/**
 * @param {Object} item
 * @param {string} out
 * @param {Object} options
 */
ParserTests.prototype.checkWikitext = function(item, out, options, mode) {
	var itemWikitext = item.wikitext;
	out = out.replace(new RegExp('<!--' + staticRandomString + '-->', 'g'), '');
	if (mode === 'selser' && item.resultWT !== null &&
			item.changes !== 5 && item.changetree !== 'manual') {
		itemWikitext = item.resultWT;
	} else if ((mode === 'wt2wt' || (mode === 'selser' && item.changetree === 'manual')) &&
				item.options.parsoid && item.options.parsoid.changes) {
		itemWikitext = item['wikitext/edited'];
	}

	var toWikiText = mode === 'html2wt' || mode === 'wt2wt' || mode === 'selser';
	// FIXME: normalization not in place yet
	var normalizedExpected = toWikiText ? itemWikitext.replace(/\n+$/, '') : itemWikitext;

	// FIXME: normalization not in place yet
	var normalizedOut = toWikiText ? out.replace(/\n+$/, '') : out;

	var input = mode === 'selser' ? item.changedHTMLStr :
			mode === 'html2wt' ? item.html : itemWikitext;
	var expected = { normal: normalizedExpected, raw: itemWikitext };
	var actual = { normal: normalizedOut, raw: out, input: input };

	return options.reportResult(this.testBlackList, this.testWhiteList, this.stats, item, options, mode, expected, actual);
};

/**
 * @method
 * @param {Object} options
 */
ParserTests.prototype.main = Promise.method(function(options, mockAPIServerURL) {
	this.runDisabled = Util.booleanOption(options['run-disabled']);
	this.runPHP = Util.booleanOption(options['run-php']);

	// test case filtering
	this.testFilter = null; // null is the 'default' by definition
	if (options.filter || options.regex) {
		// NOTE: filter.toString() is required because a number-only arg
		// shows up as a numeric type rather than a string.
		// Ex: parserTests.js --filter 53221
		var pattern = options.regex || Util.escapeRegExp(options.filter.toString());
		this.testFilter = new RegExp(pattern);
	}

	this.testParserFilePath = path.join(__dirname, '../tests/parserTests.pegjs');
	this.testParser = PEG.buildParser(fs.readFileSync(this.testParserFilePath, 'utf8'));

	this.cases = this.getTests(options);

	if (options.maxtests) {
		var n = Number(options.maxtests);
		console.warn('maxtests:' + n);
		if (n > 0) {
			this.cases.length = n;
		}
	}

	var setup = function(parsoidConfig) {
		// Set tracing and debugging before the env. object is
		// constructed since tracing backends are registered there.
		// (except for the --quiet option where the backends are
		// overridden here).
		Util.setDebuggingFlags(parsoidConfig, options);
		Util.setTemplatingAndProcessingFlags(parsoidConfig, options);

		// Init early so we can overwrite it here.
		parsoidConfig.loadWMF = false;
		parsoidConfig.initMwApiMap();

		// Needed for bidi-char-scrubbing html2wt tests.
		parsoidConfig.scrubBidiChars = true;

		var extensions = parsoidConfig.defaultNativeExtensions.concat(ParserHook);

		// Send all requests to the mock API server.
		Array.from(parsoidConfig.mwApiMap.values()).forEach(function(apiConf) {
			parsoidConfig.removeMwApi(apiConf);
			parsoidConfig.setMwApi({
				prefix: apiConf.prefix,
				domain: apiConf.domain,
				uri: mockAPIServerURL,
				extensions: extensions,
			});
		});

		// This isn't part of the sitematrix but the
		// "Check noCommafy in formatNum" test depends on it.
		parsoidConfig.removeMwApi({ domain: 'be-tarask.wikipedia.org' });
		parsoidConfig.setMwApi({
			prefix: 'be-taraskwiki',
			domain: 'be-tarask.wikipedia.org',
			uri: mockAPIServerURL,
			extensions: extensions,
		});

		// Enable sampling to assert it's working while testing.
		parsoidConfig.loggerSampling = [
			[/^warn(\/|$)/, 100],
		];

		parsoidConfig.timeouts.mwApi.connect = 10000;
	};

	var parsoidConfig = new ParsoidConfig({ setup: setup }, options);

	// Create a new parser environment
	return MWParserEnvironment.getParserEnv(parsoidConfig, { prefix: 'enwiki' })
	.then(function(env) {
		this.env = env;

		if (Util.booleanOption(options.quiet)) {
			var logger = new ParsoidLogger(env);
			logger.registerLoggingBackends(["fatal", "error"], parsoidConfig);
			env.setLogger(logger);
		}

		// Save default logger so we can be reset it after temporarily
		// switching to the suppressLogger to suppress expected error
		// messages.
		this.defaultLogger = env.logger;
		this.suppressLogger = new ParsoidLogger(env);
		this.suppressLogger.registerLoggingBackends(["fatal"], parsoidConfig);

		// Override env's `setLogger` to record if we see `fatal` or `error`
		// while running parser tests.  (Keep it clean, folks!  Use
		// "suppressError" option on the test if error is expected.)
		this.loggedErrorCount = 0;
		env.setLogger = (function(parserTests, superSetLogger) {
			return function(_logger) {
				superSetLogger.call(this, _logger);
				this.log = function(level) {
					if (_logger !== parserTests.suppressLogger &&
						/^(fatal|error)\b/.test(level)) {
						parserTests.loggedErrorCount++;
					}
					return _logger.log.apply(_logger, arguments);
				};
			};
		})(this, env.setLogger);

		if (console.time && console.timeEnd) {
			console.time('Execution time');
		}
		options.reportStart();
		this.env.pageCache = this.articles;
		this.comments = [];
		return this.processCase(0, options, false);
	}.bind(this));
});

/**
 * FIXME: clean up this mess!
 * - generate all changes at once (generateChanges should return a tree
 *   really) rather than going to all these lengths of interleaving change
 *   generation with tests
 * - set up the changes in item directly rather than juggling around with
 *   indexes etc
 * - indicate whether to compare to wt2wt or the original input
 * - maybe make a full selser test one method that uses others rather than the
 *   current chain of methods that sometimes do something for selser
 *
 * @method
 */
ParserTests.prototype.buildTasks = function(item, targetModes, options) {
	var tasks = [];
	var self = this;
	for (var i = 0; i < targetModes.length; i++) {
		if (targetModes[i] === 'selser' && options.numchanges &&
			options.selser !== 'noauto' && !options.changetree) {
			var newitem;

			// Prepend manual changes, if present, but not if 'selser' isn't
			// in the explicit modes option.
			if (item.options.parsoid && item.options.parsoid.changes) {
				tasks.push(function(cb) {
					newitem = Util.clone(item);
					// Mutating the item here is necessary to output 'manual' in
					// the test's title and to differentiate it for blacklist.
					// It can only get here in two cases:
					// * When there's no changetree specified in the command line,
					//   buildTasks creates the items by cloning the original one,
					//   so there should be no problem setting it.
					//   In fact, it will override the existing 'manual' value
					//   (lines 1765 and 1767).
					// * When a changetree is specified in the command line and
					//   it's 'manual', there shouldn't be a problem setting the
					//   value here as no other items will be processed.
					// Still, protect against changing a different copy of the item.
					console.assert(newitem.changetree === 'manual' ||
						newitem.changetree === undefined);
					newitem.changetree = 'manual';
					self.prepareTest(newitem, options, 'selser', function(err) {
						setImmediate(cb, err);
					});
				});
			}
			// And if that's all we want, next one.
			if (item.options.parsoid && item.options.parsoid.selser === 'noauto') {
				continue;
			}

			item.selserChangeTrees = new Array(options.numchanges);

			// Prepend a selser test that appends a comment to the root node
			tasks.push(function(cb) {
				newitem = Util.clone(item);
				newitem.changetree = 5;
				self.prepareTest(newitem, options, 'selser', function(err) {
					setImmediate(cb, err);
				});
			});

			var done = false;
			for (var j = 0; j < item.selserChangeTrees.length; j++) {
				// we create the function in the loop but are careful to
				// bind loop variables i and j at function creation time
				/* jshint loopfunc: true */
				tasks.push(function(modeIndex, changesIndex, cb) {
					if (done) {
						setImmediate(cb);
					} else {
						newitem = Util.clone(item);
						// Make sure we aren't reusing the one from manual changes
						console.assert(newitem.changetree === undefined);
						newitem.seed = changesIndex + '';
						this.prepareTest(newitem, options, targetModes[modeIndex], function(err) {
							if (this.isDuplicateChangeTree(item.selserChangeTrees, newitem.changes)) {
								// Once we get a duplicate change tree, we can no longer
								// generate and run new tests.  So, be done now!
								done = true;
							} else {
								item.selserChangeTrees[changesIndex] = newitem.changes;
							}
							setImmediate(cb, err);
						}.bind(this));
					}
				}.bind(this, i, j));
			}
		} else {
			if (targetModes[i] === 'selser' && options.selser === 'noauto') {
				// Manual changes were requested on the command line,
				// check that the item does have them.
				if (item.options.parsoid && item.options.parsoid.changes) {
					// If it does, we need to clone the item so that previous
					// results don't clobber this one.
					tasks.push(this.prepareTest.bind(this, Util.clone(item), options, targetModes[i]));
				} else {
					// If it doesn't have manual changes, just skip it.
					continue;
				}
			} else {
				// A non-selser task, we can reuse the item.
				tasks.push(this.prepareTest.bind(this, item, options, targetModes[i]));
			}
		}
	}
	return tasks;
};

/**
 * @method
 */
ParserTests.prototype.processCase = function(i, options, earlyExit) {
	if (i < this.cases.length && !earlyExit) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var item = self.cases[i];
			self.processItem(item, options, function(err) {
				// There are two types of errors that reach here.  The first is just
				// a notification that a test failed.  We use the error propagation
				// mechanism to get back to this point to print the summary.  The
				// second type is an actual exception that we should hard fail on.
				// exitUnexpected is a sentinel for the first type.
				if (err && err !== exitUnexpected) {
					reject(err);
				} else {
					resolve(options['exit-unexpected'] && (err === exitUnexpected));
				}
			});
		})
		.then(function(ee) {
			return self.processCase(i + 1, options, ee);
		});
	} else {
		// update the blacklist, if requested
		if (Util.booleanOption(options['rewrite-blacklist'])) {
			var old;
			if (fs.existsSync(this.blackListPath)) {
				old = fs.readFileSync(this.blackListPath, 'utf8');
			} else {
				// Use the preamble from one we know about ...
				var defaultBlPath = path.join(__dirname, '../tests/parserTests-blacklist.js');
				old = fs.readFileSync(defaultBlPath, 'utf8');
			}
			var shell = old.split(/^.*DO NOT REMOVE THIS LINE.*$/m);
			var contents = shell[0];
			contents += '// ### DO NOT REMOVE THIS LINE ### ';
			contents += '(start of automatically-generated section)\n';
			options.modes.forEach(function(mode) {
				contents += '\n// Blacklist for ' + mode + '\n';
				this.stats.modes[mode].failList.forEach(function(fail) {
					contents += 'add(' + JSON.stringify(mode) + ', ' +
						JSON.stringify(fail.title);
					contents += ', ' + JSON.stringify(fail.raw);
					contents += ');\n';
				});
				contents += '\n';
			}.bind(this));
			contents += '// ### DO NOT REMOVE THIS LINE ### ';
			contents += '(end of automatically-generated section)';
			contents += shell[2];
			fs.writeFileSync(this.blackListPath, contents, 'utf8');
		}

		// Write updated tests from failed ones
		if (options['update-tests'] ||
				Util.booleanOption(options['update-unexpected'])) {
			var updateFormat = (options['update-tests'] === 'raw') ?
					'raw' : 'actualNormalized';
			var parserTests = fs.readFileSync(this.testFilePath, 'utf8');
			this.stats.modes.wt2html.failList.forEach(function(fail) {
				if (options['update-tests'] || fail.unexpected) {
					var exp = new RegExp("(" + /!!\s*test\s*/.source +
						Util.escapeRegExp(fail.title) + /(?:(?!!!\s*end)[\s\S])*/.source +
						")(" + Util.escapeRegExp(fail.expected) + ")", "m");
					parserTests = parserTests.replace(exp, "$1" +
						fail[updateFormat].replace(/\$/g, '$$$$'));
				}
			});
			fs.writeFileSync(this.testFilePath, parserTests, 'utf8');
		}

		// print out the summary
		// note: these stats won't necessarily be useful if someone
		// reimplements the reporting methods, since that's where we
		// increment the stats.
		var failures = options.reportSummary(options.modes, this.stats, this.testFileName, this.loggedErrorCount, this.testFilter);

		// we're done!
		// exit status 1 == uncaught exception
		var exitCode = failures ? 2 : 0;
		if (Util.booleanOption(options['exit-zero'])) {
			exitCode = 0;
		}

		return {
			exitCode: exitCode,
			stats: Object.assign({
				failures: failures,
				loggedErrorCount: this.loggedErrorCount,
			}, this.stats),
			file: this.testFileName,
		};
	}
};

/**
 * @method
 */
ParserTests.prototype.processItem = function(item, options, nextCallback) {
	if (typeof item !== 'object') {
		// this is a comment line in the file, ignore it.
		return setImmediate(nextCallback);
	}

	if (!item.options) { item.options = {}; }

	// backwards-compatibility aliases for section names.
	if ('input' in item) { item.wikitext = item.input; delete item.input; }
	if ('result' in item) { item.html = item.result; delete item.result; }

	// html/* and html/parsoid should be treated as html.
	[ 'html/*', 'html/*+tidy', 'html+tidy', 'html/parsoid' ].forEach(function(alt) {
		if (alt in item) {
			item.html = item[alt];
		}
	});

	// ensure that test is not skipped if it has a wikitext/edited section
	if ('wikitext/edited' in item) { item.html = true; }

	// Reset the cached results for the new case.
	// All test modes happen in a single run of processCase.
	item.cachedBODYstr = null;
	item.cachedNormalizedHTML = null;

	// Also reset the logger, since we might have changed it to support
	// the `suppressErrors` option.
	this.env.setLogger(this.defaultLogger);
	// Similarly for parsing resource limits.
	this.env.setResourceLimits();

	switch (item.type) {
		case 'article':
			this.comments = [];
			this.processArticle(item, nextCallback);
			break;
		case 'test':
			this.processTest(item, options, nextCallback);
			break;
		case 'comment':
			this.comments.push(item.comment);
			setImmediate(nextCallback);
			break;
		case 'hooks':
			this.comments = [];
			this.env.log('warn', 'parserTests: Unhandled extension hook', JSON.stringify(item));
			setImmediate(nextCallback);
			break;
		case 'functionhooks':
			this.comments = [];
			this.env.log("warn", "parserTests: Unhandled functionhook", JSON.stringify(item));
			setImmediate(nextCallback);
			break;
		default:
			this.comments = [];
			setImmediate(nextCallback);
			break;
	}
};

/**
 * @method
 *
 * Process an article test case (i.e. the text of an article we need for a test)
 *
 * @param {Object} item
 * @param {string} item.title
 * @param {string} item.text
 * @param {Function} cb
 */
ParserTests.prototype.processArticle = function(item, cb) {
	var err = null;
	var key = this.env.normalizedTitleKey(item.title, false, true);
	if (this.articles.hasOwnProperty(key)) {
		err = new Error('Duplicate article: ' + item.title);
	} else {
		this.articles[key] = item.text;
	}
	setImmediate(cb, err);
};

/**
 * @method
 */
ParserTests.prototype.processTest = function(item, options, nextCallback) {
	var targetModes = options.modes;
	if (this.tests.has(item.title)) {
		return setImmediate(nextCallback,
			new Error('Duplicate titles: ' + item.title));
	} else {
		this.tests.add(item.title);
	}
	if (!('wikitext' in item && 'html' in item) ||
		('disabled' in item.options && !this.runDisabled) ||
		('php' in item.options &&
			!('html/parsoid' in item || this.runPHP)) ||
		(this.testFilter &&
			-1 === item.title.search(this.testFilter))) {
		// Skip test whose title does not match --filter
		// or which is disabled or php-only
		this.comments = [];
		return setImmediate(nextCallback);
	}
	// Add comments to following test.
	item.comments = item.comments || this.comments;
	this.comments = [];
	var suppressErrors = item.options.parsoid && item.options.parsoid.suppressErrors;
	if (suppressErrors) {
		this.env.setLogger(this.suppressLogger);
	}
	if (item.options.parsoid && item.options.parsoid.modes) {
		// Avoid filtering out the selser test
		if (options.selser &&
			item.options.parsoid.modes.indexOf("selser") < 0 &&
			item.options.parsoid.modes.indexOf("wt2wt") >= 0
		) {
			item.options.parsoid.modes.push("selser");
		}

		targetModes = targetModes.filter(function(mode) {
			return item.options.parsoid.modes.indexOf(mode) >= 0;
		});
	}
	if (!targetModes.length) {
		return setImmediate(nextCallback);
	}
	// Honor language option in parserTests.txt
	var prefix = item.options.language || 'enwiki';
	if (!/wiki/.test(prefix)) {
		// Convert to our enwiki.. format
		prefix = prefix + 'wiki';
	}
	this.env.switchToConfig(prefix, function(err2) {
		if (err2) { return nextCallback(err2); }
		// TODO: set language variant
		// adjust config to match that used for PHP tests
		// see core/tests/parser/parserTest.inc:setupGlobals() for
		// full set of config normalizations done.
		var wikiConf = this.env.conf.wiki;
		wikiConf.fakeTimestamp = 123;
		wikiConf.timezoneOffset = 0; // force utc for parsertests
		wikiConf.server = 'http://example.org';
		wikiConf.wgScriptPath = '/';
		wikiConf.script = '/index.php';
		wikiConf.articlePath = '/wiki/$1';
		wikiConf.interwikiMap.clear();
		var iwl = PTUtils.iwl;
		Object.keys(iwl).forEach(function(key) {
			iwl[key].prefix = key;
			wikiConf.interwikiMap.set(key, {});
			Object.keys(iwl[key]).forEach(function(f) {
				wikiConf.interwikiMap.get(key)[f] = iwl[key][f];
			});
		});
		// Cannot modify namespaces otherwise since baseConfig is deep frozen.
		wikiConf.siteInfo.namespaces = Util.clone(wikiConf.siteInfo.namespaces, true);
		// Add 'MemoryAlpha' namespace (T53680)
		PTUtils.addNamespace(wikiConf, {
			"id": 100,
			"case": "first-letter",
			"canonical": "MemoryAlpha",
			"*": "MemoryAlpha",
		});
		// Testing
		if (wikiConf.iwp === 'enwiki') {
			PTUtils.addNamespace(wikiConf, {
				"id": 4,
				"case": "first-letter",
				"subpages": "",
				"canonical": "Project",
				"*": "Base MW",
			});
			PTUtils.addNamespace(wikiConf, {
				"id": 5,
				"case": "first-letter",
				"subpages": "",
				"canonical": "Project talk",
				"*": "Base MW talk",
			});
		}
		// Update $wgInterwikiMagic flag
		// default (undefined) setting is true
		this.env.conf.wiki.interwikimagic =
			item.options.wginterwikimagic === undefined ||
			/^(1|true|)$/.test(item.options.wginterwikimagic);

		async.series(this.buildTasks(item, targetModes, options),
			nextCallback);
	}.bind(this));
};

// Start the mock api server and kick off parser tests
Promise.resolve(null).then(function() {
	var options = PTUtils.prepareOptions();
	return serviceWrapper.runServices({ skipParsoid: true })
	.then(function(ret) {
		return [ ret.runner, options, ret.mockURL ];
	});
})
.spread(function(runner, options, mockURL) {
	var testFilePaths;
	if (options._[0]) {
		testFilePaths = [path.resolve(process.cwd(), options._[0])];
	} else {
		var testDir = path.join(__dirname, '../tests/');
		var testFilesPath = path.join(testDir, 'parserTests.json');
		var testFiles = require(testFilesPath);
		testFilePaths = Object.keys(testFiles).map(function(f) {
			return path.join(testDir, f);
		});
	}
	var stats = {
		passedTests: 0,
		passedTestsWhitelisted: 0,
		passedTestsUnexpected: 0,
		failedTests: 0,
		failedTestsUnexpected: 0,
		loggedErrorCount: 0,
		failures: 0,
	};
	return Promise.reduce(testFilePaths, function(exitCode, testFilePath) {
		var ptests = new ParserTests(testFilePath, options.modes);
		return ptests.main(options, mockURL)
		.then(function(result) {
			Object.keys(stats).forEach(function(k) {
				stats[k] += result.stats[k]; // Sum all stats
			});
			return [ runner, exitCode || result.exitCode ];
		});
	}, 0)
	.tap(function() {
		options.reportSummary([], stats, null, stats.loggedErrorCount, null);
	});
})
.spread(function(runner, exitCode) {
	return runner.stop()
	.then(function() {
		process.exit(exitCode);
	});
})
.done();
