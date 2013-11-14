// Copyright 2013 Will Loderhose

var moment = require('moment');

/**
* Create a Hipchat bot
* @params {Object} options
*/
function create(options) {
	var bot = new (require('wobot')).Bot(options);
	var options = options;
	var signal = new RegExp('^@' + options.mention);
	var blank_method;
	var invalid_method;
	var commands = [];
	bot.connect();

	/**
	* Determine action when bot is invited to a room
	* @param {Boolean} accept
	* @param {function} callback(roomJid, fromJid, reason)
	*		@param {String} roomJid
	*		@param {String} fromJid
	*		@param {String} reason
	*/
	function onInvite(accept, callback) {
		bot.onInvite(function(roomJid, fromJid, reason) {
			if(accept) {
				joinRoom(roomJid);
				callback(roomJid, fromJid, reason);
			} else {
				callback(roomJid, fromJid, reason);
			}
		});
	}

	/**
	* Determine action on ping (bot pings every 30 seconds)
	* @param {function} f
	*/
	function onPing(f) {
		bot.onPing(function() {
			f();
		});
	}

	/**
	* Determine action when no command is given
	* @param {function} f
	*/
	function onBlank(f) {
		blank_method = f;
	}

	/**
	* Determine action when invalid command is given
	* @param {function} f
	*/
	function onInvalid(f) {
		invalid_method = f;
	}

	/**
	* Add room to list of joinable rooms in HipChat
	* @param {String} roomJid
	*/
	function joinRoom(roomJid) {
		for(var i = 0; i < rooms.length; i++) {
			if(options.rooms[i] == roomJid) {
				return;
			}
		}
		options.rooms[options.rooms.length - 1] = roomJid;
		bot.connect();
	}

	/**
	* Get properties of the bot
	* @param {String} key
	*/
	function get(key) {
		if(key == 'commands') {
			return getCommands();
		}
		if(key == 'all') {
			return options;
		}
		return options[key];
	}

	/**
	* Add new command to list of valid commands and define an action associated with it
	* @param {String} string
	* @param {function} f
	*/
	function onCommand(string, f) {
		for(var i = 0; i < commands.length; i++) {
			if(commands[i].string == string) {
				console.log(string + ' already exists');
				return;
			}
		}
		if(typeof(f) == 'function') {
			commands[commands.length] = {string : string, f : f};
		} else {
			commands[commands.length] = {string : string, message : f};
		}
	}

	/**
	* Send a message from the bot to a specific user and room
	* @param {String} message
	* @param {String} roomJid
	* @param {String} fromName
	*/
	function sendMessage(message, roomJid, fromName) {
		bot.getRoster(function(err, roster, stanza) {
			if(err) {
				console.log('ERROR -> Error getting HipChat roster. Messages unable to be sent');
			}
			for(var i = 0; i < roster.length; i++) {
				if(roster[i].name == fromName) {
					var mention = '@' + roster[i].mention_name + ' ';
					bot.message(roomJid, mention + message);
				}
			}

		});
	}

	/* Private Functions
	---------------------------------------------------------------------- */

	// Get list of valid command strings
	function getCommands() {
		var list = [];
		for(var i = 0; i < commands.length; i++) {
			list[list.length] = commands[i].string;
		}
		return list;
	}

	// Print message to console on error
	bot.onError(function(error, text, stanza) {
		console.error('ERROR -> Could not establish connection to HipChat');
		return;
	})

	// Join all joinable rooms on establishing connection
	bot.onConnect(function() {
		console.log(' -=- > Connected on ' + moment().format('MM-DD-YYYY HH:mm:ss'));
		for(var i = 0; i < options.rooms.length; i++) {
			bot.join(options.rooms[i]);
		}
	});

	// Print message to console on losing connection
	bot.onDisconnect(function() {
		console.log(' -=- > Disconnected on ' + moment().format('MM-DD-YYYY HH:mm:ss'));
	})

	// When bot is messaged, parse commands, and execute if valid command is given
	bot.onMessage(signal, function(roomJid, fromName, body) {

		// Text is everything including the mention
		var text = body.trim().split(' ');
		if(text.length == 1) {
			// Bot has been mentioned but no text following
			blank_method(roomJid, fromName, function(message) {
				sendMessage(message, roomJid, fromName);
			});
			return;
		}

		// Command is between the first space and the second space
		var after = body.substring(text[0].length + 1);
		var checkCommand = after.trim().split(' ')[0];

		for(var i = 0; i < commands.length; i++) {
			if(checkCommand.toLowerCase() == commands[i].string.toLowerCase()) {
				// Message is everything after the command.
				// It may or may not be used depending on the command.
				var body = '';
				var array = after.trim().split(' ');
				for(var j = 1; j < array.length; j++) {
					body += array[j];
					if(j != array.length - 1) {
						body += ' ';
					}
				}
				var cur = commands[commands.indexOf(commands[i])];
				if(cur.f != null) {
					cur.f(body, roomJid, fromName, function(message) {
						sendMessage(message, roomJid, fromName);
					});
				} else {
					sendMessage(cur.message, roomJid, fromName);
				}
				return;
			}
		}
		invalid_method(checkCommand, roomJid, fromName, function(message) {
			sendMessage(message, roomJid, fromName);
		});
	});

	exports.get = get;
	exports.onPing = onPing;
	exports.onInvite = onInvite;
	exports.onCommand = onCommand;
	exports.onBlank = onBlank;
	exports.onInvalid = onInvalid;
	exports.joinRoom = joinRoom;
	exports.sendMessage = sendMessage;
}

exports.create = create;



