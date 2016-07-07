"use strict";

import Q from "q";
import loggerInstance from "../util/ApiLogger";

export class MongoChecker {

  constructor(dbService) {

    /** @member {Object} object to database. */
    this.dbService_ = dbService;
  }

  /**
   * check status of mongodb by pinging the mongodb server.
   * @returns {promise} promise object which checks where server is running properly.
   */
  mongoDbStatus() {

    loggerInstance.debug("MongoChecker->mongoDbStatus method");

    return this.dbService_
      .getMongoDBObject()
      .then(database => {
        let dbAdmin = database.admin();

        return Q.ninvoke(dbAdmin, "ping");
      });
  }
}
