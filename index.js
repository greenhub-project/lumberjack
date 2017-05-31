#!/usr/bin/env node

'use strict';

const program = require('commander')
const greenhub = require('./greenhub')

program
  .version(greenhub.version)
  .description(greenhub.description)

program
  .command('count <model>')
  .alias('c')
  .description('return total number of records from specified model <devices, samples>')
  .option('-j, --json', 'output result in JSON')
  .option('-L, --last <interval>', 'amount of time interval of last <m>onth, <w>eek,<d>ay or <h>our')
  .option('-R, --range [from]..[to]', 'time range of query in `yyyy-mm-dd` date format, optional arguments')
  .action((model, options) => greenhub.count(model, options))
  .on('--help', function() {
    console.log('  Examples:')
    console.log()
    console.log('    $ greenhub count devices                           # all records')
    console.log('    $ greenhub count samples --last 12h                # records of the last 12 hours')
    console.log('    $ greenhub count devices -L 5d --json              # records of the last 5 days in json')
    console.log('    $ greenhub count samples -R 2017-05-01:2017-05-31  # records between 2017-05-01 and 2017-05-31')
    console.log('    $ greenhub count samples --range 2017-03-15:       # records from 2017-03-15 to current date')
    console.log('    $ greenhub count samples --range :2017-02-01       # records before 2017-02-01')
    console.log()
  })

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
  .command('lumberjack <model> [params...]')
  .alias('j')
  .description('flexible query builder that exports to different formats')
  .option('-A, --ascii', 'display on the stdin in ascii')
  .option('-H, --html', 'export to html file')
  .option('-L, --last <val><interval>', 'value of time interval of last <m>onth, <w>eek,<d>ay or <h>our')
  .option('-R, --range [from]..[to]', 'time range of query in `yyyy-mm-dd` date format, optional arguments')
  .action((model, params, options) => console.log(params))
  .on('--help', function() {
    console.log('  Examples:')
    console.log()
    console.log('    $ greenhub lumberjack devices brand:google  # params have the format [name:value]')
    console.log()
  })

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
  .option('-j, --json', 'output result in JSON')
  .action((options) => greenhub.whoami(options))


program.parse(process.argv)
