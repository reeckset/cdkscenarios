const AWS = require('aws-sdk');

exports.handler = async function(event: any) {
    console.log("Lambda was called! Event: \n" + JSON.stringify(event, null, 2))

    const lambda = new AWS.Lambda();
    lambda.listFunctions({}, (err: any, data: any) => {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);
    });
}