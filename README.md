# DockerSpaniel [![Build Status](https://travis-ci.org/jdolitsky/dockerspaniel.svg?branch=master)](https://travis-ci.org/jdolitsky/dockerspaniel)
> Create Dockerfiles from JSON

![docker](http://upload.wikimedia.org/wikipedia/commons/7/79/Docker_%28container_engine%29_logo.png)

![cocker spaniel](http://upload.wikimedia.org/wikipedia/en/thumb/0/07/Home_cocker_spaniel.jpg/160px-Home_cocker_spaniel.jpg)

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
