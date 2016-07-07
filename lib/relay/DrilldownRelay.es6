"use strict";

import {getdrillDownTemplate} from "../template/DrilldownDocumentTemplate";
import merge from "merge-deep";
import {getPracticeId} from "../util/utils";

export class DrilldownRelay {

  constructor({dbService, logger}) {
    this.dbService = dbService;
    this.loggerInstance = logger;
  }

  process(drillDownData) {

    console.log("==================drilldown in progress=====================");

    let {category, groupName, portletName, isPractice, lastUpdatedDate} = drillDownData;

    if (!category || !groupName || !portletName || !isPractice) {
      console.log("Unable to Process Matrix data");
      throw new Error("Missing Dependencies for processing matrix data");
    }

    drillDownData.drilldownData.forEach(drillDownDataObj => {

      drillDownDataObj.practitionerId = !isPractice ? drillDownDataObj.practitionerId : getPracticeId();

      this._practitionerExists(drillDownDataObj.practitionerId)
        .then(result => {
          if (result.length > 0) {

            let mergedDrillDownDataObj = merge(drillDownDataObj, {
              "category": category,
              "groupName": groupName,
              "portletName": portletName,
              "isPractice": isPractice
            });

            this._getGroupInfoPractitioner(mergedDrillDownDataObj)
              .then(groupResult => {
                if (groupResult.length > 0) {
                  //  code if practitioner exists then replace the group
                  console.log("practitioner exists=====>");
                  let groupInfo = groupResult[0].group;

                  groupInfo = this._formatUpdatedGroupInfo(groupInfo, mergedDrillDownDataObj);
                  groupInfo.title = mergedDrillDownDataObj.groupName;
                  this._updateGroupInfo(groupInfo, mergedDrillDownDataObj)
                    .then(() => {
                      let collection = "drilldown_data",
                        query = {
                          "_id": mergedDrillDownDataObj.practitionerId
                        },
                        projection = {
                          "lastUpdatedDate": 1
                        };

                      console.log("====Going to _updateLastDrillComputedDate ====>>>>>> ");
                      this.dbService.getLastUpdatedDate({collection, query, projection})
                        .then(response => {
                          console.log("=====getLastUpdatedDate response =>>>>>> ", response);
                          let presentMatrixDate = typeof response
                            .lastUpdatedDate !== "undefined" ? new Date(response.lastUpdatedDate) : lastUpdatedDate;

                          if (presentMatrixDate <= lastUpdatedDate) {
                            console.log("=====last modified date present is smaller==>>>>");
                            this._updateLastDrillComputedDate(collection, query, lastUpdatedDate);
                          }else {
                            console.log("===Last modified date present is greater than or equal to presentDate=>>>>>");
                          }
                        });
                    });
                }
              }
            );
          } else {
            //   create a new document for the practitioner and insert the document in focus.

            const template = getdrillDownTemplate();

            // ========== cloning the focus template object =============
            let focusTemplate = {};

            // safest way to create complex objects clone
            focusTemplate = Object.defineProperties(
              Object.create(Object.prototype),
              Object.getOwnPropertyDescriptors(template)
            );

            // Generating a global pratice level user
            focusTemplate._id = !isPractice ? drillDownDataObj.practitionerId : getPracticeId();

            if (lastUpdatedDate) {
              focusTemplate.lastUpdatedDate = lastUpdatedDate;
              console.log("==Added lastUpdate Field in drilldown=>>>>>>>>>>>>>", lastUpdatedDate);
            }

            focusTemplate.dashboard[category].groups = this._formatGroupsInfo(drillDownDataObj,
              {
                "category": category,
                "groupName": groupName,
                "portletName": portletName,
                "isPractice": isPractice
              }
            );

            console.log("focus template modified object ===========> ", JSON.stringify(focusTemplate));
            this._insertDocumentPractitioner(focusTemplate);

          }
        });

    }, this);

  }

