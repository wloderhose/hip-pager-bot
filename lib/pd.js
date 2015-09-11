// Copyright 2013 Will Loderhose

var https = require('https');
var moment = require('moment');
var subdomain, api_key, service_key, service_ID, schedule_ID, policy_ID;

/**
* Set the PagerDuty options and create a pagerduty object
* @param {String|Object} key
* @param {String} value
* @returns {this} pd
*/
function set(key, value) {
	if(value == null) {
		subdomain = key.subdomain;
		api_key = key.api_key;
		service_key = key.service_key;
		service_ID = key.service_ID;
		if(key.schedule_ID == null) {
			getIDs(service_ID, function(err, schedule, policy) {
				schedule_ID = schedule;
				policy_ID = policy;
			});
		} else {
			schedule_ID = key.schedule_ID;
		}
		return this;
	}
	if(key == 'subdomain') {
		subdomain = value;
	} else if(key == 'api_key') {
		api_key = value;
	} else if(key == 'service_key') {
		service_key = value;
	} else if(key == 'service_ID') {
		service_ID = value;
	} else if(key == 'schedule_ID') {
		schedule_ID = value;
	} else if(key == 'policy_ID') {
		policy_ID = value;
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
		"service_key": service_key,
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

	var req = https.request(options, function(res) {
		res.setEncoding('utf-8');
		var data;
		res.on('data', function (chunk) {
			data = JSON.parse(chunk);
			var str = '';
			if(data.status == "success") {
				callback(null, true);
			} else {
				callback(null, false);
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
		host: subdomain + '.pagerduty.com',
		path: '/api/v1/incidents?' + paramString + '&service=' + service_ID,
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Token token=' + api_key
		}
	};

	var req = https.request(options, function(res) {
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
		host: subdomain + '.pagerduty.com',
		path: '/api/v1/schedules/' + schedule_ID + '/entries?since='+now+'&until='+now+'&overflow=true',
		method: 'GET',
		headers : {
			'Content-Type': 'application/json',
			'Authorization': 'Token token=' + api_key
		}
	};

	var req = https.request(options, function(res) {
		var jData = '';
		
		res.on('data', function (chunk) {
			jData += chunk;
		});

		res.on('end', function() {
			var data = JSON.parse(jData);
			if(data.entries == null || data.entries.length == 0) {
				callback(null, null);
			} else {
				var on_call = data.entries[0].user;
				callback(null, on_call);
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

/**
* PRIVATE
* Get the schedule_ID and policy_ID given the service_ID
* @param {String} service_ID
* @param {function} callback(error, schedule_ID, policy_ID)
* 		@param {String} error
*		@param {String} schedule_ID
*		@param {String} policy_ID
*/
function getIDs(service_ID, callback) {
	var options = {
		host: subdomain + '.pagerduty.com',
		path: '/api/v1/services/' + service_ID + '?include[]=escalation_policy',
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Token token=' + api_key
		}
	};

	var req = https.request(options, function(res) {
		res.setEncoding('utf-8');
		var jData = '';
		res.on('data', function (chunk) {
			jData += chunk;
		});
		res.on('end', function() {
			jData = JSON.parse(jData);
			if(jData != null && jData.service.escalation_policy != null) {
				var options2 = {
					host: subdomain + '.pagerduty.com',
					path: '/api/v1/escalation_policies/' + jData.service.escalation_policy.id,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Token token=' + api_key
					}
				};

				var req2 = https.request(options2, function(res2) {
					res2.setEncoding('utf-8');
					var jData2 = '';
					res2.on('data', function (chunk) {
						jData2 += chunk;
					});
					res2.on('end', function() {
						jData2 = JSON.parse(jData2);
						var rules = jData2.escalation_policy.escalation_rules;
						if(jData2 != null && rules != null && rules.length > 0 && rules[0] != null && rules[0].rule_object != null) {
							callback(null, rules[0].rule_object.id, jData.service.escalation_policy.id);
						} else {
							callback('No schedule exists for this service!');
						}
					});
				});
				req2.on('error', callback);
				req2.end();
			} else {
				callback('No schedule exists for this service!');
			}
		});
	});
	req.on('error', callback);
	req.end();
}
