"use strict";

export function getdrillDownTemplate() {

  let drilldownDocTemplate = {

    "_id": "",
    "dashboard": {
      "leadership": {},
      "financial": {
        "groups": [
          {
            "title": "No show losses",
            "status": 0,
            "portlets": [
              {
                "status": 0,
                "title": "Losses by location",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Losses by payer",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              }
            ]
          }
        ]
      },
      "clinical": {
        "groups": [
          {
            "title": "Clinical Conversion",
            "status": 0,
            "portlets": [
              {
                "status": 0,
                "title": "Lasik Conversion Rate",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Cataract Conversion Rate",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              }
            ]
          }
        ]
      },
      "utilization": {
        "groups": [
          {
            "title": "Referrals",
            "status": 0,
            "portlets": [
              {
                "status": 0,
                "title": "External referral by payer",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Referral Mix",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              }
            ]
          }
        ]
      },
      "operational": {
        "groups": [
          {
            "title": "Average Wait Time",
            "status": 0,
            "portlets": [
              {
                "status": 0,
                "title": "Average Waiting Time/Location",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              }
            ]
          }
        ]
      },
      "statutory": {
        "groups": [
          {
            "title": "Timely consults",
            "status": 0,
            "portlets": [
              {
                "status": 0,
                "title": "Timely diabetic consult",
                "drillDown": {
                  "col": [],
                  "data": []
                }
              }
            ]
          }
        ]
      }
    }
  };

  return drilldownDocTemplate;
}
