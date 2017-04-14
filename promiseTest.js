__rootpath = __dirname;

var XMLHttpRequest    = require('XMLHttpRequest').XMLHttpRequest;
var tflCredentials    = require( __rootpath + "/conf/tflcredentials.json");

var undergroundRoutes = "victoria,central"
var apiBaseURL        = "https://api.tfl.gov.uk/Line/";
var queryURL          = apiBaseURL + undergroundRoutes + "/Status?app_id="+ tflCredentials.applicationID + "&app_key=" + tflCredentials.applicationKey;

exports.myHandler = function( event, context, callback ) {
	console.info("Starting TFL Check" )
  get( queryURL )
  .then( response => parseTFLStatus( response ), error => handleTFLError ( error ) )
  .then( response => sendEmail( response ),      error => handleGenericError( error ) )
  .then( response => cleanUp( context ),         error => handleEmailFailure ( context ) );
}

function get( url ) {
  return new Promise( function( resolve, reject ) {
    var req = new XMLHttpRequest();
    req.open( 'GET', url );
    req.onload = function() {
      if( req.status == 200 ) {
        resolve( req.responseText );
      }
      else {
        reject( Error( req.statusText ) );
      }
    };
    req.onerror = function() {
      reject( Error( "Network Error" ) );
    };
    console.log("Requesting URL: "  + url);
    req.send();
  });
}


function parseTFLStatus( responseText ) {
  return new Promise( function( resolve, reject ) {
    console.log("Processing TFL Status");
    var sendAlert = false;
    var statusMessage = {
      "title": "",
      "content": ""
    }

    responseText = JSON.parse(responseText)
    for( var i = 0; i < responseText.length; i++ ) {
      element = responseText[i];
      if( 10 != element.lineStatuses[0].statusSeverity ) {
        console.info("Found disruption to commute");
        sendAlert = true;
        statusMessage.title = "TFLTracker - Disruption to commute";
        console.log(statusMessage.title);
      }
      statusMessage.content += element.name + " - Line status: " +  element.lineStatuses[0].statusSeverityDescription + '<br />';
    }
    if ( sendAlert ) {
      console.log("Discruption to commute - returning statusMessage")
      console.log(statusMessage.content)
      resolve( statusMessage );
    } else {
      console.log("No problems with commute")
      reject( "No disruption" );
    }
  });
}

function handleTFLError( message ) {
  return new Promise( function( resolve, reject ) {
    statusMessage.title = "TFLTracker - Error connecting to TFL API"
    statusMEssage.content = message;
    resolve(statusMessage)
  });
}


function sendEmail( message ) {
  return new Promise( function( resolve, reject ) {
    var mailConfig        = require(__rootpath + "/conf/mailcredentials.json");
    var messageConfig     = require(__rootpath + "/conf/mailrecipient.json");
    var aws								= require('aws-sdk');
    var ses = new aws.SES({
      region: 'eu-west-1'
    });

    var eParams = {
      Destination: {
        ToAddresses: [messageConfig.EMAIL]
      },
      Message: {
        Body: {
          Html: {
            Data: messageText.content
          }
        },
        Subject: {
          Data: messageText.title
        }
      },
      Source: mailConfig.MAIL_ADDRESS
    };
    var email = ses.sendEmail( eParams, function( err, data ) {
      if(err) {
        console.error( err );
        reject( err )
      }	else {
        console.log("Email successfully sent");
        resolve();
      }
    });
  });
}


function handleGenericError (message) {
  //This should never happen
  console.error( message );
}

function cleanUp( context ) {
  return new Promise( function( resolve, reject ) {
    context.succeed();
    resolve();
  });
}

function handleEmailFailure( context ) {
  return new Promise (function( resolve, reject ) {
    context.fail();
  });
}
