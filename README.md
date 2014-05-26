<a href="https://www.docker.io/"><img alt="docker" src="http://s29.postimg.org/fa9lzifqv/rsz_logo_docker.png"></a><br>
<img alt="cocker spaniel" src="http://s11.postimg.org/sjs80e49f/rsz_cocker_spaniel_home4.jpg"><br>

[![NPM version](https://badge.fury.io/js/dockerspaniel.svg)](http://badge.fury.io/js/dockerspaniel) [![Build Status](https://travis-ci.org/jdolitsky/dockerspaniel.svg?branch=master)](https://travis-ci.org/jdolitsky/dockerspaniel)  [![Coverage Status](https://img.shields.io/coveralls/jdolitsky/dockerspaniel.svg)](https://coveralls.io/r/jdolitsky/dockerspaniel)

## Why would anyone ever use this?
Short answer? Continuous delivery.

<a href="https://www.docker.io/">Docker</a> has wide applications in platform engineering. It is particularly useful for creating isolated build environments. Docker images are created from <a href="http://docs.docker.io/reference/builder/">Dockerfiles</a>, which contain various steps. If you are targeting multiple platforms, you may find yourself juggling a bunch of similar Dockerfiles with slight variations.

This tool will help maximize code reuse and enable you to generate unique Dockerfiles on-the-fly based on several features, such as tag-driven step inclusion/exclusion.

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


## Spanielfile Attributes

text here

## Command-line Options

text here

## Using Programmatically

text here
