import { BigDecimal, BigInt, Bytes, Address } from '@graphprotocol/graph-ts'

import {
  Account,
  Position
} from '../generated/schema';

export let BIGINT_ONE = BigInt.fromI32(1)
export let BIGINT_ZERO = BigInt.fromI32(0)
export let BIGDECIMAL_ZERO = BigDecimal.fromString('0')
export let BIGDECIMAL_ONE = BigDecimal.fromString('1')


export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const LIQUIDITY_POOL = "0xfD93dB0a7c1e373bdfE9b141693a25E4deb79dF2"
export const OPTION_REGISTRY = "0xF37D82c5ee757eE05B08ed469d1CC90c301c8636"

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS
}

export function updateBuyerPosition(buyer: Address, oToken: string, amount: BigInt, tradeId: string): void {

  let position = loadOrCreatePosition(buyer, oToken)

  position.amount = position.amount.plus(amount);
  // set position to inactive (closed) whenever we get back to amount = 0 
  if (position.amount.isZero()) position.active = false

  let writeOptionsTransactions = position.writeOptionsTransactions 
  writeOptionsTransactions.push(tradeId)
  position.writeOptionsTransactions = writeOptionsTransactions
  position.save()
}


export function loadOrCreatePosition(user: Address, oToken: string): Position {
  let id = user.toHex() + '-' + oToken
  let position = Position.load(id);
  if (position == null) {
    position = new Position(id);
    // make sure there's an account enitity
    let account = loadOrCreateAccount(user.toHex())
    account.save()
    position.account = user.toHex();

    position.oToken = oToken;
    position.amount = BIGINT_ZERO;
    position.active = true;
    position.writeOptionsTransactions = [];
    // position.settleActions = [];

  }
  return position as Position;
}

export function loadOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId);
  // if no account, create new entity
  if (account == null) {
    account = new Account(accountId);
  }
  return account as Account;
}