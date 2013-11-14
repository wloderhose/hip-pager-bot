# pagerduty-bot

Create and customize a HipChat bot that interacts with PagerDuty.
Written in [node](http://nodejs.org).

## Installation

    $ npm install pagerduty-bot

## Getting Started

This README assumes you already have a [HipChat](https://www.hipchat.com/) and a [PagerDuty](http://www.pagerduty.com/) account.

There are two node modules included in the package: `pd` and `hipbot`.

* `pd` Includes all the methods used to interact with the PagerDuty developer API
* `hipbot` Creates a HipChat bot and includes methods that allow bot customization


First, create a PagerDuty object which contains all the methods used to interact with the PagerDuty API...
```js
var pd = require('pagerduty-bot').set({
	subdomain : '??????'
	api_key : '???????????',
	service_key : '???????????',
	service_ID : '??????'
});
```

 - `subdomain` Your subdomain in PagerDuty
 - `api_key` A valid API access key from PagerDuty
 - `service_key` API key for specific PagerDuty service
 - `service_ID` ID for a PagerDuty service. This is the service incidents will be created on by the bot. You can find by going to the service on PagerDuty and copying the 7 digit ID from the end of the URL

Make sure you have created a new user in HipChat for your bot. (This requires HipChat admin access)

Now, Connect to your HipChat bot:
```js
var hipbot = pd.hipbot({
	jid : '???????@chat.hipchat.com/bot',
	password : '???????????',
	rooms : ['??????@conf.hipchat.com'],
	mention : 'bot',
	name : 'PagerDuty Bot',
	description : 'I am here to help!',
	version : '???????'
});
```

 - `jid` The jid of your HipChat bot
 - `password` The password of your HipChat bot
 - `rooms` An array of every room jid you want the bot to join on connection
 - `mention` The mention name of your HipChat bot (comes after the `@`)
 - `name` [optional] The name of your HipChat bot
 - `description` [optional] A description of your HipChat bot
 - `version` [optional] A version number for your HipChat bot 

## Methods

Once you have `pd` and `hipbot` initialized there are several methods available.

### pd.set(key, value)

Set a value for a specific PagerDuty parameter.

 - `key` Any of the following: `'subdomain'`, `'api_key'`, `'service_key'`, `'service_ID'`, `'schedule_ID'`, `'policy_ID'`
 - `value` The value to be assigned to the parameter


### pd.who(callback)

Get the person who is currently on call for the current PagerDuty service.

 - `callback` Function in the form of `function(err, on_call)`
 	- `on_call` An object conatining information such as name and email

### pd.list(status, callback)

Get a list of incidents associated with the current PagerDuty service.
These incidents can be sorted by status.

 - `status` String that determines what kind of incidents should be included in the list
 	- `'t'` Include triggered
 	- `'a'` Include acknowledged
 	- `'r'` Include resolved
 	- `'all'` Include all
 	- Any combination will include multiple such as `'at'` which will return all acknowledged and triggered but not resolved
 - `callback` Function in the form of `function(err, list)`
 	- `list` An array of incident objects

### pd.trigger(description, details, callback)

Trigger a new incident in the current PagerDuty service.

 - `description` A description of the incident being triggered
 - `details` A JSON object that will be disaplayed in PagerDuty under incident details
 - `callback` Function in the form of `function(err, success)
 	- `success` A boolean returning true on a succesful trigger

### hipbot.get(key)

Get a property of the bot.

 - `key` The name of the property

### hipbot.onPing(callback)

Set function to fire when the bot pings (every 30 seconds)

 - `callback` A funciton that fires on ping

### hipbot.onInvite(accept, callback)

Emitted when the bot is invited to join a room in HipChat

 - `accept` True if you want the bot to join
 - `callback` Function in the form of `function(roomJid, fromJid, reason)`
 	- `roomJid` The jid of the HipChat room
 	- `fromJid` The jid of the user who invited the bot
 	- `reason` The reason given if any

### hipbot.joinRoom(roomJid)

Add another room to the list of rooms joined on connection.

 - `roomJid` The jid of the HipChat room

### hipbot.sendMessage(message, roomJid, fromName)

Send a public message from the bot to a user on HipChat.

 - `message` The message to be sent
 - `roomJid` The jid of the HipChat room
 - `fromName` The name of the HipChat user

## Creating Commands

The HipChat bot will respond to public messages in HipChat. The first word after the bot's mention is called a command.

The bot has a list of valid commands it will respond to which is completely customizable. You can also set what should happen on empty message and invalid commands.

### hipbot.onCommand(command, response)

Create and add a new command to the bot's list of valid commands.

 - `command` The first word typed after the bot's mention name. (case-insensitive)
 - `response` Any of the following...
 	- A message string that is simply sent back to the user
 	- Function in the form function(body, roomJid, fromName, callback)
 		- `body` Everything they wrote after the command
 		- `roomJid` The jid of the HipChat room
 		- `fromName` The name of the HipChat user who messaged the bot
 		- `callback` [optional] Function in the form callback(message)

Examples:

Respond with a simple message every time someone says hi to the bot...
```js
hipbot.onCommand('hello', 'Hi! I am a robot!');
```

Print to the console when someone messages the bot with a log command...
```js
hipbot.onCommand('log', function(body, roomJid, fromName) {
	console.log('Logged by ' + fromName + ' -> ' + body);
});
```

Solve math expressions...
```js
hipbot.onCommand('math', function(body, roomJid, fromName, callback) {
	var ans = eval(body);
	if(ans == null) {
		callback(fromName + ', that is an invalid Mathematic Expression');
	} else {
		callback(fromName + ', the answer is ' + ans);
	}
});
```

### hipbot.onBlank(callback)

Set a function to fire everytime the bot is message with a blank message.

 - `callback` Function in the form of `function(roomJid, fromName, callback)`
 	- `roomJid` The jid of the HipChat room
 	- `fromName` The name of the HipChat user that messaged the bot
 	- `callback` [optional] The actual function you want to fire in the form of callback(message)

Example:
```js
hipbot.onBlank(function(roomJid, fromName, callback) {
	callback('You just sent me a blank message!');
})
```

### hipbot.onInvalid(callback)

Set a function to fire everytime the bot is message with a blank message.

 - `callback` Function in the form of `function(invalidCommand, roomJid, fromName, callback)`
 	- `invalidCommand` The command the user tried to use
 	- `roomJid` The jid of the HipChat room
 	- `fromName` The name of the HipChat user that messaged the bot
 	- `callback` [optional] The actual function you want to fire in the form of callback(message)

Example:
```js
hipbot.onInvalid(function(invalidCommand, roomJid, fromName, callback) {
	callback(invalidCommand + ' is not a valid command');
})
```

## Webhooks

You can easily create webhooks that will ping HipChat rooms when incidents are triggered, acknowledged, or resolved in PagerDuty.

Read more about webhooks [here](http://www.pagerduty.com/docs/guides/hipchat-integration-guide/).

## Fork Me!

Forking this repository and making your own changes to fit your PagerDuty needs is highly recommended! 

Read more about working with the PagerDuty REST API [here](http://developer.pagerduty.com/documentation/rest).

## About

Author: Will Loderhose

Version: 0.1.0

## License

Apache License

Version 2.0, January 2004

http://www.apache.org/licenses/