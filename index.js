#!/usr/bin/env node

'use strict';

const program = require('commander')
const greenhub = require('./greenhub')

program
  .version('1.0.0')
  .description(greenhub.description)

program
  .command('login <token>')
  .description('login with an user API token key')
  .option('-r --reload', 'reload login credentials')
  .action((token, options) => greenhub.login(token, options))

program
  .command('logout')
  .description('logout any user API credentials')
  .action(() => greenhub.logout())

program
  .command('lumberjack')
  .description('flexible query builder that exports to different formats')
  .option('-A, --ascii', 'display on the stdin in ascii')
  .option('-H, --html', 'export to html file')
  .option('-m, --model [name]', 'select the model to query [samples, devices]')
  .action(options => console.log(greenhub.config))

program
  .command('remote')
  .description('display the current GreenHub API server URL')
  .option('-f --fetch', 'fetch server url')
  .action(options => greenhub.remote(options))

program
  .command('token')
  .description('display user API token key')
  .action(() => greenhub.token())

program
  .command('whoami')
  .description('display information about the logged user')
  .action(() => greenhub.whoami())


program.parse(process.argv)
