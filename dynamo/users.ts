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
        },
        {
            name: 'lskSortKey',
            type: 'S'
        },
        {
            name: 'gsiPk',
            type: 'S',
        },
        {
            name: 'gsiSk',
            type: 'S'
        }
    ],
    globalSecondaryIndexes: [
        {
            name: 'first-gsi',
            hashKey: 'gsiPk',
            rangeKey: 'gsiSk',
            projectionType: 'INCLUDE', // project only required attributes
            nonKeyAttributes: ['id', 'name', 'email']
        }
    ],
    localSecondaryIndexes: [
        {
            name: 'first-lsi',
            rangeKey: 'lskSortKey',
            projectionType: 'INCLUDE', // will project only the given attributes to the index
            nonKeyAttributes: ['id', 'createdAt', 'name', 'email']
        }
    ],
    hashKey: 'id',
    rangeKey: 'createdAt',
    billingMode: 'PROVISIONED', // defaults to provisioned, if no value is specifed. supports "PAY_PER_REQUEST"
    writeCapacity: 30,
    readCapacity: 30,
    ttl: {
        enabled: true,
        attributeName: 'deleteAt'
    },
    // enable point in time recovery
    pointInTimeRecovery: {
        enabled: true,
    },
    serverSideEncryption: {
        enabled: true,
    },
    streamEnabled: true,
    streamViewType: 'NEW_AND_OLD_IMAGES', // you can access both the old and new versions of the item in the stream
});

Users.onEvent(
    'users-stream'
    , new aws.lambda.CallbackFunction('users-stream-lambda', {
        callback: async (event: aws.dynamodb.TableEvent) => {
            const { NewImage, OldImage } = event.Records[0].dynamodb;
            console.log(NewImage, OldImage);
        },
        memorySize: 512,
        timeout: 30
    }),
    {
        startingPosition: 'LATEST',
        batchSize: 1, // send only 1 stream record to a lambda.
    }
);