'user strict';

const logSymbols = require('log-symbols');
const moment = require('moment');
moment().format();

/*eslint no-console: ["error", { allow: ["log"] }] */

function isDateValid(date) {
  return moment(date).isValid();
}

function validateParam(param, pattern) {
  const matches = param.match(pattern);
  return matches !== null && matches[0] === param;
}

function validateDateRange(range) {
  if (range.length !== 2) return false;

  if (range[0] === '') {
    return moment(range[1]).isValid();
  } else if (range[1] === '') {
    return moment(range[0]).isValid();
  } else {
    if (moment(range[0]).isSame(range[1])) {
      console.log(
        logSymbols.error,
        'Dates cannot be the same. Use option --date for single dates instead'
      );
      return false;
    }

    return (
      moment(range[0]).isValid() &&
      moment(range[1]).isValid() &&
      moment(range[0]).isBefore(range[1])
    );
  }
}

function prettyPrint(elem) {
  return JSON.stringify(elem, null, '  ');
}

module.exports = {
  isDateValid,
  validateParam,
  validateDateRange,
  prettyPrint
};
