#!/bin/sh -e

cd ..
sudo docker build -f docker/Dockerfile -t iris/visualiser .
