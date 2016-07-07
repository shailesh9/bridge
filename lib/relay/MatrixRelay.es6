"use strict";

import {getFocusTemplate} from "../template/focusDocumentTemplate";
import merge from "merge-deep";
import {getPracticeId} from "../util/utils";

export class MatrixRelay {

  constructor({dbService, logger}) {
    this.dbService = dbService;
    this.loggerInstance = logger;
  }

  process(matrixData) {

    let {category, groupName, portletName, isPractice, lastUpdatedDate} = matrixData;

    if (!category || !groupName || !portletName) {
      console.log("Unable to Process Matrix data");
      throw new Error("Missing Dependencies for processing matrix data");
    }

    console.log("===========matrix data====>", matrixData);

    matrixData.componentData.forEach(matrixDataObj => {

      matrixDataObj.practitionerId = !isPractice ? matrixDataObj.practitionerId : getPracticeId();

      this._practitionerExists(matrixDataObj.practitionerId)
        .then(result => {
          if (result.length > 0) {
            console.log("_practitionerExists true =>>>>>>>>>>>>>>");

            let mergedMatrixDataObj = merge(matrixDataObj, {
              "category": category,
              "groupName": groupName,
              "portletName": portletName,
              "isPractice": isPractice
            });

            this._getGroupInfoPractitioner(mergedMatrixDataObj)
              .then(groupResult => {
                if (groupResult.length > 0) {
                  //  code if practitioner exists then replace the group
                  console.log("practitioner exists=====>");
                  let groupInfo = groupResult[0].group;

                  groupInfo = this._formatUpdatedGroupInfo(groupInfo, mergedMatrixDataObj);
                  groupInfo.title = mergedMatrixDataObj.groupName;
                  this._updateGroupInfo(groupInfo, mergedMatrixDataObj)
                    .then(() => {
                      console.log("====Going to _updateLastMatrixComputedDate ====>>>>>> ");
                      let collection = "users",
                        query = {
                          "_id": mergedMatrixDataObj.practitionerId
                        },
                        projection = {
                          "lastUpdatedDate": 1
                        };

                      this.dbService.getLastUpdatedDate({collection, query, projection})
                        .then(response => {
                          console.log("=====getLastUpdatedDate response =>>>>>> ", response);
                          let presentMatrixDate = typeof response
                            .lastUpdatedDate !== "undefined" ? new Date(response.lastUpdatedDate) : lastUpdatedDate;

                          if (presentMatrixDate <= lastUpdatedDate) {
                            console.log("=====last modified date present is smaller==>>>>");
                            this._updateLastMatrixComputedDate(collection, query, lastUpdatedDate);
                          }else {
                            console.log("===Last modified date present is greater than presentMatrixDate=>>>>>");
                          }
                        });
                    });
                }
              }
            );
          } else {
            console.log("_practitionerExists false =>>>>>>>>>>>>>>");
            //   create a new document for the practitioner and insert the document in focus.

            const template = getFocusTemplate();

            // ========== cloning the focus template object =============
            /* The first one is a way to clone complex json objects in a safer manner but has some performance hit
             // 1- focusTemplate = JSON.parse(JSON.stringify(template));  --- CORRECT
             // 2- focusTemplate = Object.assign(Object.prototype, template);  --- INCORRECT Not gonna work
             // 3- focusTemplate = Object.defineProperties({}, Object.getOwnPropertyDescriptors(template));
             -- above one CORRECT will work for complex obj
             // 4- focusTemplate = Object.create(template, Object.getOwnPropertyDescriptors(template)); -- CORRECT
             */
            let focusTemplate = {};

            // safest way to create complex objects clone
            focusTemplate = Object.defineProperties(
              Object.create(Object.prototype),
              Object.getOwnPropertyDescriptors(template)
            );

            // focusTemplate = Object.create(template, Object.getOwnPropertyDescriptors(template));
            // Generating a global pratice level user
            console.log("focus template modified object ===========> ");

            focusTemplate._id = !isPractice ? matrixDataObj.practitionerId : getPracticeId();

            if (lastUpdatedDate) {
              focusTemplate.lastUpdatedDate = lastUpdatedDate;
              console.log("==Added lastUpdate Field in matrix=>>>>>>>>>>>>>");
            }

            focusTemplate.dashboard[category].groups = this._formatGroupsInfo(matrixDataObj,
              {
                "category": category,
                "groupName": groupName,
                "portletName": portletName,
                "isPractice": isPractice
              }
            );

            // console.log("focus template modified object ===========> ", JSON.stringify(focusTemplate));
            this._insertDocumentPractitioner(focusTemplate);

            // ========= Batch Insertion of New Practitioner Document============
            // insertFocusDocuments.push(focusTemplate);
            //
            // console.log("focus insert document =======> " + JSON.stringify(insertFocusDocuments));
            //
            //
            // if (insertFocusDocuments.length > 0 && (loopIndex === matrixData.componentData.length - 1)) {
            //   console.log("inside the batch insertion ")
            //   this._insertDocumentPractitioner(insertFocusDocuments);
            // }
          }
        });

    }, this);

  }

