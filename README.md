# Rysk Subgraph

## Install

```shell
yarn -D
```

## Prerequisites

We use jq as part of the deployment process. To install it please follow instructions on the [jqlang website.](https://jqlang.github.io/jq/download/)

## Building the graph

There are two main commands required to build and deploy to Goldsky. Depending on the environment you wish to deploy, they will vary based on name. You will also need to create a `.env` file in the root which contains the following:

```env
GOLDSKY_TOKEN=<TOKEN>
```

You can obtain the token from a team member.

### Local

For a local deployment for testing, you can also make use of grafting. On lines 7 & 8 of the `subgraph.template.yaml` file, you can specify a base image and block number to graft from. It is recommended that you use the most recently deployed testnet base image. You can find this by visit that version and checking the logs on Goldsky. It will be shown as `subgraph_id: <image-id>`. Once these have been set you can run the following.

```shell
yarn build:local
yarn deploy:local
```

You will also find the overwrite command.

```shell
yarn deploy:local:overwrite
```

Using this will overwrite your development deployment which can be useful when debugging issues as otherwise, you will have to manually remove previous deployments from the Goldsky GUI.

### Goerli

Grafting is automatically disabled for this environment.

```shell
yarn build:goerli
yarn deploy:goerli
```

### Mainnet

Grafting is automatically disabled for this environment.

```shell
yarn build:arbitrum
yarn deploy:arbitrum
```
