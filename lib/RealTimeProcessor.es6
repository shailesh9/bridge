"use strict";

import Q from "q";

class RealTimeProcessor {

  constructor(dbService, Ioc, mongoRelay, loggerInstance) {
    this.dbService_ = dbService;

    this.loggerInstance_ = loggerInstance;

    this.Ioc = Ioc;

    this.mongoRelay = mongoRelay;

  }

  start(focusMatrixArray, message) {
    console.log("===================RealTime processor started ================================");
    let arrayMatrixPromises = [];

    focusMatrixArray.forEach(value => {
      console.log("====Realtime==focusMatrixArray ", value);

      if (value) {

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
    });

    return this.processRealTimeMatrixArray(arrayMatrixPromises);
  }

  processRealTimeMatrixArray(arrayMatrixPromises) {

    console.log(`${RealTimeProcessor.name} processRealTimeMatrixArray() Promise Array===> `, arrayMatrixPromises);

    return Q.allSettled(arrayMatrixPromises)
      .then(result => {
        console.log(`All promises fulfilled in ${RealTimeProcessor.name}.processRealTimeMatrixArray()===> `, result);
      }, error => {
        console.log(`Rejected promise ${RealTimeProcessor.name} processRealTimeMatrixArray()===> `, error);
      })
      .catch(exception => {
        console.log(`Error in ${RealTimeProcessor.name} processRealTimeMatrixArray()===> `, exception);
      });
  }
}

export default RealTimeProcessor;