  _updateGroupInfo(groupInfo, data) {
    let collection = "drilldown_data",
      query = {},
      document = {
        "$set": {}
      },
      nameMatcher = `dashboard.${data.category}.groups.title`,
      groupMatcher = `dashboard.${data.category}.groups.$`;

    query._id = data.practitionerId;
    query[nameMatcher] = data.groupName;

    document.$set[groupMatcher] = groupInfo;
    console.log("====== update query", query);
    console.log("====== update document", JSON.stringify(document));

    return this.dbService.update({collection, query, document})
      .then(() => {
        console.log("document successfully updated");
      })
      .catch(err => {
        console.log("db error => ", err);
      });
  }

  _updateLastDrillComputedDate(collection, query, lastUpdateDate) {
    let document = {
      "$set": {
        "lastUpdatedDate": lastUpdateDate
      }
    };

    console.log("====== _updateLastDrillComputedDate query", query);
    console.log("====== update document", JSON.stringify(document));

    this.dbService.update({collection, query, document})
      .then(() => {
        console.log("_updateLastDrillComputedDate successfully updated");
      })
      .catch(err => {
        console.log("db error => ", err);
      });

  }

  /**
   *@return {void}
   * @param {Object} document object for insertion in the Focus
   * @private
   */
  _insertDocumentPractitioner(document) {
    let collection = "drilldown_data";

    this.dbService.insert({collection, document})
      .then(result => {
        console.log("inserted document================>", result);
      })
      .catch(err => {
        console.log("db error ====>>", err);
      });
  }

  _practitionerExists(practitionerId) {
    let collection = "drilldown_data",
      query = {
        "body": {
          "_id": practitionerId
        }
      };

    return this.dbService.read({collection, query})
      .then(result => {
        return result;
      })
      .catch(err => {
        console.log("db error", err);
      });
  }

  /**
   *
   * @param {Object} data object for querying group level data
   * @returns {Promise} promise object for the query
   * @private
   */
  _getGroupInfoPractitioner(data) {
    let collection = "drilldown_data",
      pipeline = [
        {
          "$match": {
            "_id": data.practitionerId
          }
        },
        {
          "$project": {

          }
        },
        {
          "$project": {
            "group": {
              "$filter": {
                "as": "group",
                "cond": {
                  "$eq": [
                    "$$group.title",
                    data.groupName
                  ]
                }
              }
            }
          }
        }
      ];

    pipeline[1].$project[`${data.category}`] = `$dashboard.${data.category}`;
    pipeline[2].$project.group.$filter.input = `$${data.category}.groups`;

    return this.dbService.aggregate({collection, pipeline})
      .then(result => {
        return result;
      })
      .catch(err => {
        console.log("db error ====>>", err);
      }
    );
  }

  /**
   *
   * @param {Object} groupObj has the group level object for the portlet
   * @param {Object} data object modifies the previous portlet level object
   * @returns {Object} formatted griup level object
   * @private
   */
  _formatUpdatedGroupInfo(groupObj, data) {
    let formattedGroupObj = {};

    formattedGroupObj.title = data.groupName;
    formattedGroupObj.portlets = [];
    for (let portletObj of groupObj[0].portlets) {
      if (portletObj.title === data.portletName) {
        portletObj.drillDown.data = data.data;
      }
      formattedGroupObj.portlets.push(portletObj);
    }
    return formattedGroupObj;
  }

  /**
   *
   * @param {Object} matrixData object for the formatting of template
   * @param {Object} templateDtls object for the focus template
   * @returns {Array} returns griup level array og objects
   * @private
   */
  _formatGroupsInfo(matrixData, templateDtls) {

    let groupsInfo = getdrillDownTemplate().dashboard[templateDtls.category].groups,
      formattedGroupsInfo = [];

    for (let groupObj of groupsInfo) {
      if (groupObj.title.toLowerCase() === templateDtls.groupName.toLowerCase()) {
        let formattedGroupObj = {};

        formattedGroupObj.title = groupObj.title;
        formattedGroupObj.portlets = [];
        for (let portletObj of groupObj.portlets) {
          if (portletObj.title.toLowerCase() === templateDtls.portletName.toLowerCase()) {
            // Calculated matrix data is present within componentData-> data field
            portletObj.drillDown.data = matrixData.data;
          }
          formattedGroupObj.portlets.push(portletObj);
        }
        formattedGroupsInfo.push(formattedGroupObj);
      } else {
        formattedGroupsInfo.push(groupObj);
      }
    }
    return formattedGroupsInfo;
  }
}
