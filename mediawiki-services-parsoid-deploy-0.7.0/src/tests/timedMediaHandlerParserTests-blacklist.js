/* A map of tests which we know Parsoid currently fails.
 *
 * New patches which fix previously-broken tests should also patch this
 * file to document which tests are now expected to succeed.
 *
 * This helps clean up 'npm test' output, documents known bugs, and helps
 * Jenkins make sense of the parserTest output.
 *
 * NOTE that the selser blacklist depends on tests/selser.changes.json
 * If the selser change list is modified, this blacklist should be refreshed.
 *
 * This blacklist can be automagically updated by running
 *    parserTests.js --rewrite-blacklist
 * You might want to do this after you fix some bug that makes more tests
 * pass.  It is still your responsibility to carefully review the blacklist
 * diff to ensure there are no unexpected new failures (lines added).
 */

/*
 * This should map test titles to an array of test types (wt2html, wt2wt,
 * html2html, html2wt, selser) which are known to fail.
 * For easier maintenance, we group each test type together, and use a
 * helper function to create the array if needed then append the test type.
 */
'use strict';

var testBlackList = {};
var add = function(testtype, title, raw) {
	if (typeof (testBlackList[title]) !== 'object') {
		testBlackList[title] = {
			modes: [],
			raw: raw,
		};
	}
	testBlackList[title].modes.push(testtype);
};

// ### DO NOT REMOVE THIS LINE ### (start of automatically-generated section)

