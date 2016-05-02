// Example using hip-pager-bot to create a HipChat bot

var moment = require('moment');

/* Edit these variables to match your HipChat and PagerDuty credentials
----------------------------------------------------------------------*/
var pd = require('hip-pager-bot').set({
	subdomain : '?????????',
	api_key : '?????????????????????',
	service_key : '???????????????????????????',
	service_ID : '???????',
	schedule_ID : '???????',
	policy_ID : '???????'
});
var hipbot = pd.hipbot({
	jid : '???????@chat.hipchat.com/bot',
	password : '???????????',
	mention : '??????',
	name : '????????',
	rooms : ['??????@conf.hipchat.com'],
	description : '????????????',
	version : '???????',
	debug : true
});
//----------------------------------------------------------------------

// Frequent bot responses
var responses = {
	blank : '',
	info : '',
	help : '',
	error : ''
};

// Blank response
var str = '';
str += 'Hello. I am Hip-Pager Bot.';
str += '\nType "help" for a list of approved commands.';
str += '\nType "info" for more information about me.';
responses.blank = str;

// Help response
var str = '';
str += '\nTo use me, type @' + bot.get('mention') + ', followed by a command, a space, and then an optional message.';
str += '\nCommands are not case sensitive.';
str += '\nHere is a list of commands you can use:';
str += '\n\n@' + bot.get('mention') + ' new [description] -> Create a new request and send it to the user on call with a description.';
str += '\n\n@' + bot.get('mention') + ' msg [message] -> Send a message directly to the user on call.';
str += '\n\n@' + bot.get('mention') + ' who -> Identifies who the on call user is currently.';
str += '\n\n@' + bot.get('mention') + ' list -> Displays a list of all the service requests that are currently unresolved and whether or not they have been acknowledged.';
responses.help = str;

// Info response
var str = '';
str += '\nNAME: ' + bot.get('name');
str += '\nDESCRIPTION: ' + bot.get('description');
str += '\nVERSION: ' + bot.get('version');
responses.info = str;

// Error response
var str = '';
str += '\nI\'m sorry, an error has occured with ' + bot.get('name');
responses.error = str;

bot.onPing('hello-world', function() {
	console.log('Hello World!');
});

// Respond with who is currently on call
bot.onCommand('who', function(body, roomJid, fromName, callback) {
	pd.who(function(err, onCall) {
		if(err) {
			callback(responses.error);
		} else if(onCall == null) {
			callback('No one is on call.');
		} else {
			callback(onCall.name + ' is on call.');
		}
	});
});

// Display a list of all triggered and acknowledged incidents
bot.onCommand('list', function(body, roomJid, fromName, callback) {
	pd.list('at', function(err, list) {
		if(err) {
			callback(responses.error);
		} else {
			if(list.length == 0) {
				callback('NO ISSUES!')
			} else {
				var str = '';
				for(var i = 0; i < list.length; i++) {
					var incident = parse_incident(list[i]);
					str += '\n\nINCIDENT NUMBER: ';
					str += incident.incident_number
					str += '\nCREATED ON: ';
					str += incident.created_on;

					str += '\nDETAILS: ';
					str += incident.description;

					str += '\nASSIGNED TO: ';
					str += incident.assigned_to;

					str += '\nSTATUS: ';
					str += incident.status;
					console.log(str);
				}
				callback(str);
			}
		}
	});
});

// Send a message to the user on call through HipChat
bot.onCommand('msg', function(body, roomJid, fromName, callback) {
	pd.who(function(err, onCall) {
		if(err) {
			callback(responses.error);
		} else if(onCall == null) {
			callback('No one is on call.');
		} else {
			var str = '> message from ' + fromName + ':\n' + body;
			bot.sendMessage(str, roomJid, onCall.name);
		}
	});
});

// Trigger a new incident
bot.onCommand('new', function(body, room, from, callback) {
	pd.trigger(body, {escalated_by : from, escalated_on : 'Hipchat'}, function(err, success) {
		if(err || !success) {
			callback(responses.error);
		} else {
			callback("It worked!\nYou're incident has been triggered and the on call engineer will be notified.");
		}
	});
});

// Reply to help and info commands
bot.onCommand('help', responses.help);
bot.onCommand('info', responses.info);

// Respond helpfully to a blank message
bot.onBlank(function(roomJid, fromName, callback) {
	callback(responses.blank);
});

// Respond helpfully to an invalid command
bot.onInvalid(function(command, roomJid, fromName, callback) {
	callback('I\'m sorry, "' + command + '" is not a valid command.\nType help for a list of valid commands.');
});

// Take a JSON incident object from pagerduty and extract desired info
function parse_incident(incident) {
	var statusTime = moment(incident.last_status_change_on).format('dddd, MMMM Do YYYY, h:mm:ss a');

	var description;
	if(incident.trigger_summary_data.description == null) {
		description = 'NONE';
	} else {
		description = incident.trigger_summary_data.description;
	}

	var engineer;
	if(incident.assigned_to_user == null) {
		engineer = 'NONE ASSIGNED';
	} else {
		engineer = incident.assigned_to_user.name;
	}

	var status;
	if(incident.status == 'triggered') {
		status = 'Unacknowledged';
	} else if(incident.status == 'acknowledged') {
		status = 'Acknowledged';
	} else if(incident.status == 'resolved') {
		status = 'Resolved';
	}

	var display = {
		incident_number : incident.incident_number,
		created_on : moment(incident.created_on).format('dddd, MMMM Do YYYY, h:mm:ss a'),
		description : description,
		assigned_to : engineer,
		status : status
	};

	return display;
}