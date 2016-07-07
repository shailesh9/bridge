"use strict";

import {EventEmitter} from "events";
import {DrilldownRelay} from "../relay/DrilldownRelay";
import {MatrixRelay} from "../relay/MatrixRelay";
import {DashboardRelay} from "../relay/DashboardRelay";

export class MongoRelay extends EventEmitter {

  constructor({dbService, logger}) {
    super();

    this.dbService = dbService;
    this.loggerInstance = logger;
    let matrixRelay = new MatrixRelay({dbService, logger}),
      drillDownRelay = new DrilldownRelay({dbService, logger}),
      dashboardRelay = new DashboardRelay({dbService, logger});

    this.on("drilldown computed", drillDownRelay.process.bind(drillDownRelay));
    this.on("matrix computed", matrixRelay.process.bind(matrixRelay));
    this.on("dashboard computed", dashboardRelay.process.bind(dashboardRelay));
  }
}
