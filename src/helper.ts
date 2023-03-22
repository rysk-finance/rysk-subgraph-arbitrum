import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

import { Account, Position } from "../generated/schema";

export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export let BIGDECIMAL_ONE = BigDecimal.fromString("1");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const LIQUIDITY_POOL = "0xfd93db0a7c1e373bdfe9b141693a25e4deb79df2";
export const OPTION_REGISTRY = "0xF37D82c5ee757eE05B08ed469d1CC90c301c8636";

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS;
}

export function updateOptionPosition(
  isBuy: boolean,
  trader: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string
): void {
  let initPositionId = BIGINT_ZERO;

  let position = loadOrCreatePosition(trader, oToken, initPositionId);

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreatePosition(trader, oToken, initPositionId);
  }

  position.netAmount = isBuy
    ? position.netAmount.plus(amount)
    : position.netAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.longAmount.isZero() && position.shortAmount.isZero())
    position.active = false;

  // let writeOptionsTransactions = position.writeOptionsTransactions
  // writeOptionsTransactions.push(tradeId)
  // position.writeOptionsTransactions = writeOptionsTransactions

  if (isBuy) {
    position.longAmount = position.longAmount.plus(amount);
    const optionsBoughtTransactions = position.optionsBoughtTransactions;
    optionsBoughtTransactions.push(tradeId);
    position.optionsBoughtTransactions = optionsBoughtTransactions;
  } else if (!isBuy) {
    position.shortAmount = position.shortAmount.plus(amount);
    const optionsSoldTransactions = position.optionsSoldTransactions;
    optionsSoldTransactions.push(tradeId);
    position.optionsSoldTransactions = optionsSoldTransactions;
  }

  position.save();
}

export function loadOrCreatePosition(
  user: Address,
  oToken: string,
  numId: BigInt
): Position {
  let id = user.toHex() + "-" + oToken + "-" + numId.toString();
  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);
    // make sure there's an account enitity
    let account = loadOrCreateAccount(user.toHex());
    account.save();
    position.account = user.toHex();

    position.settleActions = [];

    position.oToken = oToken;
    position.netAmount = BIGINT_ZERO;
    position.longAmount = BIGINT_ZERO;
    position.shortAmount = BIGINT_ZERO;
    position.active = true;
    // position.writeOptionsTransactions = [];
    position.optionsBoughtTransactions = [];
    position.optionsSoldTransactions = [];
    position.optionsTransferTransactions = [];
    position.redeemActions = [];
  }
  return position as Position;
}

export function loadOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);
  // if no account, create new entity
  if (account == null) {
    account = new Account(accountId);
    account.vaultCount = new BigInt(0);
  }
  return account as Account;
}

export function updateBuyerPosition(
  buyer: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string
): void {
  let initPositionId = BIGINT_ZERO;
  let position = loadOrCreatePosition(buyer, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreatePosition(buyer, oToken, initPositionId);
  }
  position.netAmount = position.netAmount.plus(amount);
  position.longAmount = position.longAmount.plus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.longAmount.isZero() && position.shortAmount.isZero())
    position.active = false;

  let transactions = position.optionsTransferTransactions;
  transactions.push(tradeId);
  position.optionsTransferTransactions = transactions;
  position.save();
}

export function updateSellerPosition(
  seller: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string
): void {
  let initPositionId = BIGINT_ZERO;
  let position = loadOrCreatePosition(seller, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreatePosition(seller, oToken, initPositionId);
  }
  position.netAmount = position.netAmount.minus(amount);
  position.longAmount = position.longAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.longAmount.isZero() && position.shortAmount.isZero())
    position.active = false;

  let transactions = position.optionsTransferTransactions;
  transactions.push(tradeId);
  position.optionsTransferTransactions = transactions;
  position.save();
}

export function updateRedeemerPosition(
  redeemer: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string
): void {
  let initPositionId = BIGINT_ZERO;
  let position = loadOrCreatePosition(redeemer, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreatePosition(redeemer, oToken, initPositionId);
  }
  position.netAmount = position.netAmount.minus(amount);
  position.longAmount = position.longAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.longAmount.isZero() && position.shortAmount.isZero())
    position.active = false;

  let redeemActions = position.redeemActions;
  redeemActions.push(tradeId);
  position.redeemActions = redeemActions;
  position.save();
}

export function updateSettlerPosition(
  settler: Address,
  oToken: string,
  amount: BigInt,
  settleId: string
): void {
  let initPositionId = BIGINT_ZERO;
  let position = loadOrCreatePosition(settler, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreatePosition(settler, oToken, initPositionId);
  }

  position.netAmount = position.netAmount.plus(amount);
  position.longAmount = position.shortAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.longAmount.isZero() && position.shortAmount.isZero())
    position.active = false;

  let settleActions = position.settleActions;
  settleActions.push(settleId);
  position.settleActions = settleActions;
  position.save();
}
