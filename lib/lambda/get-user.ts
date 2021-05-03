import * as AWS from 'aws-sdk';
import { promisify } from 'util';

exports.handler = async function(event: any, context: any) {
    const dynamoDB = new AWS.DynamoDB();
    const getItem = promisify(dynamoDB.getItem).bind(dynamoDB) as (params: AWS.DynamoDB.GetItemInput) => AWS.DynamoDB.GetItemOutput;
    
    if(!process.env.tableName){
        throw Error("Table name not defined");
    }
    
    return getItem({
        Key: {
            "name": {
                "S": context.name
            }
        },
        TableName: process.env.tableName
    });
}