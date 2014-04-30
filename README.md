DockerSpaniel
=============

Create Dockerfiles from JSON

![docker](http://upload.wikimedia.org/wikipedia/commons/7/79/Docker_%28container_engine%29_logo.png)

![cocker spaniel](http://upload.wikimedia.org/wikipedia/en/thumb/0/07/Home_cocker_spaniel.jpg/160px-Home_cocker_spaniel.jpg)

### Install

```
git clone git@github.com:jdolitsky/dockerspaniel.git
cd dockerspaniel
npm install -g
```

### Create a Spanielfile

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

### Convert the Spanielfile to a Dockerfile

The following command

```
cd /dir/with/spanielfile && dockerspaniel
```

creates a Dockerfile in the same directory

```
#
#   generated by DockerSpaniel
#
FROM ubuntu:12.04
MAINTAINER Josh Dolitsky <jdolitsky@gmail.com>

# update packages
RUN apt-get update

# install dependencies
RUN apt-get install -y git python-software-properties python g++ make
```

*please see the **examples** directoy*
