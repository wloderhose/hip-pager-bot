var http = require('http');
var moment = require('moment');
var auth_token, api_key, service_key, schedule_key, policy_key;

/**
* Set the PagerDuty options and create a pagerduty object
* @param {String|Object} key
* @param {String} value
* @returns {this} pd
*/
function set(key, value) {
	if(value == null) {
		auth_token = key.auth_token;
		api_key = key.api_key;
		service_key = key.service_key;
		schedule_key = key.schedule_key;
		policy_key = key.policy_key;
		return this;
	}
	if(key == 'auth_token') {
		auth_token = value;
	} else if(key == 'api_key') {
		api_key = value;
	} else if(key == 'service_key') {
		service_key = value;
	} else if(key == 'schedule_key') {
		options.schedule_key = value;
	} else if(key == 'policy_key') {
		options.policy_key = value;
	}
}

/**
* Create a HipChat bot
* @param {Object} options
* @returns {Hipbot} hipbot
*/
function hipbot(options) {
	var hipbot = require('./hipbot');
	hipbot.create(options);
	return hipbot;
}

/**
 * Trigger a new incident in PagerDuty
 * @param {String} description
 * @param {Object} details
 * @param {function} callback(err, succes)
 *		@param {String} err
 *		@param {Boolean} success
 */
function trigger(description, details, callback) {
	var jEvent = {
		"service_key": api_key,
		"event_type": "trigger",
		"description": description
	};
	if(details != null) {
		jEvent.details = details;
	}
	var json = JSON.stringify(jEvent);
	var options = {
		host: 'events.pagerduty.com',
		path: '/generic/2010-04-15/create_event.json',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': json.length
		} 
	};

	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');
		var data;
		res.on('data', function (chunk) {
			data = JSON.parse(chunk);
			var str = '';
			if(data.status != "success") {
				callback(null, true);
			}
		});
	});
	req.on('error', callback);
	req.write(json);
	req.end();
}

/**
 * Get a list of all the incidents created by the bot
 * @param {String} status
 * @param {function} callback(err, list)
 *	    @param {String} err
 *		@param {Array} list
 */
function list(status, callback) {

	var now = moment().format('YYYY-MM-DDTHH:mm:ssZ');
	var paramString;
	if(status == 'all' || status == null) {
		paramString = '';
	} else {
		var params = [];
		if(status.indexOf('r') != -1) {
			params[params.length] = 'resolved';
		}
		if(status.indexOf('a') != -1) {
			params[params.length] = 'acknowledged';
		}
		if(status.indexOf('t') != -1) {
			params[params.length] = 'triggered';
		}
		paramString = 'status=' + params.join(',');
	}

	var options = {
		host: 'quickcue.pagerduty.com',
		path: '/api/v1/incidents?' + paramString + '&service=' + service_key,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Token token=' + auth_token
		}
	};

	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');
		var jData = '';
		res.on('data', function (chunk) {
			jData += chunk;
		});
		res.on('end', function() {
			var list = JSON.parse(jData).incidents;
			callback(null, list);
		});
	});
	req.on('error', callback);
	req.end();
}

/**
 * Get the current user on call
 * @param {function} callback(err, on_call)
 *     @param {String} err
 *	   @param {Object} on_call
 */
function who(callback) {

	var now = moment().format('YYYY-MM-DDTHH:mm:ssZ');

	var options = {
		host: 'quickcue.pagerduty.com',
		path: '/api/v1/schedules/' + schedule_key + '/entries?since='+now+'&until='+now+'&overflow=true',
		method: 'GET',
		headers : {
			'Content-Type': 'application/json',
			'Authorization': 'Token token=' + auth_token
		}
	};

	var req = http.request(options, function(res) {
		var jData = '';
		
		res.on('data', function (chunk) {
			jData += chunk;
		});

		res.on('end', function() {
			var data = JSON.parse(jData);
			if(data.entries == null || data.entries.length == 0) {
				callback(null, null);
			} else {
				var onDuty = data.entries[0].user;
				callback(null, onDuty);
			}
		});
	});
	req.on('error', callback);
	req.end();
}

exports.set = set;
exports.hipbot = hipbot;
exports.who = who;
exports.list = list;
exports.trigger = trigger;