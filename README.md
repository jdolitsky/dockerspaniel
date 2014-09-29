<a href="https://www.docker.io/" target="_blank"><img alt="docker" src="http://s29.postimg.org/fa9lzifqv/rsz_logo_docker.png"></a><br>
<a href="http://www.about-cocker-spaniels.com/" target="_blank"><img alt="cocker spaniel" src="http://s11.postimg.org/sjs80e49f/rsz_cocker_spaniel_home4.jpg"></a><br>

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

The step attributes <a href="#stepunless_one">**unless_one**</a>, <a href="#stepunless">**unless**</a>, <a href="#steponly_one">**only_one**</a>, and <a href="#steponly">**only**</a> will allow you to include or exclude steps based on provided tags.
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get update",
            "unless_one": [
                "no_update"
            ]
        },
        {
            "instruction": "run",
            "arguments": "apt-get install -y nodejs",
            "only_one": [
                "nodejs"
            ]
        }
    ]
}
```
From the above Spanielfile, many different Dockerfiles can be created.
#### (no tags)
Includes all steps without an **only** or **only_one** array.
```
$ dockerspaniel
. . .
FROM ubuntu:12.04
RUN apt-get update
```
#### no_update
Prevents update step because 'no_update' is present in the step's **unless_one** array.
```
$ dockerspaniel -t no_update
. . .
FROM ubuntu:12.04
```
#### nodejs
Includes nodejs install step because 'nodejs' is present in the step's **only_one** array.
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

Variable substitution is supported via <a href="https://github.com/wycats/handlebars.js">Handlebars</a> in the format **{{my_var}}**.

The following Spanielfile has the **defaults** object defined, which defines default values:
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get install -y {{dependencies}}"
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
Variables can be overridden by environment variables prefixed with **DS_**:
```

$ export DS_DEPENDENCIES="tmux nodejs"
$ dockerspaniel
...

FROM ubuntu:12.04
RUN apt-get install -y tmux nodejs
```
You are also able to use other Handlebar features, such as the each block helper. Notice in the example below that defaults.dependencies is now an array.
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "instruction": "run",
            "arguments": "apt-get install -y {{#each dependencies}}{{this}} {{/each}}"
        }
    ],
    "defaults": {
        "dependencies": ["wget", "curl", "screen", "vim"]
    }
}
```
```
$ dockerspaniel
...

FROM ubuntu:12.04
RUN apt-get install -y wget curl screen vim
```

## External Files

If a step contains either the **file** or **include** attribute, step.arguments and step.instuction are ignored.

#### file attribute
step.file is the path to a raw Dockerfile to include in place, which supports templating.

*Spanielfile*
```javascript
{
    "from": "ubuntu:12.04",
    "steps": [
        {
            "file": "path/to/Dockerfile1",
            "newline": true
        }
    ],
    "defaults": {
        "install_jdk": "RUN apt-get install -y openjdk-7-jdk"
    }
}
```
*path/to/Dockerfile1*
```
# Dockerfile1
RUN apt-get update
{{install_jdk}}
```
*Resulting Dockerfile*
```
FROM ubuntu:12.04

# Dockerfile1
RUN apt-get update
RUN apt-get install -y openjdk-7-jdk
```

#### include attribute
step.include is the path to another Spanielfile to include in place.

*Spanielfile*
```javascript
{
    "from": "fedora:20",
    "steps": [
        {
            "include": "path/to/add_user.json",
            "comment": "create new user"
        }
    ],
    "defaults": {
        "username": "paul"
    }
}
```
*path/to/add_user.json*
```javascript
{
    "steps": [
        {
            "instruction": "run",
            "arguments": "adduser {{username}}"
        }
    ]
}
```
*Resulting Dockerfile*
```
FROM fedora:20

# create new user with sudo access
RUN adduser paul
```

## Spanielfile Attributes

#### from

Base image for subsequent instructions. *Required unless the --base option is used.*

#### maintainer

Author field of generated images.

#### defaults

Key-value pairs to use for Handlebars templating.

#### steps

Array of step objects. A step object has the following attributes:

##### step.instruction

Docker instruction. All instructions are supported, see the official documentation for a list: https://docs.docker.com/reference/builder

##### step.arguments

Arguments to pass to Docker instruction. For the step *RUN apt-get update*, *RUN* is the instruction and *apt-get update* is the arguments.

##### step.unless_one

Array of tags that, when ONE is provided, will cause this step to be excluded.
<br>See <a href="http://en.wikipedia.org/wiki/NOR_gate" target="_blank">NOR gates</a>.

##### step.unless

Array of tags that, when ALL are provided, will cause this step to be excluded.
<br>See <a href="http://en.wikipedia.org/wiki/NAND_gate" target="_blank">NAND gates</a>.

##### step.only_one

Array of tags that, when ONE is provided, will cause this step to be included.
<br>See <a href="http://en.wikipedia.org/wiki/OR_gate" target="_blank">OR gates</a>.

##### step.only

Array of tags that, when ALL are provided, will cause this step to be included.
<br>See <a href="http://en.wikipedia.org/wiki/AND_gate" target="_blank">AND gates</a>.

##### step.comment

Comment placed above the step.

##### step.newline

When true, adds a newline above the step without a comment.

##### step.include

Include an external Spanielfile. This should be either an absolute path, or a path relative to the parent file. Any defaults defined here will override defaults from the parent (but environment variables will still override these). *This causes both step.instruction and step.arguments to be ignored.*

##### step.file

Include an external Dockerfile (with optional Handlebars templating). This should be either an absolute path, or a path relative to the parent file. *This causes step.include, step.instruction, and step.arguments to be ignored.*

## Using Programmatically

#### generateContents(data, callback)
```javascript
var ds = require('dockerspaniel');

var data = {
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

ds.generateContents(data, tags, function(err, contents) {
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
