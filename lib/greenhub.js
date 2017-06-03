'use strict';

const axios = require('axios');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const inquirer = require('inquirer');
const Conf = require('conf');
const moment = require('moment');
moment().format();


/*eslint no-console: ["error", { allow: ["log"] }] */

const greenhub = {
  description: chalk.bold.green('GreenHub Lumberjack') +
  ' - A command line app for interacting with the GreenHub REST API.',

  config: new Conf(),

  server: {
    url: {
      status: 'http://hmatalonga.com/greenhub/status.json'
    },
    errors: {
      failed: 'Server request has failed',
    }
  },

  // Commands

  count: function(model, filters, options) {
    if (! this.isLoggedIn()) return;

    let params = this.buildSearchParams(filters, options);

    // If seach params are empty then an error ocurred
    if (! Object.keys(params).length) return;

    console.log(chalk.blue('Fetching data from server...'));

    axios.get(this.makeUrl('/count/' + model), {
      params: this.bundleParams(params, '')
    })
    .then(response => {
      if (! options.json) {
        if (response.data.total !== undefined) {
          console.log(response.data.total);
        } else {
          response.data.errors.forEach(error => console.log(error));
        }
      } else {
        console.log(this.prettyPrint(response.data));
      }
    })
    .catch(error => {
      console.log(logSymbols.error, chalk.red(this.server.errors.failed));
      console.log(error.response.data);
    });
  },

  login: function(options) {
    if (! this.config.has('server')) {
      console.log(logSymbols.warning, 'Server URL is not defined');
      console.log('Please attempt to login again...');

      this.fetchServerUrl();
      return;
    }

    if (this.config.has('token') && ! options.reload) {
      console.log(
        'Already logged in as',
        chalk.bold(this.config.get('user').name)
      );
      return;
    }

    const questions = [
      {
        type: 'input',
        name: 'token',
        message: 'Enter your API token:'
      }
    ];

    inquirer.prompt(questions).then(answers => {
      this.saveApiToken(answers.token);
    });
  },

  logout: function() {
    if (! this.isLoggedIn()) return;

    const user = this.config.get('user');

    console.log('Logout done!');
    console.log('Goodbye', chalk.bold(user.name));

    this.config.delete('token');
    this.config.delete('user');
  },

  lumberjack: function(model, filters, options) {
    if (! this.isLoggedIn()) return;

    let params = this.buildSearchParams(filters, options);

    // If seach params are empty then an error ocurred
    if (! Object.keys(params).length) return;

    this.makeQuery(model, params);
  },

  remote: function(options) {
    if (options.fetch) {
      this.fetchServerUrl();
    } else {
      if (! this.config.has('server')) {
        console.log(logSymbols.warning, 'Server URL is not defined');
      } else {
        console.log(chalk.bold(this.config.get('server')));
      }
    }
  },

  token: function(options) {
    if (! this.isLoggedIn()) return;
    if (options.newToken) {
      console.log(chalk.blue('Performing request to the server...'));

      axios.post(this.makeUrl('/token/new'), this.bundleParams({}, ''))
      .then(response => {
        if (response.data != null) {
          this.config.set('token', response.data);
          console.log(
            logSymbols.success,
            'A new API token was generated! Keep it in a save place'
          );
          console.log(chalk.bold(response.data));
        }
      })
      .catch(error => {
        console.log(logSymbols.error, chalk.red(this.server.errors.failed));
        console.log(error.response.data);
      });
    } else {
      console.log(chalk.bold(this.config.get('token')));
    }
  },

  whoami: function(options) {
    if (! this.isLoggedIn()) return;

    if (this.config.has('user')) {
      this.displayUserInfo(this.config.get('user'), options.json);
    } else {
      console.log(chalk.blue('Fetching info from the server...'));

      axios.get(this.makeUrl('/user'), {
        params: this.bundleParams({}, '')
      })
      .then(response => {
        if (response.data != null) {
          this.config.set('user', response.data);
          this.displayUserInfo(response.data, options.json);
        }
      })
      .catch(error => {
        console.log(logSymbols.error, chalk.red(this.server.errors.failed));
        console.log(error.response.data);
      });
    }
  },

  // Helper functions

  fetchServerUrl: function() {
    console.log(chalk.blue('Fetching server URL...'));

    axios.get(this.server.url.status)
    .then(response => {
      console.log('Server URL found!');
      console.log(chalk.bold(response.data.server));

      this.config.set('server', response.data.server);
    })
    .catch(error => {
      console.log(logSymbols.error, chalk.red(this.server.errors.failed));
      console.log(error.response.data);
    });
  },

  saveApiToken: function(token) {
    console.log(chalk.blue('Signing in to GreenHub API server...'));

    axios.get(this.makeUrl('/user'), {
      params: this.bundleParams({}, token)
    })
    .then(response => {
      if (response.data != null) {
        console.log(
          logSymbols.success,
          'You are now logged in as ' + chalk.bold(response.data.name)
        );

        this.config.set('token', token);
        this.config.set('user', response.data);
      }
    })
    .catch(() => {
      console.log(
        logSymbols.error, 'API token not valid'
      );
    });
  },

  displayUserInfo: function(user, isJson) {
    const status = user.verified ? logSymbols.success : logSymbols.error;

    if (isJson) {
      console.log(this.prettyPrint(user));
    } else {
      console.log(chalk.bold(user.name), status);
      console.log(user.email);
      console.log('Joined in', chalk.gray(user.created_at));
    }
  },

  makeQuery: function(model, params) {
    console.log(chalk.blue('Fetching data from server...'));

    axios.get(this.makeUrl('/query/' + model), {
      params: this.bundleParams(params, '')
    })
    .then(response => {
      console.log(this.prettyPrint(response.data));

      let choices = ['Exit'];

      if (response.data.prev_page_url !== null) {
        choices.push('Previous page');
      }
      if (response.data.next_page_url !== null) {
        choices.push('Next page');
      }

      // Not enough choices available
      if (choices.length === 1) return;

      inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: choices.reverse(),
          filter: function (val) {
            return val.toLowerCase();
          }
        }
      ]).then(answers => {
        if (answers.action === 'exit') return;

        if (answers.action === 'previous page') {
          params.page -= 1;
        } else if (answers.action === 'next page') {
          params.page += 1;
        }

        this.makeQuery(model, params);
      });
    })
    .catch(error => {
      console.log(logSymbols.error, chalk.red(this.server.errors.failed));
      console.log(error.response.data);
    });
  },

  makeUrl: function(method) {
    return this.config.get('server') + '/api/v1' + method;
  },

  bundleParams: function(params, token) {
    params.cli = true;
    token = (token === undefined || token === '') ?
      this.config.get('token') : token;
    params.api_token = token;

    return params;
  },

  makeFilters: function(filters) {
    let result = {};

    filters.forEach(el => {
      let filter = el.split(':');
      result[filter[0]] = filter[1];
    });

    return result;
  },

  buildSearchParams: function(filters, options) {
    let params = {
      filters: this.makeFilters(filters)
    };

    if (options.date) {
      const validate = moment(options.date).isValid();
      if (validate) {
        params.date = options.date;
      } else {
        console.log(logSymbols.warning, 'Invalid `date` parameter!', options.date);
        return {};
      }
    } else if (options.last) {
      const pattern = /[1-9]+[0-9]*(m|w|d|h)/g;

      if (this.validateParam(options.last, pattern)) {
        params.last = options.last;
      } else {
        console.log(logSymbols.warning, 'Invalid `last` parameter!', options.last);
        return {};
      }
    } else if (options.range) {
      const dates = options.range.split('..');

      if (this.validateDateRange(dates) && options.range !== '..') {
        params.date_begin = dates[0];
        params.date_end = dates[1];
      } else {
        console.log(logSymbols.warning, 'Invalid `range` parameter!', options.range);
        return {};
      }
    }

    params.page = options.page;
    params.per_page = options.numItems;

    return params;
  },

  prettyPrint: function(elem) {
    return JSON.stringify(elem, null, '  ');
  },

  isLoggedIn: function() {
    if (! this.config.has('token')) {
      console.log('Not logged in...');
      return false;
    }
    return true;
  },

  // Validation

  validateParam: function(param, pattern) {
    const matches = param.match(pattern);

    return matches !== null && matches[0] === param;
  },

  validateDateRange: function(range) {
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

      return moment(range[0]).isValid() &&
        moment(range[1]).isValid() &&
        moment(range[0]).isBefore(range[1]);
    }
  }
};

module.exports = greenhub;
