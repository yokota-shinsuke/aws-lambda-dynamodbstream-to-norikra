# DynamoDBStream-to-Norikra
This is AWS Lambda function to route DynamoDB Stream records to Norikra.

Amazon DynamoDB is a fast and flexible NoSQL database service for all applications that need consistent, single-digit millisecond latency at any scale.
 * http://aws.amazon.com/dynamodb/

Norikra is an open-source Stream Processing Server with SQL.
 * http://norikra.github.io/

## How To Use
1.Setup Norikra
http://norikra.github.io/index.html
1.Install modules
$ npm install
1.Edit DynamoDBStream-to-Norikra.js and change value of norikraApi
1.Zip all files
```
$ zip -r DynamoDBStream-to-Norikra.zip DynamoDBStream-to-Norikra.js node_modules
```
1.Upload the Deployment Package to Lambda
```
$ aws lambda upload-function\
   --function-name "DynamoDBStream-to-Norikra" \
   --function-zip "DynamoDBStream-to-Norikra.zip"\
   --role arn:aws:iam::account-id:role/lambda_exec_role\
   --mode event\
   --handler "DynamoDBStream-to-Norikra.handler"\
   --timeout 30\
   --runtime nodejs\
   --region us-east-1
```
1.Create Event Source in AWS Lambda
```
$ aws lambda add-event-source \
   --region us-east-1 \
   --function-name DynamoDBStream-to-Norikra  \
   --role arn:aws:iam::account-id:role/invocationrole \
   --event-source arn:aws:dynamodb:us-east-1:account-id:table/ExampleTableWithStream/stream/stream-id/ \
   --debug \
   --batch-size 100 \
   --profile adminuser
```
