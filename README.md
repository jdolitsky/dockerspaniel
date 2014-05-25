<img alt="docker" src="http://solum.io/img/logo_docker.png"><br>
<img alt="cocker spaniel" src="http://s11.postimg.org/sjs80e49f/rsz_cocker_spaniel_home4.jpg"><br>

Create Dockerfiles from JSON<br>

[![NPM version](https://badge.fury.io/js/dockerspaniel.svg)](http://badge.fury.io/js/dockerspaniel) [![Build Status](https://travis-ci.org/jdolitsky/dockerspaniel.svg?branch=master)](https://travis-ci.org/jdolitsky/dockerspaniel)  [![Coverage Status](https://img.shields.io/coveralls/jdolitsky/dockerspaniel.svg)](https://coveralls.io/r/jdolitsky/dockerspaniel)


## Installation

    $ npm install dockerspaniel -g

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
            "arguments": "apt-get install -y git python-software-properties python g++ make",
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
RUN apt-get install -y git python-software-properties python g++ make
```


## Spanielfile Attributes

text here

## Command-line Options

text here

## Using Programmatically

text here
