import * as aws from '@pulumi/aws';

// table name -> users
export const Users = new aws.dynamodb.Table("users", {
    // define possible hash and range key attributes only
    attributes: [
        {
            name: 'id',
            type: 'S' // string
        },
        {
            name: 'createdAt',
            type: 'N' // number
        }
    ],
    hashKey: 'id',
    rangeKey: 'createdAt',
    billingMode: 'PROVISIONED', // defaults to provisioned, if no value is specifed. supports "PAY_PER_REQUEST"
    writeCapacity: 30,
    readCapacity: 30
});