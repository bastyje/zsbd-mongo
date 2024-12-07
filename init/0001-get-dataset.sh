#!/bin/bash

curl -L -o /tmp/archive.zip https://www.kaggle.com/api/v1/datasets/download/ranja7/vehicle-insurance-customer-data
mkdir /tmp/dataset
unzip /tmp/archive.zip -d /tmp/dataset