'use strict';

const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const inquirer = require('inquirer');
const opn = require('opn');
const Conf = require('conf');
const utils = require('./utils');

/*eslint no-console: ["error", { allow: ["log"] }] */

const log = (...message) => {
  console.log();
  console.log(...message, '\n');
};

const greenhub = {
  description:
    chalk.bold.green('GreenHub Lumberjack') +
    ' - A command line app for interacting with the GreenHub REST API.\n\n' +
    chalk.gray('  To learn more about the GreenHub project visit ') +
    chalk.bold.gray('https://greenhubproject.org'),

  config: new Conf(),

  server: {
    url: {
      status: 'https://greenhubproject.org/status.json',
      development: 'http://192.168.1.105:8080'
    },
    errors: {
      failed: 'Server request has failed',
      not: 'Server is not responding...',
      invalid: 'Server response output is not valid!'
    },
    api: {
      version: 1
    }
  },

  timeout: 10000,

  // Commands

  count(model, filters, options) {
    if (!this.isLoggedIn()) return;

    let params = this.buildSearchParams(filters, options);

    // If seach params are empty then an error ocurred
    if (!Object.keys(params).length) return;

    console.log(chalk.blue('Fetching data from the server...'));

    axios
      .get(this.makeUrl('count/' + model), {
        params: this.bundleParams(params)
      })
      .then(response => {
        if (!options.json) {
          if (response.data.total !== undefined) {
            console.log(response.data.total);
          } else {
            response.data.errors.forEach(error => console.log(error));
          }
        } else {
          console.log(utils.prettyPrint(response.data));
        }
      })
      .catch(error => {
        console.log(logSymbols.error, chalk.red(this.server.errors.failed));
        console.log(error.response.data);
      });
  },

  docs() {
    console.log(chalk.blue('Opening docs in the default web-browser...'));
    opn('http://greenhub.hmatalonga.com/docs/intro/overview');
  },

  export(model, filters, options) {
    if (!this.isLoggedIn()) return;

    if (!options.output.endsWith('.csv')) {
      log(logSymbols.error, chalk.red('filename with wrong extension!'));
      return;
    }

    let params = this.buildSearchParams(filters, options);

    // If seach params are empty then an error ocurred
    if (!Object.keys(params).length) return;

    this.makeExport(model, params, options.timeout);
  },

  list(options) {
    if (!this.isLoggedIn()) return;

    axios
      .get(this.makeUrl('models'), {
        params: this.bundleParams()
      })
      .then(response => {
        if (!options.json) {
          console.log(response.data.data.join(', '));
        } else {
          console.log(utils.prettyPrint(response.data));
        }
      })
      .catch(() => {
        console.log(logSymbols.error, chalk.red(this.server.errors.not));
      });
  },

  login(options) {
    if (!this.config.has('server')) {
      console.log(logSymbols.warning, 'Server URL is not defined');
      console.log('Please attempt to login again...');

      this.fetchServerUrl();
      return;
    }

    if (this.config.has('token') && !options.reload) {
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

  logout() {
    if (!this.isLoggedIn()) return;

    const user = this.config.get('user');

    console.log('Logout done!');
    console.log('Goodbye', chalk.bold(user.name));

    this.config.delete('token');
    this.config.delete('user');
  },

  lumberjack(model, filters, options) {
    if (!this.isLoggedIn()) return;

    if (options.output && !options.output.endsWith('.json')) {
      console.log(
        logSymbols.error,
        chalk.red('filename with wrong extension!')
      );
      return;
    }

    let params = this.buildSearchParams(filters, options);

    // If seach params are empty then an error ocurred
    if (!Object.keys(params).length) return;

    this.makeQuery(model, params, options.timeout);
  },

  remote(options) {
    if (options.fetch) {
      this.fetchServerUrl();
    } else {
      if (!this.config.has('server')) {
        console.log(logSymbols.warning, 'Server URL is not defined');
      } else {
        console.log(chalk.bold(this.config.get('server')));
      }
    }
  },

  status(options) {
    if (!this.config.has('server')) {
      console.log(logSymbols.warning, 'Server URL is not defined');
      return;
    }

    console.log(chalk.blue('Checking API server if is available...'));

    axios
      .get(this.makeUrl('status'), {
        timeout: Math.min(options.timeout * 1000, 60000)
      })
      .then(response => {
        console.log(logSymbols.success, response.data.status);
      })
      .catch(() => {
        console.log(logSymbols.error, chalk.red(this.server.errors.not));
      });
  },

  token(options) {
    if (!this.isLoggedIn()) return;
    if (options.newToken) {
      console.log(chalk.blue('Performing request to the server...'));

      axios
        .post(this.makeUrl('token/new'), this.bundleParams())
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

  whoami(options) {
    if (!this.isLoggedIn()) return;

    if (this.config.has('user')) {
      this.displayUserInfo(this.config.get('user'), options.json);
    } else {
      console.log(chalk.blue('Fetching info from the server...'));

      axios
        .get(this.makeUrl('user'), {
          params: this.bundleParams(),
          headers: {
            Authorization: 'Bearer ' + this.config.get('token')
          }
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

  fetchServerUrl() {
    console.log(chalk.blue('Fetching server URL...'));

    if (process.env.NODE_ENV === 'development') {
      console.log('Development Server URL found!');
      this.config.set('server', this.server.url.development);
      return;
    }

    axios
      .get(this.server.url.status)
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

  saveApiToken(token) {
    console.log(chalk.blue('Signing in to GreenHub API server...'));

    axios
      .get(this.makeUrl('user'), {
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
        console.log(logSymbols.error, 'API token not valid');
      });
  },

  displayUserInfo(user, isJson) {
    const status = user.verified ? logSymbols.success : logSymbols.error;

    if (isJson) {
      console.log(utils.prettyPrint(user));
    } else {
      console.log(chalk.bold(user.name), status);
      console.log(user.email);
      console.log('Joined in', chalk.gray(user.created_at));
    }
  },

  makeExport(model, params, timeout) {
    console.log(chalk.blue('Fetching data from the server...'));

    params.export = true;

    axios
      .get(this.makeUrl(model), {
        params: this.bundleParams(params),
        timeout: Math.min(timeout * 1000, 60000) // limit timeout to 1min
      })
      .then(response => {
        if (response.data === null) {
          console.log(logSymbols.error, chalk.red(this.server.errors.invalid));
          return;
        }
        fs.writeFile(params.output, response.data, function(err) {
          if (err) return console.log(logSymbols.error, err);
          console.log(
            logSymbols.success,
            chalk.bold(params.output),
            'created!'
          );
        });
      })
      .catch(error => {
        console.log(error);
        console.log(logSymbols.error, chalk.red(this.server.errors.failed));
        console.log('Maybe', chalk.bold(model), "model doesn't exist...");
        console.log('\nAvailable models:');
        this.list({});
      });
  },

  makeQuery(model, params, timeout) {
    console.log(chalk.blue('Fetching data from the server...'));

    axios
      .get(this.makeUrl(model), {
        params: this.bundleParams(params),
        timeout: Math.min(timeout * 1000, 60000) // limit timeout to 1min
      })
      .then(response => {
        if (params.output) {
          const contents = !params.all
            ? JSON.stringify(response.data.data, null, '  ')
            : JSON.stringify(response.data, null, '  ');

          if (contents === null) {
            console.log(
              logSymbols.error,
              'An error occurred reading the results'
            );
            return;
          }

          fs.writeFile(params.output, contents, function(err) {
            if (err) return console.log(logSymbols.error, err);
            console.log(
              logSymbols.success,
              chalk.bold(params.output),
              'created!'
            );
          });

          return;
        } else {
          console.log(utils.prettyPrint(response.data));
        }

        if (params.all) return;

        let choices = ['Exit'];

        if (response.data.links.prev !== null) {
          choices.push('Previous page');
        }
        if (response.data.links.next !== null) {
          choices.push('Next page');
        }

        // Not enough choices available
        if (choices.length === 1) return;

        inquirer
          .prompt([
            {
              type: 'list',
              name: 'action',
              message: 'What would you like to do?',
              choices: choices.reverse(),
              filter: val => val.toLowerCase()
            }
          ])
          .then(answers => {
            if (answers.action === 'exit') return;

            if (answers.action === 'previous page') {
              params.page -= 1;
            } else if (answers.action === 'next page') {
              params.page += 1;
            }

            this.makeQuery(model, params);
          });
      })
      .catch(() => {
        console.log(logSymbols.error, chalk.red(this.server.errors.failed));
        console.log('Maybe', chalk.bold(model), "model doesn't exist...");
        console.log('\nAvailable models:');
        this.list({});
      });
  },

  makeUrl(method) {
    // Prepend / to method name first
    method = '/' + method;
    if (process.env.NODE_ENV === 'development') {
      return (
        this.server.url.development +
        '/api/v' +
        this.server.api.version +
        method
      );
    }
    return (
      this.config.get('server') + '/api/v' + this.server.api.version + method
    );
  },

  bundleParams(params = {}, token = '') {
    params.cli = true;
    params.api_token = token === '' ? this.config.get('token') : token;

    return params;
  },

  makeFilters(filters) {
    let result = {};

    filters.forEach(el => {
      let filter = el.split(':');
      result[filter[0]] = filter[1];
    });

    return result;
  },

  buildSearchParams(filters = [], options) {
    let params = {};

    if (filters.length > 0) {
      params.filters = this.makeFilters(filters);
    }

    if (options.date) {
      const validate = utils.isDateValid(options.date);
      if (validate) {
        params.date = options.date;
      } else {
        console.log(
          logSymbols.warning,
          'Invalid `date` parameter!',
          options.date
        );
        return {};
      }
    } else if (options.last) {
      const pattern = /[1-9]+[0-9]*(m|w|d|h)/g;

      if (utils.validateParam(options.last, pattern)) {
        params.last = options.last;
      } else {
        console.log(
          logSymbols.warning,
          'Invalid `last` parameter!',
          options.last
        );
        return {};
      }
    } else if (options.range) {
      const dates = options.range.split('..');

      if (utils.validateDateRange(dates) && options.range !== '..') {
        params.date_begin = dates[0];
        params.date_end = dates[1];
      } else {
        console.log(
          logSymbols.warning,
          'Invalid `range` parameter!',
          options.range
        );
        return {};
      }
    }

    if (options.everything) {
      params.everything = options.everything;
    } else if (options.with) {
      const list = options.with.split(' ');

      if (list.length === 0) {
        console.log(
          logSymbols.warning,
          'Invalid `with` parameter!',
          options.with
        );
        return {};
      } else if (list.includes('all')) {
        params.everything = true;
      } else {
        params.with = list;
      }
    }

    if (options.all) {
      params.all = options.all;
    }

    if (options.output) {
      params.output = options.output;
    }

    params.page = options.page;
    params.per_page = options.numItems;

    return params;
  },

  isLoggedIn() {
    if (!this.config.has('token')) {
      console.log('Not logged in...');
      return false;
    }
    return true;
  }
};

module.exports = greenhub;
