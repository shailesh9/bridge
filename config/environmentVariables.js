"use strict";

// eslint disable no-var

var environmentVariables = {
  "BRIDGE_MONGO_CONNECTION_STRING": process.env.BRIDGE_MONGO_CONNECTION_STRING || "mongodb://10.18.6.109:27017/fhir_QA", // "mongodb://127.0.0.1:27017/fhir"
  "BRIDGE_LOGGING_LEVEL": process.env.BRIDGE_LOGGING_LEVEL || "debug", // debug
  "BRIDGE_RABBITMQ_URL": process.env.BRIDGE_RABBITMQ_URL || "amqp://integration:integration@10.18.6.109:5672",
  "BRIDGE_QUEUE_NAME": process.env.BRIDGE_QUEUE_NAME || "test",
  "BRIDGE_EXCHANGE_NAME": process.env.BRIDGE_EXCHANGE_NAME || "test-cantaHealth",
  "BRIDGE_PREFETCH_COUNT": process.env.BRIDGE_PREFETCH_COUNT || 1
};

module.exports = environmentVariables;

// eslint enable no-var
