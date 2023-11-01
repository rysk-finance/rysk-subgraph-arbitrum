#!/bin/bash

template=subgraph.template.yaml

echo Creating temporary subgraph template...

mkdir -p temp
cp $template temp/$template

echo Removing grafting...

sed -i '/features:/,+4d' $template