  _updateGroupInfo(groupInfo, data) {
    let collection = "users",
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

  _updateLastMatrixComputedDate(collection, query, lastUpdateDate) {
    let document = {
      "$set": {
        "lastUpdatedDate": lastUpdateDate
      }
    };

    console.log("====== _updateLastMatrixComputedDate query", query);
    console.log("====== update document", JSON.stringify(document));

    this.dbService.update({collection, query, document})
      .then(() => {
        console.log("_updateLastMatrixComputedDate successfully updated");
      })
      .catch(err => {
        console.log("db error => ", err);
      });

  }

  /**
   *
   * @param {Object} data object for querying group level data
   * @returns {Promise} promise object for the query
   * @private
   */
  _getGroupInfoPractitioner(data) {
    let collection = "users",
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
      });
  }

  /**
   *@return {void}
   * @param {Object} document object for insertion in the Focus
   * @private
   */
  _insertDocumentPractitioner(document) {
    let collection = "users";

    this.dbService.insert({collection, document})
      .then(result => {
        console.log("inserted document================>", result);
      })
      .catch(err => {
        console.log("db error ====>>", err);
      });
  }

  _practitionerExists(practitionerId) {
    let collection = "users",
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
   * @param {Object} groupObj has the group level object for the portlet
   * @param {Object} data object modifies the previous portlet level object
   * @returns {Object} formatted griup level object
   * @private
   */
  _formatUpdatedGroupInfo(groupObj, data) {
    let formattedGroupObj = {};

    formattedGroupObj.title = data.groupName;
    formattedGroupObj.status = groupObj[0].status;
    formattedGroupObj.portlets = [];
    for (let portletObj of groupObj[0].portlets) {
      if (portletObj.title === data.portletName) {
        portletObj.component.data = data.data;
        portletObj.status = data.status;
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
    console.log("====_formatGroupsInfo======>>>>>>>>>>>>>>>>");

    let groupsInfo = getFocusTemplate().dashboard[templateDtls.category].groups,
      formattedGroupsInfo = [];

    for (let groupObj of groupsInfo) {
      if (groupObj.title.toLowerCase() === templateDtls.groupName.toLowerCase()) {
        let formattedGroupObj = {};

        formattedGroupObj.title = groupObj.title;
        formattedGroupObj.status = groupObj.status;
        formattedGroupObj.portlets = [];
        for (let portletObj of groupObj.portlets) {
          if (portletObj.title.toLowerCase() === templateDtls.portletName.toLowerCase()) {
            // Calculated matrix data is present within componentData-> data field
            portletObj.component.data = matrixData.data;
            portletObj.status = matrixData.status;
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
