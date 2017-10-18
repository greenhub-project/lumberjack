# GreenHub Lumberjack

[![Build Status](https://travis-ci.org/greenhub-project/lumberjack.svg?branch=master)](https://travis-ci.org/greenhub-project/lumberjack)
[![npm version](https://badge.fury.io/js/greenhub-cli.svg)](https://badge.fury.io/js/greenhub-cli)
[![Dependency Status](https://david-dm.org/greenhub-project/lumberjack.svg)](https://david-dm.org/greenhub-project/lumberjack)

> A command line app for interacting with the GreenHub REST API.

You can learn more about the GreenHub platform at [http://greenhub.hmatalonga.com](http://greenhub.hmatalonga.com)

## Install

Make sure you have [Node.js](https://nodejs.org) version 6+ installed. Then run the following:

```
$ npm install --global greenhub-cli
```

In case you don't have permissions to install npm packages globally, then add sudo:

```
$ sudo npm install --global greenhub-cli
```

## API

## Usage

```
$ greenhub --help

  Usage: greenhub [options] [command]


  Commands:

    count|c [options] <model> [params...]       count number of records from specified model <devices, samples>
    login [options]                             login with an user API token key
    logout                                      logout any user API credentials
    lumberjack|j [options] <model> [params...]  flexible query builder
    remote [options]                            display the current GreenHub API server URL
    status [options]                            check the status of the API server
    token [options]                             display the user API token key
    whoami [options]                            display information about the logged user

  GreenHub Lumberjack - A command line app for interacting with the GreenHub REST API.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## Disclaimer

This application was only tested on UNIX-like systems. There is no guarantee that fully supports other systems.

## License
MIT © Hugo Matalonga
