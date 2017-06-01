'use strict';

const axios = require('axios');
const chalk = require('chalk');
const logSymbols = require('log-symbols');
const Conf = require('conf');

/*eslint no-console: ["error", { allow: ["log"] }] */

const greenhub = {
  version: '1.0.0',

  description: chalk.bold.green('GreenHub Lumberjack') +
  ' - A command line app for interacting with the GreenHub REST API.',

  config: new Conf(),

  server: {
    url: {
      status: 'http://hmatalonga.com/greenhub/status.json',
      test: 'http://192.168.1.105:8080',
    },
    errors: {
      failed: 'Server request has failed',
    }
  },

  // Commands

  count: function(model = '', options = null) {
    const params = {};

    console.log(chalk.blue('Fetching data from server...'));

    if (options.last) {
      const validate = options.last.match(/[1-9]+[0-9]*(m|w|d|h)/g) !== null;

      if (validate) {
        params.last = options.last;
      } else {
        console.log(logSymbols.warning, 'Invalid parameter!', options.last);
        return;
      }
    } else if (options.range) {
      params.range = options.range;
    }

    axios.get(this.makeUrl('/count/' + model), {
      params: this.makeParams(params)
    })
    .then(response => {
      if (response.data.total != undefined && !options.json) {
        console.log(response.data.total);
      } else {
        console.log(this.prettyPrint(response.data));
      }
    })
    .catch(error => {
      console.log(logSymbols.error, chalk.red(this.server.errors.failed));
      console.log(error.response.data);
    });
  },

  login: function(token = '', options = null) {
    if (! this.config.has('server')) {
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

    this.saveApiToken(token);
  },

  logout: function() {
    if (! this.config.has('token')) {
      console.log('Not logged in...');
    } else {
      this.config.delete('token');
      this.config.delete('user');

      console.log('Logout done!');
    }
  },

  remote: function(options = null) {
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

  token: function() {
    if (! this.config.has('token')) {
      console.log('Not logged in...');
    } else {
      console.log(chalk.bold(this.config.get('token')));
    }
  },

  whoami: function(options = null) {
    if (! this.config.has('token')) {
      console.log('Not logged in...');
    } else {
      if (this.config.has('user')) {
        this.displayUserInfo(this.config.get('user'), options.json);
      } else {
        console.log(chalk.blue('Fetching info from the server...'));

        axios.get(this.makeUrl('/user'), {
          params: this.makeParams()
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

  saveApiToken: function(token = '') {
    console.log(chalk.blue('Signing in to GreenHub API server...'));

    axios.get(this.makeUrl('/user'), {
      params: this.makeParams()
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
    .catch(error => {
      console.log(
        logSymbols.error, 'API token not valid', error.data
      );
    });
  },

  displayUserInfo: function(user, isJson = false) {
    const status = user.verified ? logSymbols.success : logSymbols.error;

    if (isJson) {
      console.log(this.prettyPrint(user));
    } else {
      console.log(chalk.bold(user.name), status);
      console.log(user.email);
      console.log('Joined in', chalk.gray(user.created_at));
    }
  },

  makeUrl: function(method = '', version = 1) {
    return this.server.url.test + '/api/v' + version + method;
  },

  makeParams: function(params = {}, token = '') {
    params.cli = true;
    params.api_token = token === '' ? this.config.get('token') : token;

    return params;
  },

  prettyPrint: function(el, format = '    ') {
    return JSON.stringify(el, null, format);
  }
};

module.exports = greenhub;
