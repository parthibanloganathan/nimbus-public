#!/bin/bash

cd ~/dev/nimbus/client
cp -r Procfile README.md package.json package-lock.json public src ../../nimbus-client-1
cd ~/dev/nimbus/server
cp -r Procfile config.py init_db.py main.py requirements.txt auth.py flaskapp.py models.py manage.py keys.py ../../nimbus-server-2

#shopt -s extglob
#cp -r !(node_modules) ~/dev/nimbus/client/* ~/dev/nimbus-client-1
#cp -r !(__pycache__) ~/dev/nimbus/server/* ~/dev/nimbus-server-2

echo "Copied from nimbus to nimbus-client-1 and nimbus-server-2"

