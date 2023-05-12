import { BigDecimal, BigInt, Address } from "@graphprotocol/graph-ts";

import { Account, LongPosition, ShortPosition } from "../generated/schema";

export let BIGINT_ONE = BigInt.fromI32(1);
export let BIGINT_ZERO = BigInt.fromI32(0);
export let BIGDECIMAL_ZERO = BigDecimal.fromString("0");
export let BIGDECIMAL_ONE = BigDecimal.fromString("1");

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const LIQUIDITY_POOL = "0x0b1bf5fb77aa36cd48baa1395bc2b5fa0f135d8c";
export const OPTION_EXCHANGE = "0xb672fe86693bf6f3b034730f5d2c77c8844d6b45";
export const OPTION_EXCHANGE_OLD = "0x63ce41ca4e30e75caf9b561e0250c25056b6e2c0";
export const OPTION_REGISTRY = "0x4e89cc3215af050ceb63ca62470eec7c1a66f737";
export const CONTROLLER = "0x11a602a5f5d823c103bb8b7184e22391aae5f4c2";

export const SHORT_OTOKEN_BURNED =
  "0xdd96b18f26fd9950581b9fd821fa907fc318845fc4d220b825a7b19bfdd174e8";
export const SHORT_OTOKEN_MINTED =
  "0x4d7f96086c92b2f9a254ad21548b1c1f2d99502c7949508866349b96bb1a8d8a";

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS;
}

export function updateOptionLongPosition(
  isBuy: boolean,
  trader: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  total: BigInt
): void {
  let initPositionId = BIGINT_ZERO;

  let position = loadOrCreateLongPosition(trader, oToken, initPositionId);

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreateLongPosition(trader, oToken, initPositionId);
  }

  position.netAmount = isBuy
    ? position.netAmount.plus(amount)
    : position.netAmount.minus(amount);

  position.realizedPnl = isBuy
    ? position.realizedPnl.minus(total)
    : position.realizedPnl.plus(total);

  if (isBuy) {
    position.buyAmount = position.buyAmount.plus(amount);
    const optionsBoughtTransactions = position.optionsBoughtTransactions;
    optionsBoughtTransactions.push(tradeId);
    position.optionsBoughtTransactions = optionsBoughtTransactions;
  } else if (!isBuy) {
    position.sellAmount = position.sellAmount.plus(amount);
    const optionsSoldTransactions = position.optionsSoldTransactions;
    optionsSoldTransactions.push(tradeId);
    position.optionsSoldTransactions = optionsSoldTransactions;
  }

  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false;

  position.save();
}

export function updateOptionShortPosition(
  isBuy: boolean,
  trader: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  total: BigInt
): void {
  let initPositionId = BIGINT_ZERO;

  let position = loadOrCreateShortPosition(trader, oToken, initPositionId);

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreateShortPosition(trader, oToken, initPositionId);
  }

  position.netAmount = isBuy
    ? position.netAmount.plus(amount)
    : position.netAmount.minus(amount);

  position.realizedPnl = isBuy
    ? position.realizedPnl.minus(total)
    : position.realizedPnl.plus(total);

  if (isBuy) {
    position.buyAmount = position.buyAmount.plus(amount);
    const optionsBoughtTransactions = position.optionsBoughtTransactions;
    optionsBoughtTransactions.push(tradeId);
    position.optionsBoughtTransactions = optionsBoughtTransactions;
  } else if (!isBuy) {
    position.sellAmount = position.sellAmount.plus(amount);
    const optionsSoldTransactions = position.optionsSoldTransactions;
    optionsSoldTransactions.push(tradeId);
    position.optionsSoldTransactions = optionsSoldTransactions;
  }

  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false;

  position.save();
}

