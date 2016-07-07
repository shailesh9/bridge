"use strict";

export function getFocusTemplate() {

  let focusDocTemplate = {

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
                "component": {
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Losses by payer",
                "component": {
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
                "component": {
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Cataract Conversion Rate",
                "component": {
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
                "component": {
                  "data": []
                }
              },
              {
                "status": 0,
                "title": "Referral Mix",
                "component": {
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
                "component": {
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
                "component": {
                  "data": []
                }
              }
            ]
          }
        ]
      }
    }
  };

  return focusDocTemplate;
}
