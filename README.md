<a href="https://www.docker.io/"><img alt="docker" src="http://s29.postimg.org/fa9lzifqv/rsz_logo_docker.png"></a><br>
<a href="http://www.about-cocker-spaniels.com/"><img alt="cocker spaniel" src="http://s11.postimg.org/sjs80e49f/rsz_cocker_spaniel_home4.jpg"></a><br>

[![NPM version](https://badge.fury.io/js/dockerspaniel.svg)](http://badge.fury.io/js/dockerspaniel) [![Build Status](https://travis-ci.org/jdolitsky/dockerspaniel.svg?branch=master)](https://travis-ci.org/jdolitsky/dockerspaniel)  [![Coverage Status](https://img.shields.io/coveralls/jdolitsky/dockerspaniel.svg)](https://coveralls.io/r/jdolitsky/dockerspaniel)

## Why would anyone ever use this?
Short answer? Continuous delivery.

<a href="https://www.docker.io/">Docker</a> has wide applications in platform engineering. It is particularly useful for creating isolated build environments. Docker images are created from <a href="http://docs.docker.io/reference/builder/">Dockerfiles</a>, which contain various steps. If you are targeting multiple platforms, you may find yourself juggling a bunch of similar Dockerfiles with slight variations.

This tool will help maximize code reuse and enable you to generate unique Dockerfiles on-the-fly based on several features, such as <a href="#tagging">tag-driven step inclusion/exclusion</a> and <a href="#variable-substitution">variable substitution</a>.

## Installation

    $ npm install -g dockerspaniel

## Quick Start
#### Create a Spanielfile (JSON)

```javascript
{
    "from": "ubuntu:12.04",
    "maintainer": "Josh Dolitsky <jdolitsky@gmail.com>",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get update",
            "comment": "update packages"
        },
        {
            "instruction": "run",
            "arguments": "apt-get install -y nodejs",
            "comment": "install dependencies"
        }
    ]
}
```

#### Convert the Spanielfile to a Dockerfile
The following command

```
$ dockerspaniel
```

will create a Dockerfile in the same directory:

```
FROM ubuntu:12.04
MAINTAINER Josh Dolitsky <jdolitsky@gmail.com>

# update packages
RUN apt-get update

# install dependencies
RUN apt-get install -y nodejs
```

## Command-line Options

```
  Usage: dockerspaniel -i [input] -o [output] -b [baseimage] -t [tag]

  -h|--help    This help screen
  -i|--input   JSON file to use for input (default: Spanielfile)
  -o|--output  Path of new Dockerfile to create (default: Dockerfile)
  -b|--base    Override Docker base image to use in FROM instruction
  -t|--tag     Tag(s) for use by 'unless' and 'only' step attributes
               Supports mutliple tags via format '-t tag1 -t tag2' etc.
```

## Tagging

The step attributes **only** and **unless** will allow you to include or exclude steps based on provided tags.
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get update",
            "unless": [
                "no_update"
            ]
        },
        {
            "instruction": "run",
            "arguments": "apt-get install -y nodejs",
            "only": [
                "nodejs"
            ]
        }
    ]
}
```
From the above Spanielfile, many different Dockerfiles can be created.
#### (no tags)
Includes all steps without an **only** array.
```
$ dockerspaniel
. . .
FROM ubuntu:12.04
RUN apt-get update
```
#### no_update
Prevents update step because 'no_update' is present in the step's **unless** array.
```
$ dockerspaniel -t no_update
. . .
FROM ubuntu:12.04
```
#### nodejs
Includes nodejs install step because 'nodejs' is present in the step's **only** array.
```
$ dockerspaniel -t nodejs
. . .
FROM ubuntu:12.04
RUN apt-get update
RUN apt-get install -y nodejs
```
#### no_update and nodejs
Prevents update AND installs nodejs.
```
$ dockerspaniel -t no_update -t nodejs
. . .
FROM ubuntu:12.04
RUN apt-get install -y nodejs
```

## Variable Substitution

Variable substitution is supported in step arguments in the format **#{my_var}**

The following Spanielfile has the **defaults** object defined, which defines default values:
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get install -y #{dependencies}"
        }
    ],
    "defaults": {
        "dependencies": "wget curl screen vim"
    }
}
```
```
$ dockerspaniel
...

FROM ubuntu:12.04
RUN apt-get install -y wget curl screen vim
```
Variables can also be overridden by environment variables:
```
$ export dependencies="tmux nodejs"
$ dockerspaniel
...

FROM ubuntu:12.04
RUN apt-get install -y tmux nodejs
```

## Spanielfile Attributes

#### from

Base image for subsequent instructions. *Required unless the --base option is used.*

#### maintainer

Author field of generated images.

#### defaults

Key-value pairs to use for variable substitution.

#### steps

Array of step objects. A step object has the following attributes:

##### step.instruction

Docker instruction. Can be one of the following: *FROM, MAINTAINER, RUN, CMD, EXPOSE, ENV, ADD, ENTRYPOINT, VOLUME, USER, WORKDIR, ONBUILD*

##### step.arguments

Arguments to pass to Docker instruction. For the step *RUN apt-get update*, *RUN* is the instruction and *apt-get update* is the arguments.

##### step.unless

Array of tags that, when provided, will cause this step to be excluded.

##### step.only

Array of tags that, only when provided, will cause this step to be included.

##### step.comment

Comment placed above the step.

##### step.newline

When true, adds a newline above the step without a comment.

## Using Programmatically

#### generateContents(json_object, callback)
```javascript
var ds = require('dockerspaniel');

var json_object = {
    from: 'ubuntu:12.04',
    maintainer: 'John Smith',
    steps: [
        {
            instruction: 'run',
            arguments: 'apt-get update'
        },
        {
            instruction: 'run',
            arguments: 'apt-get install -y nodejs',
            only: [
                'nodejs'
            ]
        },
        {
            instruction: 'run',
            arguments: 'apt-get install -y mysql-server mysql-client',
            unless: [
                'no_database'
            ]
        }
    ]
};

var tags = ['nodejs', 'no_database'];

ds.generateContents(json_object, tags, function(err, contents) {
    if (err) throw err;
    console.log(contents);
});
```

#### createDockerfile(options, callback)
```javascript
var ds = require('dockerspaniel');

var options = {
    input: '/path/to/json/file.json',
    output: '/path/to/new/Dockerfile',
    tags: [
        'nodejs',
        'no_database'
    ],
    base: 'ubuntu:12.04'
};

ds.createDockerfile(options, function (err) {
    if (err) throw err;
    // new Dockerfile was created at options.output
});
```
