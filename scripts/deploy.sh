#!/bin/bash

env=.env

# Get environment variables.
if [[ -f $env ]]; then
  set -a
  source $env
  set +a
fi

deployment_name=$1
deployment_version=$(cat package.json | jq .version -r)
deployment=$deployment_name/$deployment_version
flags=${@:2}

# Deploy TheGraph only on mainnet.
if [[ $deployment_name == arbitrum-one ]]; then
  graph \
    deploy rysk-finance/$deployment_name \
    --product hosted-service \
    --deploy-key $THE_GRAPH_TOKEN
fi

goldsky \
  subgraph deploy $deployment \
  $flags \
  --token $GOLDSKY_TOKEN

if [[ $(printenv CI) == 'true' ]]; then
  exit 0
fi

read -p "Press any key to continue..." x
