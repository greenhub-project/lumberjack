const axios = require('axios')
const chalk = require('chalk')
const logSymbols = require('log-symbols')
const Conf = require('conf')


const greenhub = {
  statusUrl: 'http://hmatalonga.com/greenhub/status.json',

  testUrl: 'http://192.168.1.117:8080',

  config: new Conf(),

  description: chalk.bold.green('GreenHub Lumberjack') +
  ' - A command line app for interacting with the GreenHub REST API.',


  // Commands

  login: function(token, options) {
    if (! this.config.has('server')) {
      console.log(logSymbols.warning, 'Server URL is not defined')
      console.log('Please attempt to login again...')
      this.fetchServerUrl()
      return
    }
    if (this.config.has('token') && !options.reload) {
      console.log('Already logged in as', chalk.bold(this.config.get('name')))
      return
    }
    this.saveApiToken(token)
  },

  logout: function() {
    if (! this.config.has('token')) {
      console.log('Not logged in...')
    } else {
      this.config.delete('token')
      this.config.delete('name')
      console.log('Logout done!')
    }
  },

  remote: function(options) {
    if (options.fetch) {
      this.fetchServerUrl()
    } else {
      if (! this.config.has('server')) {
        console.log(logSymbols.warning, 'Server URL is not defined')
      } else {
        console.log(chalk.bold(this.config.get('server')))
      }
    }
  },

  token: function() {
    if (! this.config.has('token')) {
      console.log('Not logged in...')
    } else {
      console.log(chalk.bold(this.config.get('token')))
    }
  },

  whoami: function(options) {
    if (! this.config.has('token')) {
      console.log('Not logged in...')
    } else {
      if (this.config.has('user')) {
        this.displayUserInfo(this.config.get('user'), options.json)
      } else {
        console.log(chalk.blue('Fetching info from the server...'))
        axios.get(this.getApiUrl('/user', this.config.get('token')))
        .then(response => {
          if (response.data != null) {
            this.config.set('user', response.data)
            this.displayUserInfo(response.data, options.json)
          }
        })
      }
    }
  },

  // Helper functions

  fetchServerUrl: function() {
    console.log(chalk.blue('Fetching server URL...'))
    axios.get(this.statusUrl)
    .then(response => {
      console.log('Server URL found!')
      console.log(chalk.bold(response.data.server))
      this.config.set('server', response.data.server)
    })
    .catch(error => {
      console.log(
        logSymbols.error, chalk.red('Status server is not responding'), error
      )
    })
  },

  saveApiToken: function(token = '') {
    console.log(chalk.blue('Signing in to GreenHub API server...'))
    axios.get(this.getApiUrl('/user', token))
    .then(response => {
      if (response.data != null) {
        console.log(
          logSymbols.success,
          'You are now logged in as ' + chalk.bold(response.data.name)
        )
        this.config.set('token', token)
        this.config.set('user', response.data)
      }
    })
    .catch(error => {
      console.log(
        logSymbols.error, 'API token not valid'
      )
    })
  },

  displayUserInfo: function(user, isJson = false) {
    const status = user.verified ? logSymbols.success : logSymbols.error
    if (isJson) {
      console.log(JSON.stringify(user, null, '    '))
    } else {
      console.log(chalk.bold(user.name), status)
      console.log(user.email)
      console.log('Joined in', chalk.gray(user.created_at))
    }
  },

  getApiUrl: function(method = '', token = '', version = 1) {
    token = token === '' ? this.config.get('token') : token
    return this.testUrl + '/api/v' + version + method + '?api_token=' + token
  },
}

module.exports = greenhub
