# pagerduty-bot

Create and customize a HipChat bot that interacts with PagerDuty.

## Installation

    $ npm install pagerduty-bot

## Get Started

There are two node modules included in the package: `pd` and `hipbot`.

* `pd` Includes all the methods used to interact with the PagerDuty developer API
* `hipbot` Creates a HipChat bot and includes methods that allow bot customization

Create a PagerDuty object which contains all the methods used to interact with the PagerDuty API:
```js
var pd = require('pagerduty-bot').set({
	auth_token : '???????????',
	api_key : '???????????',
	service_key : '???????????'
});
```

 - `auth_token` A valid authentication token from HipChat.
 - `api_key` A valid API key from PagerDuty.
 - `service_key` ID for a PagerDuty service. This is the service incidents will be created on by the bot.

Create and connect a HipChat bot:
```js
var bot = pd.hipbot({
	jid : '???????@chat.hipchat.com/bot',
	password : '???????????',
	rooms : ['??????@conf.hipchat.com'],
	mention : 'bot',
	name : 'PagerDuty Bot',
	description : 'I am here to help!',
	version : '???????'
});
```

## License

Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/