// Blacklist for wt2html
add("wt2html", "Simple video element", "<p data-parsoid='{\"dsr\":[0,18,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[],\"dsr\":[0,18,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}]}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"}}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Simple thumbed video", "<figure class=\"mw-default-size\" typeof=\"mw:Error mw:Image/Thumb\" data-parsoid='{\"optList\":[{\"ck\":\"thumbnail\",\"ak\":\"thumb\"}],\"dsr\":[0,24,2,2]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}]}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"},\"dsr\":[2,22,null,null]}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></figure>");
add("wt2html", "Video in a <gallery>", "<ul class=\"gallery mw-gallery-traditional\" typeof=\"mw:Extension/gallery\" about=\"#mwt2\" data-parsoid='{\"dsr\":[0,33,2,2]}' data-mw='{\"name\":\"gallery\",\"attrs\":{},\"body\":{\"extsrc\":\"File:Video.ogv\"}}'>\n<li class=\"gallerybox\" style=\"width: 155px;\"><div class=\"thumb\" style=\"width: 150px; height: 150px;\"><span style=\"display: inline-block; height: 100%; vertical-align: middle;\"></span><span style=\"vertical-align: middle; display: inline-block;\">File:Video.ogv</span></div><div class=\"gallerytext\"></div></li>\n</ul>");
add("wt2html", "Video with thumbtime=1:25", "<p data-parsoid='{\"dsr\":[0,33,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[{\"ck\":\"caption\",\"ak\":\"thumbtime=1:25\"}],\"dsr\":[0,33,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}],\"caption\":\"thumbtime=1:25\"}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"}}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Video with starttime offset", "<p data-parsoid='{\"dsr\":[0,29,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[{\"ck\":\"caption\",\"ak\":\"start=1:25\"}],\"dsr\":[0,29,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}],\"caption\":\"start=1:25\"}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"}}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Video with starttime and endtime offsets", "<p data-parsoid='{\"dsr\":[0,38,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[{\"ck\":\"bogus\",\"ak\":\"start=1:25\"},{\"ck\":\"caption\",\"ak\":\"end=1:35\"}],\"dsr\":[0,38,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}],\"caption\":\"end=1:35\"}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"}}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Video with unsupported alt", "<p data-parsoid='{\"dsr\":[0,27,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[{\"ck\":\"alt\",\"ak\":\"alt=Test\"}],\"dsr\":[0,27,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}]}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"}}'><img alt=\"Test\" resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"alt\":\"Test\",\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"alt\":\"alt=Test\",\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Video with unsupported link", "<p data-parsoid='{\"dsr\":[0,31,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[{\"ck\":\"link\",\"ak\":\"link=Example\"}],\"dsr\":[0,31,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}]}'><a href=\"./Example\" data-parsoid='{\"a\":{\"href\":\"./Example\"},\"sa\":{\"href\":\"link=Example\"}}'><img resource=\"./File:Video.ogv\" src=\"./Special:FilePath/Video.ogv\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></span></p>");
add("wt2html", "Video with different thumb image", "<figure class=\"mw-default-size\" typeof=\"mw:Image/Thumb\" data-parsoid='{\"optList\":[{\"ck\":\"manualthumb\",\"ak\":\"thumb=Foobar.jpg\"}],\"dsr\":[0,35,2,2]}' data-mw='{\"thumb\":\"Foobar.jpg\"}'><a href=\"./File:Video.ogv\" data-parsoid='{\"a\":{\"href\":\"./File:Video.ogv\"},\"sa\":{\"href\":\"File:Video.ogv\"},\"dsr\":[2,33,null,null]}'><img resource=\"./File:Video.ogv\" src=\"//example.com/images/3/3a/Foobar.jpg\" data-file-width=\"1941\" data-file-height=\"220\" data-file-type=\"bitmap\" height=\"220\" width=\"1941\" data-parsoid='{\"a\":{\"resource\":\"./File:Video.ogv\",\"height\":\"220\",\"width\":\"1941\"},\"sa\":{\"resource\":\"File:Video.ogv\"}}'/></a></figure>");
add("wt2html", "Simple audio element", "<p data-parsoid='{\"dsr\":[0,18,0,0]}'><span class=\"mw-default-size\" typeof=\"mw:Error mw:Image\" data-parsoid='{\"optList\":[],\"dsr\":[0,18,null,null]}' data-mw='{\"errors\":[{\"key\":\"missing-image\",\"message\":\"This image does not exist.\"}]}'><a href=\"./File:Audio.oga\" data-parsoid='{\"a\":{\"href\":\"./File:Audio.oga\"},\"sa\":{\"href\":\"File:Audio.oga\"}}'><img resource=\"./File:Audio.oga\" src=\"./Special:FilePath/Audio.oga\" height=\"220\" width=\"220\" data-parsoid='{\"a\":{\"resource\":\"./File:Audio.oga\",\"height\":\"220\",\"width\":\"220\"},\"sa\":{\"resource\":\"File:Audio.oga\"}}'/></a></span></p>");


// Blacklist for wt2wt