export function loadOrCreateLongPosition(
  user: Address,
  oToken: string,
  numId: BigInt
): LongPosition {
  let id = user.toHex() + "-" + oToken + "-l-" + numId.toString();
  let position = LongPosition.load(id);
  if (position == null) {
    position = new LongPosition(id);
    // make sure there's an account enitity
    let account = loadOrCreateAccount(user.toHex());
    account.save();
    position.account = user.toHex();

    position.oToken = oToken;
    position.netAmount = BIGINT_ZERO;
    position.buyAmount = BIGINT_ZERO;
    position.sellAmount = BIGINT_ZERO;
    position.realizedPnl = BIGINT_ZERO;
    position.active = true;

    position.optionsBoughtTransactions = [];
    position.optionsSoldTransactions = [];
    position.optionsTransferTransactions = [];
    position.redeemActions = [];
  }
  return position as LongPosition;
}

export function loadOrCreateShortPosition(
  user: Address,
  oToken: string,
  numId: BigInt
): ShortPosition {
  let id = user.toHex() + "-" + oToken + "-s-" + numId.toString();
  let position = ShortPosition.load(id);
  if (position == null) {
    position = new ShortPosition(id);
    // make sure there's an account entity
    let account = loadOrCreateAccount(user.toHex());
    account.save();
    position.account = user.toHex();

    position.settleActions = [];

    position.oToken = oToken;

    position.netAmount = BIGINT_ZERO;
    position.buyAmount = BIGINT_ZERO;
    position.sellAmount = BIGINT_ZERO;
    position.realizedPnl = BIGINT_ZERO;
    position.active = true;

    position.optionsBoughtTransactions = [];
    position.optionsSoldTransactions = [];
  }
  return position as ShortPosition;
}

export function loadShortPosition(
  user: Address,
  oToken: string,
  numId: BigInt
): ShortPosition | null {
  let id = user.toHex() + "-" + oToken + "-s-" + numId.toString();
  let position = ShortPosition.load(id);
  return position;
}

export function loadLongPosition(
  user: Address,
  oToken: string,
  numId: BigInt
): LongPosition | null {
  let id = user.toHex() + "-" + oToken + "-l-" + numId.toString();
  let position = LongPosition.load(id);
  return position;
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
  let position = loadOrCreateLongPosition(buyer, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreateLongPosition(buyer, oToken, initPositionId);
  }
  position.netAmount = position.netAmount.plus(amount);
  position.buyAmount = position.buyAmount.plus(amount);

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
  let position = loadOrCreateLongPosition(seller, oToken, initPositionId);
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreateLongPosition(seller, oToken, initPositionId);
  }
  position.netAmount = position.netAmount.minus(amount);
  position.buyAmount = position.buyAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero longs and shorts
  if (position.netAmount.isZero()) position.active = false;

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
  let position = loadLongPosition(redeemer, oToken, initPositionId);

  if (position == null) {
    //  is not under a position
    return;
  }

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadLongPosition(redeemer, oToken, initPositionId);
    if (position == null) {
      // no active position found to update
      return;
    }
  }

  // BUG: what if user has more than "amount" oTokens as Exchange is not only access point
  // it is an edge case but definitely possible (as position would already be expired it's fine for now)
  position.netAmount = position.netAmount.minus(amount);
  position.buyAmount = position.buyAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero
  // or even if we go negative as user might be reedeming more than our Exchange position
  if (position.netAmount.lt(BIGINT_ZERO)) position.active = false;

  let redeemActions = position.redeemActions;
  redeemActions.push(tradeId);
  position.redeemActions = redeemActions;
  position.save();
}

export function updateSettlerPosition(
  settler: Address,
  oToken: string,
  amount: BigInt,
  settleId: string,
  vaultId: string
): void {
  let initPositionId = BIGINT_ZERO;
  let position = loadShortPosition(settler, oToken, initPositionId);

  if (position == null) {
    // vault is not under a position
    return;
  }

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadShortPosition(settler, oToken, initPositionId);
    if (position == null) {
      // vault is not under a position
      return;
    }
  }

  position.netAmount = position.netAmount.plus(amount);
  position.sellAmount = position.sellAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false;

  let settleActions = position.settleActions;
  settleActions.push(settleId);
  position.settleActions = settleActions;
  position.save();
}
