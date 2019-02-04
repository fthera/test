"use strict";
exports.setup = function(parsoidConfig) {
	// Sample these verbose logs to prevent overwhelm
	// 1% and 2% for empty/tr and empty/li is based on
	// seeing the volume in rt-testing.
	parsoidConfig.loggerSampling = [
		['warn/dsr/inconsistent', 5],
		['warn/empty/li', 1],
		['warn/empty/tr', 0],
		[/^warn\/empty\//, 5],
	];
};
