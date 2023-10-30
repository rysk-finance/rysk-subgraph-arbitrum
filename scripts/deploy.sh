#!/bin/bash

set -a
source .env
set +a

GOLDSKY_TOKEN=$(printenv GOLDSKY_TOKEN)

deployment_name=$1
deployment_version=$(cat package.json | jq .version -r)
deployment=$deployment_name/$deployment_version
flags=${@:2}

goldsky \
  subgraph deploy $deployment \
  $flags \
  --token $GOLDSKY_TOKEN

read -p "Press any key to continue..." x
