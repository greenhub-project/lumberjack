# GreenHub Lumberjack

[![Build Status](https://travis-ci.org/hmatalonga/greenhub-lumberjack.svg?branch=master)](https://travis-ci.org/hmatalonga/greenhub-lumberjack)

> A command line app for interacting with the GreenHub REST API.

You can learn more about the GreenHub platform at [http://hmatalonga.com/greenhub](http://hmatalonga.com/greenhub)

## Install

Make sure you have [Node.js](https://nodejs.org) version 4+ installed. Then run the following:

```
$ npm install --global greenhub-cli
```

## Usage

```
$ greenhub --help

  Usage: index [options] [command]


  Commands:

    count|c [options] <model> [params...]       return total number of records from specified model <devices, samples>
    login [options] <token>                     login with an user API token key
    logout                                      logout any user API credentials
    lumberjack|j [options] <model> [params...]  flexible query builder
    remote [options]                            display the current GreenHub API server URL
    token [options]                             display user API token key
    whoami [options]                            display information about the logged user

  GreenHub Lumberjack - A command line app for interacting with the GreenHub REST API.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

```

## License
MIT © Hugo Matalonga
