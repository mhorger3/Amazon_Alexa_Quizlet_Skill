// Open Study - Chemistry
// Matthew Horger - Willaim McKeown - Ruth Thomas
// Drexel University - Freshman - Class of 2021
// Developed by Matthew Horger - BS/MS Computer Science 2021
// Utilizes usage of Apache License, Version 2.0, found here -  http://aws.amazon.com/apache2.0/

'use strict';
var https = require('https');

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);


     
         if (event.session.application.applicationId !== "amzn1.ask.skill.ebc791c6-9d78-4735-8141-abf20788396a") {
            context.fail("Invalid Application ID");
         }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
                + ", sessionId=" + session.sessionId);

    // Launch our connnection to quizlet when the user opens the skill
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
                + ", sessionId=" + session.sessionId);
        var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;  
    if ("AMAZON.StartOverIntent" === intentName) { // if the user wants to study again, open the set again
        getWelcomeResponse(callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback); // if the user needs help, direct them to the help function
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback); // if the user wants to quit, end the session
    }  else {
        throw "Invalid intent";
    }
}


 // Called when the user ends the session.
 
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
                + ", sessionId=" + session.sessionId);
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
        // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Open Study";
    var options = {
        host: 'api.quizlet.com', // connect to quizlet API
        port: 443,
        path: '/2.0/sets/67672902/terms?client_id=yqtnDKFeuF', // for different sets, all that would need to be changed would be the set id number. 
                                                                // the connection is the same using a public client_id for auth
        method: 'GET'
    };

    var req = https.request(options, function(res) {
        var body = '';
        console.log('Status:', res.statusCode); // check code for connection
        console.log('Headers:', JSON.stringify(res.headers)); // parse the headers 
        res.setEncoding('utf8'); // encode the data properly
        res.on('data', function(chunk) {
            body += chunk; // for each chunk of data, append it to our body
        });
        res.on('end', function() {
            console.log('Successfully processed HTTPS response'); // if our website connection is good, log it! 

            body = JSON.parse(body); // parse the data from the api to the string that Javascript can manipulate

                console.log(body); // log the data just for debug
				for(var i = 0; i < Object.keys(body).length; i++){
                speechOutput += "Term: " + body[i].term + ". " + " Definition: " + body[i].definition + ". "; // output each defintion and term based off the length of body
				}
                callback(sessionAttributes,
                 buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

             });
    });
    req.end(); // actually executes our code
   
    var speechOutput = " "
    var repromptText = '';
    var shouldEndSession = true;
    
}
function handleGetHelpRequest(intent, session, callback) {

    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    var speechOutput = "I will tell you each term and definition in this quizlet set. All you have to do is say: " + "Alexa "  + " launch study chemistry",
        repromptText = "Say 'Alexa, launch study chemistry' ";
        var shouldEndSession = true;
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Thanks for studying!", "", true));
}
// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: "Contents " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    }
}
function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
                        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
                            }
                    },
        shouldEndSession: shouldEndSession
            };
}
function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    }
}
