import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import { randomUUID } from 'crypto';
import { Users } from '../dynamo/users';

export const createUser = new aws.lambda.CallbackFunction('createUser', {
    callback: async (event: awsx.apigateway.Request): Promise<awsx.apigateway.Response> => {
        const { body = '{}' } = event;
        const parsedBody = JSON.parse(body || '{}');
        const { name, email, age } = parsedBody; // obtain event body sent from client
        const userId = randomUUID();

        const FIVE_DAYS_AFTER_TODAY = new Date(Date.now() + (1000 * 60 * 60 * 24 * 5));

        // initialize new user
        const user = {
            id: userId,
            name,
            email,
            age,
            createdAt: Date.now(),
            deleteAt: FIVE_DAYS_AFTER_TODAY
        }

        // create an instance of the Document Client by using the SDK bundled into Pulumi.
        const documentClient = new aws.sdk.DynamoDB.DocumentClient();

        // add the item into the table
        await documentClient.put({
            TableName: Users.name.get(), // refer the table name using the object declared earlier.
            Item: user
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(user)
        }
    },
    memorySize: 128,
    timeout: 10,
});

export const getAllUsers = new aws.lambda.CallbackFunction('getAllUsers', {
    callback: async (): Promise<awsx.apigateway.Response> => {
        const documentClient = new aws.sdk.DynamoDB.DocumentClient();
        // fetch all users by scanning the table
        // for production apps, use a query and avoid scans.
        const { Items } = await documentClient.scan({
            TableName: Users.name.get()
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(Items)
        }
    },
    memorySize: 128,
    timeout: 10,
});

export const deleteUser = new aws.lambda.CallbackFunction('deleteUser', {
    callback: async (event: awsx.apigateway.Request): Promise<awsx.apigateway.Response> => {
        const { pathParameters = {} } = event;
        const { id } = pathParameters as any;
        const documentClient = new aws.sdk.DynamoDB.DocumentClient();

        await documentClient.delete({
            TableName: Users.name.get(),
            Key: {
                id
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `User with id ${id} deleted successfully`
            })
        }
    },
    memorySize: 128,
    timeout: 10,
})

export const updateUser = new aws.lambda.CallbackFunction('updateUser', {
    callback: async (event: awsx.apigateway.Request): Promise<awsx.apigateway.Response> => {
        const { body = '{}' } = event;
        const parsedBody = JSON.parse(body || '{}');
        const { id, name, email, age, createdAt } = parsedBody; // obtain event body sent from client
        const documentClient = new aws.sdk.DynamoDB.DocumentClient();

        const patchObject = {
            ...name && { name },
            ...email && { email },
            ...age && { age }
        }

        let updateExpression = '';
        let updateExpressionAttributeNames: any = {};
        let updateExpressionAttributeValues: any = {};

        Object.entries(patchObject).forEach(([key, value]) => {
            // dynamically build the update expression based on the keys in the patch object
            updateExpression += `${updateExpression.length > 0 ? `, #${key} = :${key} ` : `SET #${key} = :${key} `}`;
            updateExpressionAttributeNames[`#${key}`] = key;
            updateExpressionAttributeValues[`:${key}`] = value;
        });

        await documentClient.update({
            TableName: Users.name.get(),
            Key: { id, createdAt },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: updateExpressionAttributeNames,
            ExpressionAttributeValues: updateExpressionAttributeValues
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: `User with id ${id} updated successfully`,
                updateAttributes: { ...patchObject }
            })
        }
    },
    memorySize: 128,
    timeout: 10,
});