// Example using hip-pager-bot to create a web app in express using jade and bootstrap

var moment = require('moment');
var flash = require('connect-flash');
var http = require('http');
var express = require('express');
var jade = require('jade');

/* Edit these variables to match your PagerDuty credentials
----------------------------------------------------------------------*/
var pd = require('hip-pager-bot').set({
	subdomain : '???????????',
	api_key : '???????????',
	service_key : '???????',
	service_ID : '???????'
});
//----------------------------------------------------------------------

var app = express().disable('x-powered-by');
app.engine('jade', jade.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('g73Aafg2gs3'));
app.use(express.session());
app.use(flash());

app.use(function(err, req, res, next) {
	console.error(err.stack);
	res.send(500, {error: 'Something broke!'});
});

app.post('/new', function(req, res) {
	var description = req.body.description;
		if(description == null || description == '' || description.split(' ').length == 0) {
			req.flash('error', 'Please provide a description for this issue.');
			res.redirect('/');
		} else {
			pd.trigger(description, {'Escalated_through' : 'Web Dashboard'}, function(err, success) {
				if(err || !success) {
					console.error('ERROR: could not escalate request');
					req.flash('error', 'There was an error with Hip-Pager Bot.');
					res.redirect('/');
				} else if(success) {
					req.flash('success', 'Your issue was escalated successfully to the user on call.');
					res.redirect('/');
				}
			});
		}
});

app.get('/', function(req, res) {
	pd.who(function(err, on_call) {
		if(err) {
			console.error(err);
		} else if(on_call == null) {
			callback('There is currently no one on call');
		} else {
			pd.list('at', function(err, list) {
				if(err) {
					console.error(err);
				} else {
					var incidents = [];
					for(var i = 0; i < list.length; i += 1) {
						incidents.push(parse_incident(list[i]));
					}
					res.render('index', {title : 'Hip-Pager Web Dashboard', page : 'dashboard', error: req.flash('error'), success: req.flash('success'), incidents: incidents, on_call: on_call.name});
				}
			});
		}
	});
});

function parse_incident(incident) {
	var statusTime = moment(incident.last_status_change_on).format('dddd, MMMM Do YYYY, h:mm:ss a');

	var description;
	if(incident.trigger_summary_data.description == null) {
		description = 'NONE';
	} else {
		description = incident.trigger_summary_data.description;
	}

	var assigned_to;
	if(incident.assigned_to_user == null) {
		assigned_to = 'NONE ASSIGNED';
	} else {
		assigned_to = incident.assigned_to_user.name;
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
		assigned_to : assigned_to,
		status : status
	};

	return display;
}

app.listen(8000);
