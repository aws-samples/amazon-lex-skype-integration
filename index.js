/******************
 *
 * Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 *
 * @author Ahmad R. Khan
 *
 * An AWS Lambda function that integrates Twilio Programmable SMS with Amazon Lex.
 * [Microsoft Bot Framework]<--->[API Gateway]<--->[this AWS Lambda function]<--->[Amazon Lex]
 *
 * The AWS Lambda function must have the following environment variables configured:
 * 1. MICROSOFT_APP_ID - obtained while configuring bot at dev.botframework.com
 * 2. MICROSOFT_APP_PASSWORD - obtained while configuring bot at dev.botframework.com
 * 3. BOT_NAME - the name of the Amazon Lex bot
 * 4. BOT_ALIAS - the name of the Amazon Lex bot alias
 ******************/

var builder = require('botbuilder');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var connector = new builder.ChatConnector({
		appId:process.env.MICROSOFT_APP_ID,
		appPassword: process.env.MICROSOFT_APP_PASSWORD
});

//this is needed to make connector.listen() method work with AWS Lambda
exports.handler = lambda(connector);

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
		//relay messages back and forth to/from Amazon Lex
		var lexruntime = new AWS.LexRuntime();
		var params = {
			botAlias: process.env.BOT_ALIAS,
			botName: process.env.BOT_NAME,
			inputText: session.message.text,
			userId: session.message.user.id,
			sessionAttributes: {
			}
		};
		lexruntime.postText(params, function(err, data) {
			if (err) {
				console.log(err, err.stack); // an error occurred
				session.send('Sorry, we ran into a problem at our end.');
			} else {
				console.log(data);           // got something back from Amazon Lex
				session.send(data.message); //now send it back to the Microsoft Bot Framework
			}
		});
});

//this is needed to make connector.listen() method work with AWS Lambda
function lambda(connector) {
    let listener = connector.listen();
    let handler = (event, context, callback) => {
        let reqWrapper = {
            body: JSON.parse(event.body),
            headers: event.headers
        };
        let statusCode;
        let resWrapper = {
            status: (code) => {
                statusCode = code;
            },
            end: () => {
                callback(null, { statusCode: statusCode });
            }
        };
        listener(reqWrapper, resWrapper);
    };
    return handler;
}
