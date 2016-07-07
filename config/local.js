"use strict";

// eslint disable no-var

var environmentVariables = require("./environmentVariables"),
  config = {
    "rabbitMQ": {
      "url": environmentVariables.BRIDGE_RABBITMQ_URL,
      "queueName": environmentVariables.BRIDGE_QUEUE_NAME,
      "exchangeName": environmentVariables.BRIDGE_EXCHANGE_NAME,
      "exchangeType": "direct",
      "prefetchCount": environmentVariables.BRIDGE_PREFETCH_COUNT,
      "options": {}
    },
    "mongoDb": {
      "connectionString": environmentVariables.BRIDGE_MONGO_CONNECTION_STRING,
      "operationTimeout": 4000,
      "connectionOptions": {
        "server": {
          "poolSize": 5,
          "socketOptions": {
            "autoReconnect": true,
            "keepAlive": 0
          },
          "reconnectTries": 30,
          "reconnectInterval": 1000
        }
      },
      "promiseTimeout": 4500
    },
    "logger": {
      "name": "ch-node-bridge",
      "streams": [
        {
          "level": environmentVariables.BRIDGE_LOGGING_LEVEL,
          "stream": process.stdout
        },
        {
          "level": environmentVariables.BRIDGE_LOGGING_LEVEL,
          "path": "/var/log/bridge/ch-node-bridge.log"
        }
      ]
    },
    "authorization": {
      "authorize": false
    },
    "environmentVariableChecker": {
      "isEnabled": false
    }
  };

module.exports = config;

// eslint enable no-var
