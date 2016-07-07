"use strict";

import "babel-polyfill";

/**
 * Returns iterator for the passed object.
 * Thanks to dr. Axel Rauschmayer
 * https://leanpub.com/exploring-es6
 * @param {Object} obj The object to iterate through !!!Should be a data container!!!
 * @returns {Object} An iterator object which iterates through the keys of the passed object.
 */
export function getIterableObjectEntries(obj) {

  let index = 0;

  // In ES6, you can use strings or symbols as property keys,
  // Reflect.ownKeys() retrieves both
  const propKeys = Reflect.ownKeys(obj);

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {

      if (index < propKeys.length) {

        const key = propKeys[index];

        index++;
        return {
          "value": [key, obj[key]]
        };
      }

      return {
        "done": true
      };
    }
  };
}

export function getPracticeId() {

  return "practice-user";
}
