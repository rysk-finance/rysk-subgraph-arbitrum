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
export const LIQUIDITY_POOL = "0xfd93db0a7c1e373bdfe9b141693a25e4deb79df2"
export const OPTION_REGISTRY = "0xF37D82c5ee757eE05B08ed469d1CC90c301c8636"

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS
}

export function updateOptionPosition(isBuy: boolean, trader: Address, oToken: string, amount: BigInt, tradeId: string): void {

  let position = loadOrCreatePosition(trader, oToken)

  position.netAmount = isBuy ? position.netAmount.plus(amount) : position.netAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to amount = 0 
  if (position.netAmount.isZero()) position.active = false

  // let writeOptionsTransactions = position.writeOptionsTransactions 
  // writeOptionsTransactions.push(tradeId)
  // position.writeOptionsTransactions = writeOptionsTransactions

  if (isBuy) {
    position.longAmount = position.longAmount.plus(amount)
    const optionsBoughtTransactions = position.optionsBoughtTransactions
    optionsBoughtTransactions.push(tradeId)
    position.optionsBoughtTransactions = optionsBoughtTransactions    
  } else if (!isBuy) {
      position.shortAmount = position.shortAmount.minus(amount)
      const optionsSoldTransactions = position.optionsSoldTransactions
      optionsSoldTransactions.push(tradeId)
      position.optionsSoldTransactions = optionsSoldTransactions     
  }

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
    position.netAmount = BIGINT_ZERO;
    position.longAmount = BIGINT_ZERO;
    position.shortAmount = BIGINT_ZERO;
    position.active = true;
    // position.writeOptionsTransactions = [];
    position.optionsBoughtTransactions = [];
    position.optionsSoldTransactions = [];
    position.optionsTransferTransactions = [];
    // position.settleActions = [];

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