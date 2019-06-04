const AWSXRay = require('aws-xray-sdk');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const uuidv4 = require('uuid/v4');
const functionShield = require('@puresec/function-shield');

const { TABLE_CUSTOMER } = process.env;

functionShield.configure({
  policy: {
    // 'block' mode => active blocking
    // 'alert' mode => log only
    // 'allow' mode => allowed, implicitly occurs if key does not exist
    outbound_connectivity: 'block',
    read_write_tmp: 'block',
    create_child_process: 'block',
    read_handler: 'block',
  },
  token: process.env.FUNCTION_SHIELD_TOKEN,
});

const getCustomer = (customerId) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  return docClient
    .get({
      TableName: TABLE_CUSTOMER,
      Key: { customerId },
    })
    .promise()
    .then(data => (data.Item ? data.Item : null));
};

const setCustomer = async (customerObj) => {
  const docClient = new AWS.DynamoDB.DocumentClient();
  return docClient
    .put({
      TableName: TABLE_CUSTOMER,
      Item: customerObj,
    })
    .promise();
};

module.exports.get = async (event) => {
  const { customerId } = event.pathParameters;
  const customer = await getCustomer(customerId);
  if (customer) {
    return {
      statusCode: 200,
      body: JSON.stringify(customer),
    };
  }
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'Customer not found' }),
  };
};

module.exports.create = async (event) => {
  const body = JSON.parse(event.body);
  const id = uuidv4();
  const customer = {
    customerId: id,
    firstName: body.firstName,
    lastName: body.lastName,
  };
  await setCustomer(customer);
  return {
    statusCode: 201,
    body: JSON.stringify({ customerId: id }),
  };
};
