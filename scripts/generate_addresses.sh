#!/bin/bash

# Helper functions.
to_lowercase() {
  echo $1 | tr '[:upper:]' '[:lower:]'
}

# Set file paths.
addresses_file=src/addresses.ts
config_file=config.json
env=.env

# Remove files if they exist.
rm -f $config_file
rm -f $addresses_file

# Get environment variables.
if [[ -f $env ]]; then
  set -a
  source $env
  set +a
fi

# Build config.json.
config=$(
  jq \
    -n \
    --arg network $NETWORK \
    --arg address_book $ADDRESS_BOOK \
    --arg address_book_block $ADDRESS_BOOK_BLOCK \
    --arg alpha_porfolio_values_feed $ALPHA_PORTFOLIO_VALUES_FEED \
    --arg alpha_porfolio_values_feed_block $ALPHA_PORTFOLIO_VALUES_FEED_BLOCK \
    --arg arb $ARB \
    --arg arb_block $ARB_BLOCK \
    --arg controller $CONTROLLER \
    --arg controller_block $CONTROLLER_BLOCK \
    --arg liquidity_pool $LIQUIDITY_POOL \
    --arg liquidity_pool_block $LIQUIDITY_POOL_BLOCK \
    --arg option_catalogue $OPTION_CATALOGUE \
    --arg option_catalogue_block $OPTION_CATALOGUE_BLOCK \
    --arg option_exchange $OPTION_EXCHANGE \
    --arg option_exchange_block $OPTION_EXCHANGE_BLOCK \
    --arg option_handler $OPTION_HANDLER \
    --arg option_handler_block $OPTION_HANDLER_BLOCK \
    --arg oracle $ORACLE \
    --arg oracle_block $ORACLE_BLOCK \
    --arg otoken_factory $OTOKEN_FACTORY \
    --arg otoken_factory_block $OTOKEN_FACTORY_BLOCK \
    --arg volatility_feed $VOLATILITY_FEED \
    --arg volatility_feed_block $VOLATILITY_FEED_BLOCK \
    --arg whitelist $WHITELIST \
    --arg whitelist_block $WHITELIST_BLOCK \
    '{
      "network": $network,
      "alphaPortfolioValuesFeed": $alpha_porfolio_values_feed,
      "alphaPortfolioValuesFeed-start-block": $alpha_porfolio_values_feed_block|tonumber,
      "addressBook": $address_book,
      "addressBook-start-block": $address_book_block|tonumber,
      "ARB": $arb,
      "ARB-start-block": $arb_block|tonumber,
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
echo 'export const LIQUIDITY_POOL = "'$(to_lowercase $LIQUIDITY_POOL)'"' >> $addresses_file
echo 'export const CHAINLINK_AGGREGATOR = "'$(to_lowercase $CHAINLINK_AGGREGATOR)'"' >> $addresses_file
echo 'export const LIQUIDITY_POOL_OLD = "'$(to_lowercase $LIQUIDITY_POOL_OLD)'"' >> $addresses_file
echo 'export const OPTION_EXCHANGE = "'$(to_lowercase $OPTION_EXCHANGE)'"' >> $addresses_file
echo 'export const OPTION_EXCHANGE_OLD = "'$(to_lowercase $OPTION_EXCHANGE_OLD)'"' >> $addresses_file
echo 'export const OPTION_REGISTRY = "'$(to_lowercase $OPTION_REGISTRY)'"' >> $addresses_file
echo 'export const CONTROLLER = "'$(to_lowercase $CONTROLLER)'"' >> $addresses_file
echo 'export const MARGIN_POOL = "'$(to_lowercase $MARGIN_POOL)'"' >> $addresses_file
echo 'export const TREASURY = "'$(to_lowercase $TREASURY)'"' >> $addresses_file

echo >> $addresses_file
echo '// Currency addresses.' >> $addresses_file
echo 'export const USDC_ADDRESS = "'$(to_lowercase $USDC)'"' >> $addresses_file
echo 'export const WETH_ADDRESS = "'$(to_lowercase $WETH)'"' >> $addresses_file
