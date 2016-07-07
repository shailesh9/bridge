"use strict";

import {getIterableObjectEntries} from "./util/utils";
import Q from "q";

class LegacyProcessor {

  constructor(dbService, focusMatrix, Ioc, mongoRelay, loggerInstance) {
    this.dbService_ = dbService;

    this.focusMatrix = focusMatrix;

    this.loggerInstance_ = loggerInstance;

    this.Ioc = Ioc;

    this.mongoRelay = mongoRelay;

  }

  start(message) {
    console.log("===================Legacy processor started ================================");
    let arrayMatrixPromises = [];

    for (const [, value] of getIterableObjectEntries(this.focusMatrix)) {

      let aggServiceInstance = this.Ioc
        .resolve(value)({
          "dbService": this.dbService_,
          "mongoRelay": this.mongoRelay,
          "logger": this.loggerInstance_
        }),
        lastModifieldDate = typeof JSON.parse(message)
          .lastUpdatedDate !== "undefined" ? JSON.parse(message).lastUpdatedDate : Date.now(),
        dateFormat = new Date(lastModifieldDate);

      if (!aggServiceInstance) {
        throw new Error("", `Aggregator service instance cannot be created for : ${value} matrix`);
      }
      /*eslint-disable */

      arrayMatrixPromises.push(aggServiceInstance.processByPractice.call(aggServiceInstance, dateFormat));
      arrayMatrixPromises.push(aggServiceInstance.processByPractitioner.call(aggServiceInstance, dateFormat));

      /*eslint-enable */
    }

    return this.processLegacyMatrixArray(arrayMatrixPromises);
  }

  processLegacyMatrixArray(arrayMatrixPromises) {

    console.log(`${LegacyProcessor.name} processLegacyMatrixArray() Promise Array===> `, arrayMatrixPromises);

    return Q.allSettled(arrayMatrixPromises)
      .then(result => {
        console.log(`All promises fulfilled in ${LegacyProcessor.name}.processLegacyMatrixArray()===> `, result);
      }, error => {
        console.log(`Rejected promise ${LegacyProcessor.name} processLegacyMatrixArray()===> `, error);
      })
      .catch(exception => {
        console.log(`Error in ${LegacyProcessor.name} processLegacyMatrixArray()===> `, exception);
      });
  }
}

export default LegacyProcessor;
