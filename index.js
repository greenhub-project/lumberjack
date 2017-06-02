#!/usr/bin/env node

'use strict';

const program = require('commander');
const greenhub = require('./lib/greenhub');
const updateNotifier = require('update-notifier');
const pkg = require('./package.json');


// Checks for available update and returns an instance
const notifier = updateNotifier({pkg});

// Notify using the built-in convenience method
notifier.notify();


/*eslint no-console: ["error", { allow: ["log"] }] */

program
  .version(pkg.version)
  .description(greenhub.description);

program
  .command('count <model> [params...]')
  .alias('c')
  .description('return total number of records from specified model <devices, samples>')
  .option('-d, --date <value>', 'single date query in `yyyy-mm-dd` date format')
  .option('-j, --json', 'output result in JSON')
  .option('-L, --last <interval>', 'amount of time interval of last <m>onth, <w>eek,<d>ay or <h>our')
  .option('-R, --range [from]..[to]', 'time range of query in `yyyy-mm-dd` date format, optional arguments')
  .action((model, params, options) => greenhub.count(model, params, options))
  .on('--help', () => {
    console.log('  Examples:');
    console.log();
    console.log('    $ greenhub count devices                            # all records');
    console.log('    $ greenhub count devices --date 2017-05-30          # records of 2017-05-30');
    console.log('    $ greenhub count samples --last 12h                 # records of the last 12 hours');
    console.log('    $ greenhub count devices -L 5d --json               # records of the last 5 days in json');
    console.log('    $ greenhub count samples -R 2017-05-01..2017-05-31  # records between 2017-05-01 and 2017-05-31');
    console.log('    $ greenhub count samples --range 2017-03-15..       # records from 2017-03-15 to current date');
    console.log('    $ greenhub count samples --range ..2017-02-01       # records before 2017-02-01');
    console.log();
  });

program
  .command('login')
  .description('login with an user API token key')
  .option('-r --reload', 'reload login credentials')
  .action(options => greenhub.login(options));

program
  .command('logout')
  .description('logout any user API credentials')
  .action(() => greenhub.logout());

program
  .command('lumberjack <model> [params...]')
  .alias('j')
  .description('flexible query builder')
  .option('-d, --date <value>', 'single date query in `yyyy-mm-dd` date format')
  .option('-L, --last <interval>', 'value of time interval of last <m>onth, <w>eek,<d>ay or <h>our')
  .option('-n, --num-items <num>', 'number of items displayed per page, default is 10', 10)
  .option('-p, --page <page>', 'page to display, default is 1', 1)
  .option('-R, --range [from]..[to]', 'time range of query in `yyyy-mm-dd` date format, optional arguments')
  .action((model, params, options) => greenhub.lumberjack(model, params, options))
  .on('--help', () => {
    console.log('  Params have format [name:value]. See examples below');
    console.log();
    console.log('  Examples:');
    console.log();
    console.log('    $ greenhub lumberjack devices brand:google                 # query devices with brand google');
    console.log('    $ greenhub lumberjack devices --last 1w                    # query devices registered in the last week');
    console.log('    $ greenhub lumberjack samples os:6.0 -n 5                  # query samples with os version 6.0 and show 5 items per page');
    console.log('    $ greenhub lumberjack samples model:nexus -R ..2017-05-31  # query samples with model nexus that were uploaded before 2017-05-31');
    console.log();
  });

program
  .command('remote')
  .description('display the current GreenHub API server URL')
  .option('-f --fetch', 'fetch server url')
  .action(options => greenhub.remote(options));

program
  .command('token')
  .description('display the user API token key')
  .option('-n --new-token', 'generate new token')
  .action(options => greenhub.token(options));

program
  .command('whoami')
  .description('display information about the logged user')
  .option('-j, --json', 'output result in JSON')
  .action(options => greenhub.whoami(options));


program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
