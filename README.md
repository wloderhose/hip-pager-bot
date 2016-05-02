# hip-pager-bot

Create and customize a responsive [HipChat](https://www.hipchat.com/) bot that communicates with your [PagerDuty](http://www.pagerduty.com/) account.

Written in [node.js](http://nodejs.org).

## Installation

    $ npm install hip-pager-bot

*Currently, this module is dependent on [node-xmpp](https://www.npmjs.com/package/node-xmpp) which is now deprecated, as well as a few other deprecated modules. The goal is to bring everything up-to-date in the near future. If you have any problems with the installation, feel free to let me know.*

## Overview

Hip-Pager-Bot allows you to create and customize a bot that lives in one or more of your HipChat rooms. Your bot is capable of both sending and retrieving information to and from PagerDuty. For example, your bot can tell you who is currently on call, relay details about the latest incident, or trigger a new incident, all without even opening PagerDuty in the browser. Your bot is also capable of doing completely non-PagerDuty things, like telling you about the weather.

As you setup your first bot, be sure to refer to the [example](examples/bot.js) to see it in action.

## Getting Started

To initialize your bot:
```js
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
```

#### PagerDuty
First, lets take a look at PagerDuty. These are all the things you are going to need from your PagerDuty account.

 - `subdomain` Your subdomain in PagerDuty. (Example: *subdomain*.pagerduty.com)
 - `api_key` A valid API access key from PagerDuty. You can [create a new API key here](https://wloderhose.pagerduty.com/api_keys).
 - `service_key` Choose which service you would like your bot to communicate with. Then, go to that service on your PagerDuty account,  go to Settings, and copy the `Integration Key`.
 - `service_ID` While viewing that same service, you can find this 7-digit ID at the end of the URL.
 - `schedule_ID (Optional)` While viewing a schedule, you can find this 7-digit ID at the end of the URL. If you do not provide a schedule_ID, `hip-pager-bot` will try to determine it based on the service_ID you provided, but this may not work if you have not properly linked them.
 - `policy_ID (Optional)` While viewing an escalation policy, you can find this 7-digit ID at the end of the URL. If you do not provide a policy_ID, `hip-pager-bot` will try to determine it based on the service_ID you provided, but this may not work if you have not properly linked them.

#### HipChat
Now that you've got PagerDuty all set, lets focus on the HipChat bot. You must first create a new user in HipChat. Your bot will then use that user's credentials.

There are a few ways to do this, and unfortunately, all of them require a valid email address. For more info, check out: [Creating a HipChat user.](https://confluence.atlassian.com/hc/adding-and-removing-people-693896500.html)

##### Option 1: Use Typical User Invitation Flow
The simplest way to create a new user is to create a new email address, then invite yourself via HipChat. Go to your email, and accept the invitation. Then, while logged in to that new HipChat account, go [here](https://hipchat.com/account/xmpp) to find the user's Jabber ID.

##### Option 2: Using the HipChat API
Alternatively, you can send 2 simple HTTP requests to the HipChat API to create a new user, and find that user's Jabber ID (but you still need a valid email address!)

First, [create two API tokens here](https://wloderhose.hipchat.com/account/api). Call the first one `Create User`, select the `Administer Group` scope, and save. Call the second one `View User`, select the `View Group` scope, and save.

To create the HTTP request, copy and paste the following two commands into a UNIX shell (such as OS X Terminal or Cygwin). Insert the `name`, `mention`, `password`, and `email` of your new HipChat user, which will become your bot. Insert the HipChat API tokens that you just created in their respective places.

`curl -H "Content-Type: application/json" -X POST -d {"name": "[name]", "mention_name" : "[mention_name]", "password" : "[password]", "email" : "[email]"} https://api.hipchat.com/v2/user/?auth_token=[create_user_token]`

`curl -X GET https://api.hipchat.com/v2/user/[email]?auth_token=[view_group_token]`

In the response body, find `xmpp_jid`, and save it. You are about to use it to connect your bot.

Now, we can finally go back to our code and fill in all those question marks! 

***IMPORTANT***: Each of the following fields must exactly match your new user's credentials, or the bot will not work (except for the optional ones).

 - `jid` The Jabber ID of your new HipChat user. This is what we just looked for after creating the new user.
 - `password` The password of your new HipChat user.
 - `mention` The mention name of your new HipChat user (comes after the `@`).
 - `name` The name of your new HipChat user.
 - `rooms` An array of every room's Jabber ID that you want the bot to automatically join opon connection. [You can find a room's Jabber ID here](https://hipchat.com/rooms).
 - `description (optional)` A description of your HipChat bot.
 - `version (optional)` A version number for your HipChat bot.
 - `debug (optional)` If set to true, all XMPP traffic will be logged to the console. By default, it is set to false.

## Functions

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

### hipbot.onInvite(accept, callback)

Emitted when the bot is invited to join a room in HipChat.

 - `accept` True if you want the bot to join
 - `callback` Function in the form of `function(roomJid, fromJid, reason)`
 	- `roomJid` The jid of the HipChat room
 	- `fromJid` The jid of the user who invited the bot
 	- `reason` The reason given if any

### hipbot.joinRoom(roomJid)

Add another room to the list of rooms joined on connection.

 - `roomJid` The jid of the HipChat room

### hipbot.sendMessage(message, roomJid, toName)

Send a public message from the bot to a user on HipChat.

 - `message` The message to be sent
 - `roomJid` The jid of the HipChat room
 - `fromName (optional)` The name of the HipChat user. If blank, message is sent to the room without any @ mentions.

## Creating Commands

The HipChat bot will respond to public messages in HipChat. The first word after the bot's mention is called a command.

The bot has a list of valid commands it will respond to which is completely customizable. You can also set what should happen with empty messages and invalid commands.

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

*Examples:*

Respond with a simple message every time someone says "hello" to the bot...
```js
hipbot.onCommand('hello', 'Hi! I am a robot!');
```

Print to the console when someone messages the bot with a log command...
```js
hipbot.onCommand('log', function(body, roomJid, fromName) {
	console.log('Logged by ' + fromName + ' -> ' + body);
});
```

Solve math expressions and send a message back to the user...
```js
hipbot.onCommand('math', function(body, roomJid, fromName, callback) {
    var ans;
    try {
    	ans = require('mathjs')().eval(body);
    } catch(e) {}
    if(ans == null) {
        callback(fromName + ', that is an invalid Mathematic Expression');
    } else {
        callback(ans);
    }
});
```

### hipbot.onBlank(callback)

Set a function to fire every time the bot is mentioned with a blank message.

 - `callback` Function in the form of `function(roomJid, fromName, callback)`
 	- `roomJid` The jid of the HipChat room
 	- `fromName` The name of the HipChat user that messaged the bot
 	- `callback` [optional] The actual function you want to fire in the form of callback(message)

Example:
```js
hipbot.onBlank(function(roomJid, fromName, callback) {
	callback('You just sent me a blank message!');
});
```

### hipbot.onInvalid(callback)

Set a function to fire every time the bot is given an invalid command.

 - `callback` Function in the form of `function(invalidCommand, roomJid, fromName, callback)`
 	- `invalidCommand` The command the user tried to use
 	- `roomJid` The jid of the HipChat room
 	- `fromName` The name of the HipChat user that messaged the bot
 	- `callback` [optional] The actual function you want to fire in the form of callback(message)

Example:
```js
hipbot.onInvalid(function(invalidCommand, roomJid, fromName, callback) {
	callback('"' + invalidCommand + '" is not a valid command');
});
```

## Ping Functions
Although there is a lot that you can do using commands, you may want your bot to do some things without being told. For example, wouldn't it be nice if your bot automatically told you when a new incident had been triggered in PagerDuty? To do this, you can use the `onPing` function.

### hipbot.onPing(key, callback)

Set function to fire when the bot pings (every 30 seconds).

 - `key` A string identifier for that function (needed if you want to pause it later)
 - `callback` A function that fires on ping

To pause and resume the function from firing:

### hipbot.pause(key)

Pause a function from firing repeatedly.

 - `key` The string identifier for that function

### hipbot.resume(key)

Resume a function to start firing repeatedly.

 - `key` The string identifier for that function

*Examples:*
```js
hipbot.onPing('incident-update', function() {
	pd.list('t', function(err, list) {
		if(err) {
			bot.sendMessage(responses.error, roomJid);
		} else {
			if(list.length != 0) {
				bot.sendMessage(list.length + 'triggered incidents.', roomJid);
			}
		}
	});
});

hipbot.onCommand('stop', function(body, roomJid, fromName, callback) {
	hipbot.pause('incident-update');
});

hipbot.onCommand('start', function(body, roomJid, fromName, callback) {
	hipbot.resume('incident-update');
});
```

*Note: Currently, the ping time cannot be changed, but future plans are to make this time editable.*

Also, keep in mind that PagerDuty offers webhooks for HipChat, which are designed to immediately ping HipChat rooms when incidents are triggered, acknowledged, or resolved in PagerDuty.

To learn how to create webhooks: [Create A PagerDuty Webhook!](http://www.pagerduty.com/docs/guides/hipchat-integration-guide/)

Well, now the rest is up to you. Hip-pager-bot provides a basic foundation, but there is a lot more that could be done with it. Get creative, see what you can come up with. Feel free to submit a pull request if you have an idea or an improvement.

To learn more about working with the PagerDuty API: [PagerDuty REST API!](http://developer.pagerduty.com/documentation/rest)

## Legal Stuff
[Apache License](http://www.apache.org/licenses/)

Version 2.0, January 2004
