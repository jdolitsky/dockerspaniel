# DockerSpaniel
> Create Dockerfiles from JSON

[![NPM version](https://badge.fury.io/js/dockerspaniel.svg)](http://badge.fury.io/js/dockerspaniel) [![Build Status](https://travis-ci.org/jdolitsky/dockerspaniel.svg?branch=master)](https://travis-ci.org/jdolitsky/dockerspaniel)  [![Coverage Status](https://img.shields.io/coveralls/jdolitsky/dockerspaniel.svg)](https://coveralls.io/r/jdolitsky/dockerspaniel)<br>
<img alt="docker" src="http://solum.io/img/logo_docker.png" ssrc="http://upload.wikimedia.org/wikipedia/commons/7/79/Docker_%28container_engine%29_logo.png">
<img alt="cocker spaniel" src="http://www.about-cocker-spaniels.com/images/cocker-spaniel-home4.jpg">

## Install

```
npm install dockerspaniel -g
```

## Create a Spanielfile (JSON)

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

## Convert the Spanielfile to a Dockerfile

The following command

```
cd /dir/with/spanielfile && dockerspaniel
```

creates a Dockerfile in the same directory

```
FROM ubuntu:12.04
MAINTAINER Josh Dolitsky <jdolitsky@gmail.com>

# update packages
RUN apt-get update

# install dependencies
RUN apt-get install -y git python-software-properties python g++ make
```
