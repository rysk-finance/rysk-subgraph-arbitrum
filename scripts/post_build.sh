#!/bin/bash

template=temp/subgraph.template.yaml

if [[ -f $template ]]; then
  echo Restoring subgraph template...

  cp $template ./
fi

rm -rf temp
