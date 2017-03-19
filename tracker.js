__rootpath = __dirname;


checkTFLStatus("victoria,central")
exports.myHandler = function(event, context, callback) {
	console.info("Starting TFL Check" )
	undergroundRoutes = "victoria,central"
	checkTFLStatus(undergroundRoutes);
}

function checkTFLStatus( undergroundRoutes ) {
	var request           = require('request')
	var tflCredentials    = require( __rootpath + "/conf/tflcredentials.json");
	var apiBaseURL        = "https://api.tfl.gov.uk/Line/";
	var queryURL          = apiBaseURL + undergroundRoutes + "/Status?app_id="+ tflCredentials.applicationID + "&app_key=" + tflCredentials.applicationKey;

	console.info("Requesting Data from TFL");
	request.get(queryURL, parseStatus);
}

function parseStatus( error, response, body ) {
	var statusMessage   = {
		title: "",
		content: ""
	};
	var sendAlert       = false;

	if( 'null' != error ) {
		console.info("Recieved response from TFL: Processing")
		var responseText    = JSON.parse( body );

		for (var i=0; i<responseText.length; i++) {
			element=responseText[i];
			if( 10 == element.lineStatuses[0].statusSeverity ) {
				console.info("Found disruption to commute");
				sendAlert = true;
				statusMessage.title = "Disruption to commute";
				console.log(statusMessage.title);
			}
			statusMessage.content += element.name + " - Line status: " +  element.lineStatuses[0].statusSeverityDescription + '<br />';
		}
	} else {
		sendAlert = true;
		statusMessage.title 	= "Failed to contact TFL API";
		statusMessage.content = "Could not connect to TFL API"
		console.error("error: " + error);
	}
	console.log(statusMessage.title)
	console.log(statusMessage.content)

	if ( sendAlert ) {
		console.log(statusMessage.title)
		console.log(statusMessage.content)
		console.info("Sending alert to user");
		// statusMessage += "See https://tfl.gov.uk/tube-dlr-overground/status/ for details";
		sendEmail( statusMessage )
	} else {
		console.info("No disruption found");
	}
}


function sendEmail( messageText ) {
	console.log(messageText);
	console.log(messageText)
	var nodemailer        = require("nodemailer");
	var mailConfig        = require(__rootpath + "/conf/mailcredentials.json");
	var messageConfig     = require(__rootpath + "/conf/mailrecipient.json");
	var message = {
		to: messageConfig.EMAIL,
		subject: messageText.title,
		html: messageText.content
	};


	var smtpConfig = {
		host: mailConfig.MAIL_HOST,
		port: mailConfig.MAIL_PORT,
		secure: mailConfig.MAIL_USE_SECURE,
		auth: {
			user: mailConfig.MAIL_USERNAME,
			pass: mailConfig.MAIL_PASSWORD
		}
	};
	var transporter 			= nodemailer.createTransport(smtpConfig);

	transporter.sendMail(message, function(error, info){
		if(error){
			console.error(error);
		}
		console.info('Message sent: ' + info.response);
	});

}


function sendSMS( message ) {
	var request 					= require("request");
	var credentials 			= require(__rootpath + "/conf/twiliocredentials");
	var recipient 				= require(__rootpath + "/conf/twiliorecipient");
	var dataString = { form:  {
		To: recipient.phoneNumber,
		From: credentials.sendingNumber,
		Body: message.body
	}}

	smsURL = "https://api.twilio.com/2010-04-01/Accounts/" + credentials.accountSid +"/Messages.json";

	request
	.post(smsURL, dataString)
	.auth(credentials.accountSid,credentials.authToken, false)
	.on("response", function(response, body){
		console.log(response.statusCode);
		console.log(response.statusCodeText);
		console.log(response.responseText);
	})
	.on("error", function(err) {
		console.log(error)
	});

}


// curl -X POST "https://api.twilio.com/2010-04-01/Accounts/XXXXXXXX/Messages.json" \
// --data-urlencode "To=+XXXXXXXX"  \
// --data-urlencode "From=+XXXXXXXX"  \
// --data-urlencode "Body=This is the ship that made the Kessel Run in fourteen parsecs?"  \
// -u XXXXXXXX:XXXXXXXX
