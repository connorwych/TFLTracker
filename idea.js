var XMLHttpRequest	= require("xmlhttprequest").XMLHttpRequest;


var undergroundRoutes = "victoria";
var tflCredentials = { applicationID: "689a9029", applicationKey: "c749821d4f1ef2a695e2167ed074a624" };
var twilloCredentials = { accountSid: "AC1a6af5e2fc5826653760c646b816207f", authToken: "266f208082abc93357d1faff52405f4c",sendingNumber:"+441455561043"};
var twilloMessageRecipient = {"phoneNumber": "+447921838646", "name": "connor"};

var apiBaseURL = "https://api.tfl.gov.uk/Line/";
var xhr = new XMLHttpRequest();
var queryURL = apiBaseURL + undergroundRoutes + "/Status?app_id="+ tflCredentials.applicationID + "&app_key=" + tflCredentials.applicationKey;

xhr.onreadystatechange = function() {
  if ( xhr.readyState == 4 ) {
    if ( xhr.status == 200 ) {
      console.log("XMLHttpRequest complete, returning JSON");
      var response = JSON.parse(xhr.responseText);

      console.log(response[0].lineStatuses[0].statusSeverity);
      console.log(response[0].lineStatuses[0].statusSeverityDescription);
      var message = {};
      message.body = "victoria line satus is " + response[0].lineStatuses[0].statusSeverityDescription;

      if (10 !== response[0].lineStatuses[0].statusSeverity) {
        console.log("sending SMS")
        sendSMS(twilloCredentials, twilloMessageRecipient, message);
      } else {
        console.log("Good service - no need to alert")
      }

    } else {
      // SHIT BROKE - NO CLUE
      console.log("Nope");
    }
  }
}
xhr.open("GET", queryURL, true);
xhr.send();


function sendSMS(credentials, recipient, message) {

  var request = require('request');
  var dataString = { form:  {
    To: recipient.phoneNumber,
    From: credentials.sendingNumber,
    Body: message.body
  }}

  // smsURL = "https://"+credentials.accountSid+":"+credentials.authToken+"@api.twilio.com/2010-04-01/Accounts/" + credentials.accountSid +"/Messages.json",
   smsURL = "https://api.twilio.com/2010-04-01/Accounts/" + credentials.accountSid +"/Messages.json",

  request
  .post(smsURL, dataString)
  .auth(credentials.accountSid,credentials.authToken, false)
  .on('response', function(response, body){
    console.log(response.statusCode);
    console.log(response.statusCodeText);
    console.log(response.responseText);
  })
  .on('error', function(err) {
    console.log(error)
  })
}


// curl -X POST "https://api.twilio.com/2010-04-01/Accounts/AC1a6af5e2fc5826653760c646b816207f/Messages.json" \
// --data-urlencode "To=+447921838646"  \
// --data-urlencode "From=+441455561043"  \
// --data-urlencode "Body=This is the ship that made the Kessel Run in fourteen parsecs?"  \
// -u AC1a6af5e2fc5826653760c646b816207f:266f208082abc93357d1faff52405f4c
