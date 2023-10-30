#!/bin/bash

# Helper functions.
to_lowercase() {
  echo $1 | tr '[:upper:]' '[:lower:]'
}

remove_if_exists () {
  if [ -f $1 ]; then
    rm $1
  fi
}

# Set file paths.
addresses_file=src/addresses.ts
config_file=config.json
env=.env

# Remove files if they exist.
remove_if_exists $config_file
remove_if_exists $addresses_file

# Get environment variables.
if [[ -f $env ]]; then
  set -a
  source $env
  set +a
fi

# Network.
network=$(printenv NETWORK)

# Config addresses and start blocks.
address_book=$(printenv ADDRESS_BOOK)
address_book_block=$(printenv ADDRESS_BOOK_BLOCK)
alpha_porfolio_values_feed=$(printenv ALPHA_PORTFOLIO_VALUES_FEED)
alpha_porfolio_values_feed_block=$(printenv ALPHA_PORTFOLIO_VALUES_FEED_BLOCK)
controller=$(printenv CONTROLLER)
controller_block=$(printenv CONTROLLER_BLOCK)
liquidity_pool=$(printenv LIQUIDITY_POOL)
liquidity_pool_block=$(printenv LIQUIDITY_POOL_BLOCK)
option_catalogue=$(printenv OPTION_CATALOGUE)
option_catalogue_block=$(printenv OPTION_CATALOGUE_BLOCK)
option_exchange=$(printenv OPTION_EXCHANGE)
option_exchange_block=$(printenv OPTION_EXCHANGE_BLOCK)
option_handler=$(printenv OPTION_HANDLER)
option_handler_block=$(printenv OPTION_HANDLER_BLOCK)
oracle=$(printenv ORACLE)
oracle_block=$(printenv ORACLE_BLOCK)
otoken_factory=$(printenv OTOKEN_FACTORY)
otoken_factory_block=$(printenv OTOKEN_FACTORY_BLOCK)
volatility_feed=$(printenv VOLATILITY_FEED)
volatility_feed_block=$(printenv VOLATILITY_FEED_BLOCK)
whitelist=$(printenv WHITELIST)
whitelist_block=$(printenv WHITELIST_BLOCK)

# Additional contract addresses.
chainlink_aggregator=$(printenv CHAINLINK_AGGREGATOR)
liquidity_pool_old=$(printenv LIQUIDITY_POOL_OLD)
option_exchange_old=$(printenv OPTION_EXCHANGE_OLD)
option_registry=$(printenv OPTION_REGISTRY)
margin_pool=$(printenv MARGIN_POOL)

# Currency addresses
USDC=$(printenv USDC)
WETH=$(printenv WETH)

# Build config.json.
config=$(
  jq \
    -n \
    --arg network $network \
    --arg address_book $address_book \
    --arg address_book_block $address_book_block \
    --arg alpha_porfolio_values_feed $alpha_porfolio_values_feed \
    --arg alpha_porfolio_values_feed_block $alpha_porfolio_values_feed_block \
    --arg controller $controller \
    --arg controller_block $controller_block \
    --arg liquidity_pool $liquidity_pool \
    --arg liquidity_pool_block $liquidity_pool_block \
    --arg option_catalogue $option_catalogue \
    --arg option_catalogue_block $option_catalogue_block \
    --arg option_exchange $option_exchange \
    --arg option_exchange_block $option_exchange_block \
    --arg option_handler $option_handler \
    --arg option_handler_block $option_handler_block \
    --arg oracle $oracle \
    --arg oracle_block $oracle_block \
    --arg otoken_factory $otoken_factory \
    --arg otoken_factory_block $otoken_factory_block \
    --arg volatility_feed $volatility_feed \
    --arg volatility_feed_block $volatility_feed_block \
    --arg whitelist $whitelist \
    --arg whitelist_block $whitelist_block \
    '{
      "network": $network,
      "alphaPortfolioValuesFeed": $alpha_porfolio_values_feed,
      "alphaPortfolioValuesFeed-start-block": $alpha_porfolio_values_feed_block|tonumber,
      "addressBook": $address_book,
      "addressBook-start-block": $address_book_block|tonumber,
      "controller": $controller,
      "controller-start-block": $controller_block|tonumber,
      "liquidityPool": $liquidity_pool,
      "liquidityPool-start-block": $liquidity_pool_block|tonumber,
      "optionCatalogue": $option_catalogue,
      "optionCatalogue-start-block": $option_catalogue_block|tonumber,
      "optionExchange": $option_exchange,
      "optionExchange-start-block": $option_exchange_block|tonumber,
      "optionHandler": $option_handler,
      "optionHandler-start-block": $option_handler_block|tonumber,
      "oracle": $oracle,
      "oracle-start-block": $oracle_block|tonumber,
      "oTokenFactory": $otoken_factory,
      "oTokenFactory-start-block": $otoken_factory_block|tonumber,
      "volatilityFeed": $volatility_feed,
      "volatilityFeed-start-block": $volatility_feed_block|tonumber,
      "whitelist": $whitelist,
      "whitelist-start-block": $whitelist_block|tonumber,
    }'
)

echo $config | jq . > $config_file

# Build addresses.ts.
echo '// This file is automatically generated. Please do not modify it.' >> $addresses_file
echo >> $addresses_file
echo '// Contract addresses.' >> $addresses_file
echo 'export const LIQUIDITY_POOL = "'$(to_lowercase $liquidity_pool)'"' >> $addresses_file
echo 'export const CHAINLINK_AGGREGATOR = "'$(to_lowercase $chainlink_aggregator)'"' >> $addresses_file
echo 'export const LIQUIDITY_POOL_OLD = "'$(to_lowercase $liquidity_pool_old)'"' >> $addresses_file
echo 'export const OPTION_EXCHANGE = "'$(to_lowercase $option_exchange)'"' >> $addresses_file
echo 'export const OPTION_EXCHANGE_OLD = "'$(to_lowercase $option_exchange_old)'"' >> $addresses_file
echo 'export const OPTION_REGISTRY = "'$(to_lowercase $option_registry)'"' >> $addresses_file
echo 'export const CONTROLLER = "'$(to_lowercase $controller)'"' >> $addresses_file
echo 'export const MARGIN_POOL = "'$(to_lowercase $margin_pool)'"' >> $addresses_file

echo >> $addresses_file
echo '// Currency addresses.' >> $addresses_file
echo 'export const USDC_ADDRESS = "'$(to_lowercase $USDC)'"' >> $addresses_file
echo 'export const WETH_ADDRESS = "'$(to_lowercase $WETH)'"' >> $addresses_file
