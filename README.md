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

### Local Forking

In case you want to run a _graph-node_ locally, recommended to speed up development and debugging, and be able to fork the _Rysk_'s graph at any Arbitrum height you can follow these steps (more context here: [Subgraph Debug Forking](https://thegraph.com/docs/en/cookbook/subgraph-debug-forking/)) .

This process can fork at specified heights (set in `config/arbitrum-local.json`), avoiding the problem of having wait times for the graph to sync up on each deploy.

#### Instructions 
First follow up to Step 5 included in the [graph-node docs](https://github.com/graphprotocol/graph-node#running-a-local-graph-node) using this repo as context for step 4 (make sure you have the prerequisites beforehand too).

After, run this command within _graph-node_ (substitute username and password, in case of no password leave as `USERNAME:`)

```bash
cargo run -p graph-node --release -- \
  --postgres-url postgresql://USERNAME[:PASSWORD]@localhost:5432/graph-node \
  --ethereum-rpc arbitrum:https://rpc.ankr.com/arbitrum \
  --ipfs 127.0.0.1:5001
```

And last let's setup the subgraph file, create the subraph and deploy it to our local _graph-node_.

```
prepare:arbitrum-local
create:local
deploy:local
```

You'll then finally see the _graph_node_ picking up on contract event and syncing; when done you'll have access to all indexed data locally: 
```
http://127.0.0.1:8000/subgraphs/name/rysk-local/graphql
```