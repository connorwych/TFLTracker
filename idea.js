__rootpath = __dirname;

checkTFLStatus("victoria,central,bakerloo");


function checkTFLStatus(undergroundRoutes) {
  var request = require('request')
  var tflCredentials = require( __rootpath + "/conf/tflcredentials.json");


  var apiBaseURL = "https://api.tfl.gov.uk/Line/";
  var queryURL = apiBaseURL + undergroundRoutes + "/Status?app_id="+ tflCredentials.applicationID + "&app_key=" + tflCredentials.applicationKey;

  var request = require('request');
  request.get(queryURL, parseStatus)
}

function parseStatus(error, response, body ) {
  if('null' != error) {
    var responseText = JSON.parse(body);
    var statusMessage = "";
    var disruptionFree = true;

    responseText.forEach( function(element) {
      if (10 != element.lineStatuses[0].statusSeverity) {
        disruptionFree &= false
      }
      statusMessage += element.name + " - Line status: " +  element.lineStatuses[0].statusSeverityDescription + '<br />';
    });

    if ( !disruptionFree ) {
      statusMessage += "See https://tfl.gov.uk/tube-dlr-overground/status/ for details";
      sendEmail(statusMessage)
    }
  } else {
    console.log("error: " + error);
  }
}


function sendEmail( messageText ) {
  var nodemailer = require("nodemailer");
  var mailConfig = require(__rootpath + "/conf/mailcredentials.json");
  var messageConfig = require(__rootpath + "/conf/mailrecipient.json");

  var message = {};

  message = {
  			to: messageConfig.EMAIL,
  			subject: "DISRUPTION TO COMMUTE",
  			html: messageText
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

  		var transporter = nodemailer.createTransport(smtpConfig);
  		transporter.sendMail(message, function(error, info){
  			if(error){
  				return console.log(error);
  			}
  			console.log('Message sent: ' + info.response);
  		});

}


function sendSMS(message) {

  var request = require("request");
  var credentials = require(__rootpath + "/conf/twiliocredentials");
  var recipient = require(__rootpath + "/conf/twiliorecipient");


  var dataString = { form:  {
    To: recipient.phoneNumber,
    From: credentials.sendingNumber,
    Body: message.body
  }}

  smsURL = "https://api.twilio.com/2010-04-01/Accounts/" + credentials.accountSid +"/Messages.json",

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
  })
}


// curl -X POST "https://api.twilio.com/2010-04-01/Accounts/AC1a6af5e2fc5826653760c646b816207f/Messages.json" \
// --data-urlencode "To=+447921838646"  \
// --data-urlencode "From=+441455561043"  \
// --data-urlencode "Body=This is the ship that made the Kessel Run in fourteen parsecs?"  \
// -u AC1a6af5e2fc5826653760c646b816207f:266f208082abc93357d1faff52405f4c