// Blacklist for html2html
add("html2html", "Simple video element", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,589,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\">\n<span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[313,575,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>");
add("html2html", "Simple thumbed video", "<div class=\"thumb tright\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,1268,26,6]}'>\n<div class=\"thumbinner\" style=\"width:182px;\" data-parsoid='{\"stx\":\"html\",\"dsr\":[27,1177,45,6]}'>\n<div class=\"PopUpMediaTransform\" style=\"width:180px;\" data-parsoid='{\"stx\":\"html\",\"a\":{\"videopayload\":null},\"sa\":{\"videopayload\":\"&lt;div class=&amp;quot;mediaContainer&amp;quot; style=&amp;quot;width:320px&amp;quot;\"},\"dsr\":[73,976,136,6]}'>&lt;video id=&amp;quot;mwe_player_2&amp;quot; poster=&amp;quot;http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg&amp;quot; controls=&amp;quot;&amp;quot; preload=&amp;quot;none&amp;quot; autoplay=&amp;quot;&amp;quot; style=&amp;quot;width:320px;height:240px&amp;quot; class=&amp;quot;kskin&amp;quot; data-durationhint=&amp;quot;4.3666666666667&amp;quot; data-startoffset=&amp;quot;0&amp;quot; data-mwtitle=&amp;quot;Video.ogv&amp;quot; data-mwprovider=&amp;quot;local&amp;quot;><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt2\" data-parsoid='{\"dsr\":[613,962,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"240\":\"\",\"320\":\"\",\"src\":\"&amp;quot;http://example.com/images/0/00/Video.ogv&amp;quot;\",\"type\":\"&amp;quot;video/ogg;\",\"codecs\":\"&amp;amp;quot;theora&amp;amp;quot;&amp;quot;\",\"data-title\":\"&amp;quot;Original\",\"ogg\":\"\",\"file,\":\"\",\"×\":\"\",\"(590\":\"\",\"kbps)\\\"\":\"\",\"data-shorttitle\":\"&amp;quot;Ogg\",\"source\\\"\":\"\",\"data-width\":\"&amp;quot;320&amp;quot;\",\"data-height\":\"&amp;quot;240&amp;quot;\",\"data-bandwidth\":\"&amp;quot;590013&amp;quot;\",\"data-framerate\":\"&amp;quot;30&amp;quot;\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=&amp;quot;http://example.com/images/0/00/Video.ogv&amp;quot; type=&amp;quot;video/ogg; codecs=&amp;amp;quot;theora&amp;amp;quot;&amp;quot; data-title=&amp;quot;Original Ogg file, 320 × 240 (590 kbps)&amp;quot; data-shorttitle=&amp;quot;Ogg source&amp;quot; data-width=&amp;quot;320&amp;quot; data-height=&amp;quot;240&amp;quot; data-bandwidth=&amp;quot;590013&amp;quot; data-framerate=&amp;quot;30&amp;quot;/></span>&lt;/video></div><p data-parsoid='{\"dsr\":[976,1171,0,0]}'>\"><img src=\"http://example.com/images/thumb/0/00/Video.ogv/180px--Video.ogv.jpg\" alt=\"180px--Video.ogv.jpg\" rel=\"mw:externalImage\" data-parsoid='{\"dsr\":[978,1045,null,null]}'/><a rel=\"mw:ExtLink\" href=\"http://example.com/images/0/00/Video.ogv\" data-parsoid='{\"targetOff\":1087,\"contentOffsets\":[1087,1170],\"dsr\":[1045,1171,42,1]}'><span class=\"play-btn-large\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1087,1170,29,7]}'><span class=\"mw-tmh-playtext\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1116,1163,30,7]}'>Play media</span></span></a></p></div>\n<div class=\"thumbcaption\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1178,1261,26,6]}'>\n<div class=\"magnify\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1205,1254,21,6]}'>[/wiki/File:Video.ogv]</div>\n</div>\n</div>\n");
add("html2html", "Video in a <gallery>", "<p data-parsoid='{\"dsr\":[0,4,0,0]}'>\t\t* </p><div style=\"width: 155px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[4,1222,26,6]}'> \t\t\t<div class=\"thumb\" style=\"width: 150px;\" data-parsoid='{\"stx\":\"html\",\"dsr\":[34,1216,41,6]}'><div style=\"margin:30px auto;\" data-parsoid='{\"stx\":\"html\",\"dsr\":[75,1210,31,6]}'><div class=\"PopUpMediaTransform\" style=\"width:120px;\" data-parsoid='{\"stx\":\"html\",\"a\":{\"videopayload\":null},\"sa\":{\"videopayload\":\"&lt;div class=&amp;quot;mediaContainer&amp;quot; style=&amp;quot;width:320px&amp;quot;\"},\"dsr\":[106,1009,136,6]}'>&lt;video id=&amp;quot;mwe_player_2&amp;quot; poster=&amp;quot;http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg&amp;quot; controls=&amp;quot;&amp;quot; preload=&amp;quot;none&amp;quot; autoplay=&amp;quot;&amp;quot; style=&amp;quot;width:320px;height:240px&amp;quot; class=&amp;quot;kskin&amp;quot; data-durationhint=&amp;quot;4.3666666666667&amp;quot; data-startoffset=&amp;quot;0&amp;quot; data-mwtitle=&amp;quot;Video.ogv&amp;quot; data-mwprovider=&amp;quot;local&amp;quot;><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[646,995,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"240\":\"\",\"320\":\"\",\"src\":\"&amp;quot;http://example.com/images/0/00/Video.ogv&amp;quot;\",\"type\":\"&amp;quot;video/ogg;\",\"codecs\":\"&amp;amp;quot;theora&amp;amp;quot;&amp;quot;\",\"data-title\":\"&amp;quot;Original\",\"ogg\":\"\",\"file,\":\"\",\"×\":\"\",\"(590\":\"\",\"kbps)\\\"\":\"\",\"data-shorttitle\":\"&amp;quot;Ogg\",\"source\\\"\":\"\",\"data-width\":\"&amp;quot;320&amp;quot;\",\"data-height\":\"&amp;quot;240&amp;quot;\",\"data-bandwidth\":\"&amp;quot;590013&amp;quot;\",\"data-framerate\":\"&amp;quot;30&amp;quot;\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=&amp;quot;http://example.com/images/0/00/Video.ogv&amp;quot; type=&amp;quot;video/ogg; codecs=&amp;amp;quot;theora&amp;amp;quot;&amp;quot; data-title=&amp;quot;Original Ogg file, 320 × 240 (590 kbps)&amp;quot; data-shorttitle=&amp;quot;Ogg source&amp;quot; data-width=&amp;quot;320&amp;quot; data-height=&amp;quot;240&amp;quot; data-bandwidth=&amp;quot;590013&amp;quot; data-framerate=&amp;quot;30&amp;quot;/></span>&lt;/video></div>\"><img src=\"http://example.com/images/thumb/0/00/Video.ogv/120px--Video.ogv.jpg\" alt=\"120px--Video.ogv.jpg\" rel=\"mw:externalImage\" data-parsoid='{\"dsr\":[1011,1078,null,null]}'/><a rel=\"mw:ExtLink\" href=\"http://example.com/images/0/00/Video.ogv\" data-parsoid='{\"targetOff\":1120,\"contentOffsets\":[1120,1203],\"dsr\":[1078,1204,42,1]}'><span class=\"play-btn-large\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1120,1203,29,7]}'><span class=\"mw-tmh-playtext\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1149,1196,30,7]}'>Play media</span></span></a></div></div></div> \t\t\t<div class=\"gallerytext\" data-parsoid='{\"stx\":\"html\",\"dsr\":[1226,1260,25,6]}'>\t\t\t</div> \t\t\n");
add("html2html", "Video with thumbtime=1:25", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,610,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[334,596,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>\n");
add("html2html", "Video with starttime offset", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,625,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[334,611,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>\n");
add("html2html", "Video with starttime and endtime offsets", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,638,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[334,624,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366,00:00:03.366\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366,00:00:03.366\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>\n");
add("html2html", "Video with unsupported alt", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,588,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[312,574,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>\n");
add("html2html", "Video with unsupported link", "<div class=\"mediaContainer\" style=\"width:320px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,588,48,6]}'>&lt;video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[312,574,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/0/00/Video.ogv\",\"type\":\"video/ogg; codecs=&amp;quot;theora&amp;quot;\",\"data-title\":\"Original Ogg file, 320 × 240 (590 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"320\",\"data-height\":\"240\",\"data-bandwidth\":\"590013\",\"data-framerate\":\"30\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&amp;quot;theora&amp;quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></span>&lt;/video></div>\n");
add("html2html", "Video with different thumb image", "<div class=\"thumb tright\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,208,26,6]}'><div class=\"thumbinner\" style=\"width:1943px;\" data-parsoid='{\"stx\":\"html\",\"dsr\":[26,202,46,6]}'><img src=\"http://example.com/images/3/3a/Foobar.jpg\" alt=\"Foobar.jpg\" rel=\"mw:externalImage\" data-parsoid='{\"dsr\":[72,113,null,null]}'/>  <div class=\"thumbcaption\" data-parsoid='{\"stx\":\"html\",\"dsr\":[115,196,26,6]}'><div class=\"magnify\" data-parsoid='{\"stx\":\"html\",\"dsr\":[141,190,21,6]}'>[/wiki/File:Video.ogv]</div></div></div></div>\n");
add("html2html", "Simple audio element", "<div class=\"mediaContainer\" style=\"width:180px\" data-parsoid='{\"stx\":\"html\",\"dsr\":[0,454,48,6]}'>&lt;audio controls=\"\" preload=\"none\" style=\"width:180px\" class=\"kskin\" data-durationhint=\"0.99875\" data-startoffset=\"0\" data-mwtitle=\"Audio.oga\" data-mwprovider=\"local\">\n<span typeof=\"mw:Error mw:Extension/source\" about=\"#mwt1\" data-parsoid='{\"dsr\":[215,440,null,null]}' data-mw='{\"name\":\"source\",\"attrs\":{\"src\":\"http://example.com/images/4/41/Audio.oga\",\"type\":\"audio/ogg; codecs=&amp;quot;vorbis&amp;quot;\",\"data-title\":\"Original Ogg file (41 kbps)\",\"data-shorttitle\":\"Ogg source\",\"data-width\":\"0\",\"data-height\":\"0\",\"data-bandwidth\":\"41107\"},\"body\":null,\"errors\":[{\"key\":\"mw-api-extexpand-error\",\"message\":\"Could not expand extension source.\"}]}'>&lt;source src=\"http://example.com/images/4/41/Audio.oga\" type=\"audio/ogg; codecs=&amp;quot;vorbis&amp;quot;\" data-title=\"Original Ogg file (41 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"0\" data-height=\"0\" data-bandwidth=\"41107\" /></span>&lt;/audio></div>");


// Blacklist for html2wt
add("html2wt", "Simple video element", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\">\n<source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>");
add("html2wt", "Simple thumbed video", "<div class=\"thumb tright\">\n<div class=\"thumbinner\" style=\"width:182px;\">\n<div class=\"PopUpMediaTransform\" style=\"width:180px;\" videopayload=\"<div class=&quot;mediaContainer&quot; style=&quot;width:320px&quot;><video id=&quot;mwe_player_2&quot; poster=&quot;http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg&quot; controls=&quot;&quot; preload=&quot;none&quot; autoplay=&quot;&quot; style=&quot;width:320px;height:240px&quot; class=&quot;kskin&quot; data-durationhint=&quot;4.3666666666667&quot; data-startoffset=&quot;0&quot; data-mwtitle=&quot;Video.ogv&quot; data-mwprovider=&quot;local&quot;><source src=&quot;http://example.com/images/0/00/Video.ogv&quot; type=&quot;video/ogg; codecs=&amp;quot;theora&amp;quot;&quot; data-title=&quot;Original Ogg file, 320 × 240 (590 kbps)&quot; data-shorttitle=&quot;Ogg source&quot; data-width=&quot;320&quot; data-height=&quot;240&quot; data-bandwidth=&quot;590013&quot; data-framerate=&quot;30&quot;/></video></div>\">http://example.com/images/thumb/0/00/Video.ogv/180px--Video.ogv.jpg[http://example.com/images/0/00/Video.ogv <span class=\"play-btn-large\"><span class=\"mw-tmh-playtext\">Play media</span></span>]</div>\n<div class=\"thumbcaption\">\n<div class=\"magnify\">[/wiki/File:Video.ogv]</div>\n</div>\n</div>\n</div>");
add("html2wt", "Video in a <gallery>", "\t\t* <div style=\"width: 155px\"> \t\t\t<div class=\"thumb\" style=\"width: 150px;\"><div style=\"margin:30px auto;\"><div class=\"PopUpMediaTransform\" style=\"width:120px;\" videopayload=\"<div class=&quot;mediaContainer&quot; style=&quot;width:320px&quot;><video id=&quot;mwe_player_2&quot; poster=&quot;http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg&quot; controls=&quot;&quot; preload=&quot;none&quot; autoplay=&quot;&quot; style=&quot;width:320px;height:240px&quot; class=&quot;kskin&quot; data-durationhint=&quot;4.3666666666667&quot; data-startoffset=&quot;0&quot; data-mwtitle=&quot;Video.ogv&quot; data-mwprovider=&quot;local&quot;><source src=&quot;http://example.com/images/0/00/Video.ogv&quot; type=&quot;video/ogg; codecs=&amp;quot;theora&amp;quot;&quot; data-title=&quot;Original Ogg file, 320 × 240 (590 kbps)&quot; data-shorttitle=&quot;Ogg source&quot; data-width=&quot;320&quot; data-height=&quot;240&quot; data-bandwidth=&quot;590013&quot; data-framerate=&quot;30&quot;/></video></div>\">http://example.com/images/thumb/0/00/Video.ogv/120px--Video.ogv.jpg[http://example.com/images/0/00/Video.ogv <span class=\"play-btn-large\"><span class=\"mw-tmh-playtext\">Play media</span></span>]</div></div></div> \t\t\t<div class=\"gallerytext\">\t\t\t</div> \t\t</div>\n");
add("html2wt", "Video with thumbtime=1:25", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>\n");
add("html2wt", "Video with starttime offset", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><source src=\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>\n");
add("html2wt", "Video with starttime and endtime offsets", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px-seek%3D3.3666666666667-Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><source src=\"http://example.com/images/0/00/Video.ogv#t=00:00:03.366,00:00:03.366\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>\n");
add("html2wt", "Video with unsupported alt", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>\n");
add("html2wt", "Video with unsupported link", "<div class=\"mediaContainer\" style=\"width:320px\"><video poster=\"http://example.com/images/thumb/0/00/Video.ogv/320px--Video.ogv.jpg\" controls=\"\" preload=\"none\" style=\"width:320px;height:240px\" class=\"kskin\" data-durationhint=\"4.3666666666667\" data-startoffset=\"0\" data-mwtitle=\"Video.ogv\" data-mwprovider=\"local\"><source src=\"http://example.com/images/0/00/Video.ogv\" type=\"video/ogg; codecs=&quot;theora&quot;\" data-title=\"Original Ogg file, 320 × 240 (590 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"320\" data-height=\"240\" data-bandwidth=\"590013\" data-framerate=\"30\" /></video></div>\n");
add("html2wt", "Video with different thumb image", "<div class=\"thumb tright\"><div class=\"thumbinner\" style=\"width:1943px;\">http://example.com/images/3/3a/Foobar.jpg  <div class=\"thumbcaption\"><div class=\"magnify\">[/wiki/File:Video.ogv]</div></div></div></div>\n");
add("html2wt", "Simple audio element", "<div class=\"mediaContainer\" style=\"width:180px\"><audio controls=\"\" preload=\"none\" style=\"width:180px\" class=\"kskin\" data-durationhint=\"0.99875\" data-startoffset=\"0\" data-mwtitle=\"Audio.oga\" data-mwprovider=\"local\">\n<source src=\"http://example.com/images/4/41/Audio.oga\" type=\"audio/ogg; codecs=&quot;vorbis&quot;\" data-title=\"Original Ogg file (41 kbps)\" data-shorttitle=\"Ogg source\" data-width=\"0\" data-height=\"0\" data-bandwidth=\"41107\" /></audio></div>");


// Blacklist for selser

// ### DO NOT REMOVE THIS LINE ### (end of automatically-generated section)


if (typeof module === 'object') {
	module.exports.testBlackList = testBlackList;
}
