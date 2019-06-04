const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const uuidv4 = require('uuid/v4');
const docClient = new AWS.DynamoDB.DocumentClient();
const { TABLE_CUSTOMER } = process.env;

const getCustomer = customerId => {
  return docClient
    .get({
      TableName: TABLE_CUSTOMER,
      Key: { customerId },
    })
    .promise()
    .then(data => {
      return data.Item ? data.Item : null;
    });
};

const setCustomer = async customerObj => {
  return docClient
    .put({
      TableName: TABLE_CUSTOMER,
      Item: customerObj,
    })
    .promise()
    .then();
};

module.exports.get = async event => {
  const { customerId } = event.pathParameters;
  const customer = await getCustomer(customerId);
  if (customer) {
    return {
      statusCode: 200,
      body: JSON.stringify(customer),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Customer not found' }),
    };
  }
};

module.exports.create = async event => {
  const body = JSON.parse(event.body);
  const id = uuidv4();
  const customer = {
    customerId: id,
    firstName: body.firstName,
    lastName: body.lastName,
  };
  await setCustomer(customer);
  return {
    statusCode: 200,
    body: JSON.stringify({ customerId: id }),
  };
};
