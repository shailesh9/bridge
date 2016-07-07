"use strict";

import {MongoChecker} from "./MongoDB/MongoChecker";
import getMongoDbService from "./MongoDB/MongoDbService";
import logger from "./util/ApiLogger";
import {QueueService} from "./QueueService";
import bridgeService from "ch-bridge-services";
import LegacyProcessor from "./LegacyProcessor";
import RealTimeProcessor from "./RealTimeProcessor";
import eventReg from "ch-event-registry";
import {MongoRelay} from "./MongoDB/MongoRelay";
import Q from "q";

let {NODE_ENV} = process.env,
  nodeEnv = NODE_ENV || "local",
  config = Object.freeze(require("../config/" + nodeEnv)),
  dbService = getMongoDbService({config, logger}),
  rabbitConfig = config.rabbitMQ,
  mongoChecker = new MongoChecker(dbService),
  Ioc = bridgeService.Ioc,
  mongoRelay = new MongoRelay({dbService, logger}),
  legacyProcessor = new LegacyProcessor(dbService, eventReg.focusMatrix, Ioc, mongoRelay, logger),
  realtimeProcessor = new RealTimeProcessor(dbService, Ioc, mongoRelay, logger),
  queueService = new QueueService({rabbitConfig, legacyProcessor, realtimeProcessor, logger});

function startMongoDBPolling() {

  return Q.Promise((resolve, reject) => {
    setInterval(() => {
      mongoChecker.mongoDbStatus()
        .then(pingResult => {
          logger.debug("Mongodb up and running: " + JSON.stringify(pingResult));
          resolve();
        }, err => {
          logger.debug("Error in connecting to Mongodb", err);
          reject();
        });
    }, 1000);
  });
}

startMongoDBPolling()
  .then(() => {
    console.log("====================MongoDB Polling Started========================");

    queueService.consume()
      .then(() => {
        console.log("====================RabbitMQ Message Consume Started========================");
      })
      .catch(err => {
        console.log(`Error occured in ${queueService}.consume()`, err);
      });

  })
  .catch(err => {
    console.log("Error occured in startMongoDBPolling()", err);
  });
