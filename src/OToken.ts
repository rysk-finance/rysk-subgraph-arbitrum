import { Transfer } from "../generated/templates/OToken/OToken";

import {
  OToken,
  AccountBalance,
  OptionsTransferAction
} from "../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import {
  BIGINT_ZERO,
  LIQUIDITY_POOL,
  loadOrCreateAccount,
  OPTION_EXCHANGE,
  OPTION_EXCHANGE_OLD,
  OPTION_REGISTRY,
  updateBuyerPosition,
  updateSellerPosition,
  ZERO_ADDRESS
} from "./helper";

export function handleTransfer(event: Transfer): void {
  // Load oToken entity
  let entity = OToken.load(event.address.toHex());
  let amount = event.params.value;

  const toAddress = event.params.to;
  const fromAddress = event.params.from;

  // @todo Get these from AddressBook
  // note old option exchange needs to be excluded cause we are still using it for testing
  let excludedAddresses = [
    LIQUIDITY_POOL,
    OPTION_REGISTRY,
    OPTION_EXCHANGE,
    OPTION_EXCHANGE_OLD
  ];

  // convert to 1e18 cause LP handleWriteOptions is 1e18
  const amountLP = amount.times(BigInt.fromString("10000000000"));

  if (fromAddress.toHex() == ZERO_ADDRESS) {
    // Mint Operation

    // update account balance
    let accountBalance = getOrCreateAccountBalance(toAddress, entity as OToken);
    accountBalance.balance = accountBalance.balance.plus(amount);
    accountBalance.save();
  } else if (toAddress.toHex() == ZERO_ADDRESS) {
    // Burn event
    let accountBalance = getOrCreateAccountBalance(
      fromAddress,
      entity as OToken
    );
    accountBalance.balance = accountBalance.balance.minus(amount);
    accountBalance.save();
  } else {
    let sourceAccount = getOrCreateAccountBalance(
      fromAddress,
      entity as OToken
    );
    sourceAccount.balance = sourceAccount.balance.minus(amount);
    sourceAccount.save();

    let destinationAccount = getOrCreateAccountBalance(
      toAddress,
      entity as OToken
    );
    destinationAccount.balance = destinationAccount.balance.plus(amount);
    destinationAccount.save();

    // exclude txs with options registry, exchange and liquidity pool since already handled by OptionsSold and Options Bought
    if (
      !(
        excludedAddresses.includes(toAddress.toHex()) ||
        excludedAddresses.includes(fromAddress.toHex())
      )
    ) {
      const optionsTransferTransaction = new OptionsTransferAction(
        event.transaction.hash.toHex()
      );

      optionsTransferTransaction.otoken = event.address.toHex();
      optionsTransferTransaction.from = fromAddress;
      optionsTransferTransaction.to = toAddress;
      optionsTransferTransaction.amount = amount;
      optionsTransferTransaction.timestamp = event.block.timestamp;
      optionsTransferTransaction.transactionHash = event.transaction.hash.toHex();

      optionsTransferTransaction.save();

      updateBuyerPosition(
        toAddress,
        event.address.toHex(),
        amountLP,
        optionsTransferTransaction.id
      );

      updateSellerPosition(
        fromAddress,
        event.address.toHex(),
        amountLP,
        optionsTransferTransaction.id
      );
    }
  }
}

function getOrCreateAccountBalance(
  address: Address,
  token: OToken
): AccountBalance {
  // make sure we create the account entity.
  let accountEntityId = address.toHex();
  let account = loadOrCreateAccount(accountEntityId);
  account.save();

  let entityId = address.toHex() + "-" + token.id;
  let accountBalance = AccountBalance.load(entityId);
  if (accountBalance != null) return accountBalance as AccountBalance;

  accountBalance = new AccountBalance(entityId);

  accountBalance.token = token.id;
  accountBalance.account = address.toHex();
  accountBalance.balance = BIGINT_ZERO;

  return accountBalance as AccountBalance;
}
