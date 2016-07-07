"use strict";

import {getDashboardTemplate} from "../template/DashboardDocumentTemplate";

export class DashboardRelay {

  constructor({dbService, logger}) {
    this.dbservice = dbService;
    this.loggerInstance = logger;
  }

  process(leadershipData) {

    console.log("dashboard relay in progress=================");

    this._leadershipExists()
      .then(result => {
        if (result.length > 0) {
          console.log("leadership exists ==> ", leadershipData);
          this._updateLeadershipDocument(leadershipData)
            .then(updateResult => {
              if (updateResult.result.nModified) {
                console.log("leadership document updated =>> ");
              }
              let collection = "leadership",
                query = {
                  "name": "leadership"
                },
                projection = {
                  "lastUpdatedDate": 1
                };

              this.dbservice.getLastUpdatedDate({collection, query, projection})
                .then(response => {
                  console.log("=====getLastUpdatedDate response =>>>>>> ", response);
                  let presentMatrixDate = typeof response
                    .lastUpdatedDate !== "undefined" ? new Date(response.lastUpdatedDate) : leadershipData
                    .lastUpdatedDate;

                  if (presentMatrixDate <= leadershipData.lastUpdatedDate) {
                    console.log("=====last modified date present is smaller==>>>>");
                    this._updateLeadershipModifiedDate(collection, query, leadershipData.lastUpdatedDate);
                  }else {
                    console.log("======Last modified date present is greater than presentMatrixDate===>>>>>>");
                  }
                });
            });
        } else {
          console.log("leadership doesn't exists");
          this._insertLeadershipDocument(leadershipData)
            .then(insertResult => {
              console.log("leadership document inserted", insertResult);
            })
            .catch(err => {
              console.log("db error", err);
            });
        }
      })
      .catch(err => {
        console.log("error in leadershipExists=>", err);
      });
  }

  _leadershipExists() {
    let collection = "leadership",
      query = {
        "name": "leadership"
      };

    return this.dbservice.read({collection, query})
      .then(result => {
        return result;
      })
      .catch(err => {
        return err;
      });
  }

  _insertLeadershipDocument(leadershipData) {
    let collection = "leadership",
      document = Object.defineProperties(
      Object.create(Object.prototype),
      Object.getOwnPropertyDescriptors(getDashboardTemplate())
    );

    document.dashboard.leadership[leadershipData.leadership] = leadershipData.data;
    document.lastUpdatedDate = leadershipData.lastUpdatedDate;
    console.log("leadership data for insertion === >", document);
    return this.dbservice.insert({collection, document})
      .then(result => {
        console.log("insert leadership =====> ", result);
        return result;
      })
      .catch(err => {
        console.log("insert leadership err=====> ", err);
        return err;
      });
  }

  _updateLeadershipDocument(leadershipData) {
    let collection = "leadership",
      query = {
        "name": "leadership"
      },
      document = {
        "$set": {}
      },
      categorySelection = `dashboard.leadership.${leadershipData.leadership}`;

    console.log("category selection ===>", categorySelection);
    document.$set[categorySelection] = leadershipData.data;
    console.log("leadership data for update ===> ", JSON.stringify(document));
    console.log("query for update=======>", JSON.stringify(query));

    return this.dbservice.update({collection, query, document})
      .then(result => {
        console.log("========_updateLeadershipDocument query finish== >>> ");
        return result;
      })
      .catch(err => {
        return err;
      });
  }
  _updateLeadershipModifiedDate(collection, query, lastUpdateDate) {
    let document = {
      "$set": {
        "lastUpdatedDate": lastUpdateDate
      }
    };

    console.log("_updateLeadershipModifiedDate data for update ===> ", JSON.stringify(document));
    console.log("query for update=======>", JSON.stringify(query));

    return this.dbservice.update({collection, query, document})
      .then(result => {
        console.log("_updateLeadershipModifiedDate Date updated Successfully");
        return result;
      })
      .catch(err => {
        return err;
      });
  }
}
