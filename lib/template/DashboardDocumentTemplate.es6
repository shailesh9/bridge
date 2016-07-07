"use strict";

import {getPracticeId} from "../util/utils";

export function getDashboardTemplate() {
  return {
    "_id": getPracticeId(),
    "name": "leadership",
    "dashboard": {
      "leadership": {
        "f": {

        },
        "o": {

        },
        "c": {

        },
        "u": {

        },
        "s": {

        },
        "outliers": {

        }
      }
    }
  };
}
