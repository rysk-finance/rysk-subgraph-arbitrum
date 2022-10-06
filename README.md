# Rysk Subgraph

## Install

```shell
npm i
```

## Building the graph

```shell
# prepare arbitrum
npm run prepare:arbitrum

# compile types
npm run codegen

# build subgraph
npm run build

```

## Deploy

### Get Access Token

You will need an access token for deployment. After you get that on [the graph](https://thegraph.com/explorer/dashboard), you need to run the following command before deploying.

```shell
graph auth https://api.thegraph.com/deploy/ <ACCESS_TOKEN>
```

Make sure you include the last `/` at the end of the url!

### Deploy 

run
```shell

npm run deploy:arbitrum
```


