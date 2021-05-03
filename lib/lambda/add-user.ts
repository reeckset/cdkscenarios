import * as AWS from 'aws-sdk';
import { promisify } from 'util';

exports.handler = async function(event: any, context: any) {
    const dynamoDB = new AWS.DynamoDB();
    const putItem = promisify(dynamoDB.putItem).bind(dynamoDB) as (params: AWS.DynamoDB.PutItemInput) => AWS.DynamoDB.PutItemOutput;
    
    if(!process.env.tableName){
        throw Error("Table name not defined");
    }
    
    return putItem({
        Item: {
            "name": {
                "S": context.name
            }
        },
        TableName: process.env.tableName
    });
}