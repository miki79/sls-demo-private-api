const path = require("path");
const fs = require("fs");
const awsMock = require("aws-sdk-mock");

awsMock.setSDK(path.resolve(`${__dirname}/../node_modules/aws-sdk`));
const { get, create } = require("../src/customer");

console.info = jest.fn();
console.error = jest.fn();

describe("Get Customer", () => {
  afterEach(() => {
    awsMock.restore();
  });

  const event = {
    pathParameters: {
      customerId: "f6b794e0-cc22-4d29-adae-68f74a4e7526",
    },
  };

  test("Get valid customer", () => {
    awsMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, JSON.parse(fs.readFileSync(`${__dirname}/mock/customerGetValid.json`).toString()));
    });

    return get(event).then((data) => {
      expect(data).toHaveProperty("body", '{"firstName":"first","lastName":"last","customerId":"f6b794e0-cc22-4d29-adae-68f74a4e7526"}');
      expect(data).toHaveProperty("statusCode", 200);
    });
  });

  test("Customer not found", () => {
    awsMock.mock("DynamoDB.DocumentClient", "get", (params, callback) => {
      callback(null, {});
    });

    return get(event).then((data) => {
      expect(data).toHaveProperty("body", '{"error":"Customer not found"}');
      expect(data).toHaveProperty("statusCode", 404);
    });
  });
});

describe("Create Customer", () => {
  afterEach(() => {
    awsMock.restore();
  });

  test("Create valid customer", () => {
    awsMock.mock("DynamoDB.DocumentClient", "put", (params, callback) => {
      callback(null, {});
    });
    const event = { body: '{"firstName":"first","lastName":"last"}' };

    return create(event).then((data) => {
      expect(data).toHaveProperty("body");
      expect(JSON.parse(data.body)).toHaveProperty("customerId");
      expect(data).toHaveProperty("statusCode", 201);
    });
  });
});
