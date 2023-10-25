# Rysk Subgraph

## Install

Installation will also run the `prepare` script which generates configuration files.

```shell
yarn -D
```

## Environment Variables

To get started you will need to create a `.env` file in the root which contains the following:

```env
GOLDSKY_TOKEN=<TOKEN>

NETWORK=arbitrum-goerli

ADDRESS_BOOK=0xd6e67bF0b1Cdb34C37f31A2652812CB30746a94A
ADDRESS_BOOK_BLOCK=867509
ALPHA_PORTFOLIO_VALUES_FEED=0x84fbb7C0a210e5e3A9f7707e1Fb725ADcf0CF528
ALPHA_PORTFOLIO_VALUES_FEED_BLOCK=18196310
ARB=0xf50d9760281bf15E22f145A4f4C3592240B690F5
ARB_BLOCK=50716650
CONTROLLER=0x11a602a5F5D823c103bb8b7184e22391Aae5F4C2
CONTROLLER_BLOCK=867548
LIQUIDITY_POOL=0x0B1Bf5fb77AA36cD48Baa1395Bc2B5fa0f135d8C
LIQUIDITY_POOL_BLOCK=18196658
OPTION_CATALOGUE=0xde458dD32651F27A8895D4a92B7798Cdc4EbF2f0
OPTION_CATALOGUE_BLOCK=18197018
OPTION_EXCHANGE=0xb672fE86693bF6f3b034730f5d2C77C8844d6b45
OPTION_EXCHANGE_BLOCK=18197089
ORACLE=0x35578F5A49E1f1Cf34ed780B46A0BdABA23D4C0b
ORACLE_BLOCK=867525
OTOKEN_FACTORY=0x7595F9c5B93f1478dC0836BdFCb87fF3A8970B10
OTOKEN_FACTORY_BLOCK=18197089
OPTION_HANDLER=0x1F63F3B37f818f05ebefaCa11086e5250958e0D8
OPTION_HANDLER_BLOCK=18197206
VOLATILITY_FEED=0xf058Fe438AAF22617C30997579E89176e19635Dc
VOLATILITY_FEED_BLOCK=18196208
WHITELIST=0xf6651D140AEEE442E91A6BAe418c4993d0190370
WHITELIST_BLOCK=867522

CHAINLINK_AGGREGATOR_ARB_USD=0x2eE9BFB2D319B31A573EA15774B755715988E99D
CHAINLINK_AGGREGATOR_ETH_USD=0x62CAe0FA2da220f43a51F86Db2EDb36DcA9A5A08
LIQUIDITY_POOL_OLD=0xc10b976c671ce9bff0723611f01422acbae100a5
OPTION_EXCHANGE_OLD=0x63ce41ca4e30e75caf9b561e0250c25056b6e2c0
OPTION_REGISTRY=0x4e89cc3215af050ceb63ca62470eec7c1a66f737
MARGIN_POOL=0x0e0ad3ea82efaeafb4476f5e8225b4746b88fd9f
TREASURY=0xad5b468f6fb897461e388396877fd5e3c5114539

USDC=0x408c5755b5c7a0a28d851558ea3636cfc5b5b19d
WETH=0x3b3a1de07439eeb04492fa64a889ee25a130cdd3
```

You can obtain the `GOLDSKY_TOKEN` from a team member. The remaining variables will be sufficient for deploying a local subgraph for Goerli. In the event that you need to deploy a main net subgraph, you will need to swap out the variables accordingly.

## Prerequisites

We use jq as part of the deployment process. To install it please follow instructions on the [jqlang website.](https://jqlang.github.io/jq/download/)

## Building the graph

There are two main commands required to build and deploy to Goldsky. Depending on the environment you wish to deploy, they will vary based on name.

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
