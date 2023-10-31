import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

import { OptionsBought, OptionsSold } from '../generated/OptionExchange/OptionExchange'
import { chainlinkAggregator } from '../generated/OptionExchange/chainlinkAggregator'
import { Account, LongPosition, OptionsBoughtAction, OptionsSoldAction, ShortPosition, Stat } from '../generated/schema'
import { CHAINLINK_AGGREGATOR, CONTROLLER } from './addresses'
import { BIGINT_ONE, BIGINT_ZERO, DEFAULT_VAULT_ID, ZERO_ADDRESS } from './constants'

export const SHORT_OTOKEN_BURNED = '0xdd96b18f26fd9950581b9fd821fa907fc318845fc4d220b825a7b19bfdd174e8'
export const SHORT_OTOKEN_MINTED = '0x4d7f96086c92b2f9a254ad21548b1c1f2d99502c7949508866349b96bb1a8d8a'

const COLLATERAL_ASSET_DEPOSITED = '0xbfab88b861f171b7db714f00e5966131253918d55ddba816c3eb94657d102390'
const COLLATERAL_ASSET_WITHDRAWN = '0xfe86f7694b6c54a528acbe27be61dd4a85e9a89aeef7f650a1b439045ccee5a4'
const LONG_OTOKEN_DEPOSITED = '0x2607e210004cef0ad6b3e6aedb778bffb03c1586f8dcf55d49afffde210d8bb1'
const LONG_OTOKEN_WITHDRAWN = '0xbd023c53d293da163d185720d4274f4ddabc09d5304491a55abb296cc811d9fa'

export function isZeroAddress(value: Address): boolean {
  return value.toHex() == ZERO_ADDRESS
}

function updateOptionLongPosition(
  isBuy: boolean,
  trader: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  total: BigInt,
  vaultId: string,
): void {
  let initPositionId = BIGINT_ZERO

  let position = loadOrCreateLongPosition(trader, oToken, initPositionId, vaultId)

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadOrCreateLongPosition(trader, oToken, initPositionId, vaultId)
  }

  position.netAmount = isBuy ? position.netAmount.plus(amount) : position.netAmount.minus(amount)

  position.realizedPnl = isBuy ? position.realizedPnl.minus(total) : position.realizedPnl.plus(total)

  if (isBuy) {
    position.buyAmount = position.buyAmount.plus(amount)
    const optionsBoughtTransactions = position.optionsBoughtTransactions
    optionsBoughtTransactions.push(tradeId)
    position.optionsBoughtTransactions = optionsBoughtTransactions
  } else if (!isBuy) {
    position.sellAmount = position.sellAmount.plus(amount)
    const optionsSoldTransactions = position.optionsSoldTransactions
    optionsSoldTransactions.push(tradeId)
    position.optionsSoldTransactions = optionsSoldTransactions
  }

  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false

  position.save()
}

export function updateOptionShortPosition(
  isBuy: boolean,
  trader: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  total: BigInt,
  vaultId: string,
): void {
  let initPositionId = BIGINT_ZERO

  let position = loadOrCreateShortPosition(trader, oToken, initPositionId, vaultId)

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadOrCreateShortPosition(trader, oToken, initPositionId, vaultId)
  }

  position.netAmount = isBuy ? position.netAmount.plus(amount) : position.netAmount.minus(amount)

  position.realizedPnl = isBuy ? position.realizedPnl.minus(total) : position.realizedPnl.plus(total)

  if (isBuy) {
    position.buyAmount = position.buyAmount.plus(amount)
    const optionsBoughtTransactions = position.optionsBoughtTransactions
    optionsBoughtTransactions.push(tradeId)
    position.optionsBoughtTransactions = optionsBoughtTransactions
  } else if (!isBuy) {
    position.sellAmount = position.sellAmount.plus(amount)
    const optionsSoldTransactions = position.optionsSoldTransactions
    optionsSoldTransactions.push(tradeId)
    position.optionsSoldTransactions = optionsSoldTransactions
  }

  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false

  position.save()
}

export function loadOrCreateLongPosition(user: Address, oToken: string, numId: BigInt, vaultId: string): LongPosition {
  let id = user.toHex() + '-' + oToken + '-l-' + numId.toString() + '-' + vaultId
  let position = LongPosition.load(id)
  if (position == null) {
    position = new LongPosition(id)
    // make sure there's an account enitity
    let account = loadOrCreateAccount(user.toHex())
    account.save()
    position.account = user.toHex()

    position.oToken = oToken
    position.netAmount = BIGINT_ZERO
    position.buyAmount = BIGINT_ZERO
    position.sellAmount = BIGINT_ZERO
    position.realizedPnl = BIGINT_ZERO
    position.active = true

    position.optionsBoughtTransactions = []
    position.optionsSoldTransactions = []
    position.optionsTransferTransactions = []
    position.redeemActions = []
  }
  return position as LongPosition
}

export function loadOrCreateShortPosition(
  user: Address,
  oToken: string,
  numId: BigInt,
  vaultId: string,
): ShortPosition {
  let id = user.toHex() + '-' + oToken + '-s-' + numId.toString() + '-' + vaultId
  let position = ShortPosition.load(id)
  if (position == null) {
    position = new ShortPosition(id)
    // make sure there's an account entity
    let account = loadOrCreateAccount(user.toHex())
    account.save()
    position.account = user.toHex()

    position.settleActions = []

    position.oToken = oToken

    position.netAmount = BIGINT_ZERO
    position.buyAmount = BIGINT_ZERO
    position.sellAmount = BIGINT_ZERO
    position.realizedPnl = BIGINT_ZERO
    position.active = true

    position.optionsBoughtTransactions = []
    position.optionsSoldTransactions = []
  }
  return position as ShortPosition
}

export function loadShortPosition(user: Address, oToken: string, numId: BigInt, vaultId: string): ShortPosition | null {
  let id = user.toHex() + '-' + oToken + '-s-' + numId.toString() + '-' + vaultId
  let position = ShortPosition.load(id)
  return position
}

export function loadLongPosition(
  user: Address,
  oToken: string,
  numId: BigInt,
  vaultId: string = DEFAULT_VAULT_ID,
): LongPosition | null {
  let id = user.toHex() + '-' + oToken + '-l-' + numId.toString() + '-' + vaultId
  let position = LongPosition.load(id)
  return position
}

export function loadOrCreateAccount(accountId: string): Account {
  let account = Account.load(accountId)
  // if no account, create new entity
  if (account == null) {
    account = new Account(accountId)
    account.vaultCount = new BigInt(0)
    account.operatorCount = new BigInt(0)
  }
  return account as Account
}

export function updateBuyerPosition(
  buyer: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  vaultId: string,
): void {
  let initPositionId = BIGINT_ZERO
  let position = loadOrCreateLongPosition(buyer, oToken, initPositionId, vaultId)
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadOrCreateLongPosition(buyer, oToken, initPositionId, vaultId)
  }
  position.netAmount = position.netAmount.plus(amount)
  position.buyAmount = position.buyAmount.plus(amount)

  let transactions = position.optionsTransferTransactions
  transactions.push(tradeId)
  position.optionsTransferTransactions = transactions
  position.save()
}

export function updateSellerPosition(
  seller: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  vaultId: string,
): void {
  let initPositionId = BIGINT_ZERO
  let position = loadOrCreateLongPosition(seller, oToken, initPositionId, vaultId)
  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadOrCreateLongPosition(seller, oToken, initPositionId, vaultId)
  }

  // If the position is part of a naked long.
  if (vaultId == DEFAULT_VAULT_ID) {
    position.netAmount = position.netAmount.minus(amount)
    position.buyAmount = position.buyAmount.minus(amount)

    // If the position reaches net zero, it is user transferred so we mark it as inactive.
    if (position.netAmount.isZero()) position.active = false
  }

  // If the position has a vaultId, it is being transferred to a vault as collateral so we keep it unchanged.

  let transactions = position.optionsTransferTransactions
  transactions.push(tradeId)
  position.optionsTransferTransactions = transactions
  position.save()
}

export function updateRedeemerPosition(
  redeemer: Address,
  oToken: string,
  amount: BigInt,
  tradeId: string,
  payout: BigInt, // expected to be in the same format as realizedPnl
): void {
  let initPositionId = BIGINT_ZERO
  let position = loadLongPosition(redeemer, oToken, initPositionId)

  if (position == null) {
    //  is not under a position
    return
  }

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadLongPosition(redeemer, oToken, initPositionId)
    if (position == null) {
      // no active position found to update
      return
    }
  }

  // BUG: what if user has more than "amount" oTokens as Exchange is not only access point
  // it is an edge case but definitely possible (as position would already be expired it's fine for now)
  position.netAmount = position.netAmount.minus(amount)
  // remove this because buyAmount should not update on redeem
  // position.buyAmount = position.buyAmount.minus(amount);

  // add realizedPnl to position (redeem only affects LONGS so no nede to check if isBuy)
  position.realizedPnl = position.realizedPnl.plus(payout)

  // set position to inactive (closed) whenever we get back to zero
  // or even if we go negative as user might be reedeming more than our Exchange position
  if (position.netAmount.le(BIGINT_ZERO)) position.active = false

  let redeemActions = position.redeemActions
  redeemActions.push(tradeId)
  position.redeemActions = redeemActions
  position.save()
}

export function updateSettlerPosition(
  settler: Address,
  oToken: string,
  amount: BigInt,
  settleId: string,
  vaultId: string,
  loss: BigInt,
): void {
  let initPositionId = BIGINT_ZERO
  let position = loadShortPosition(settler, oToken, initPositionId, vaultId)

  if (position == null) {
    // vault is not under a position
    return
  }

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadShortPosition(settler, oToken, initPositionId, vaultId)
    if (position == null) {
      // vault is not under a position
      return
    }
  }

  position.netAmount = position.netAmount.plus(amount)
  // remove this because sellAmount shouldnt change on settle
  // position.sellAmount = position.sellAmount.minus(amount);

  // subtract loss (amount that stays in vault for redeem)
  position.realizedPnl = position.realizedPnl.minus(loss)

  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false

  let settleActions = position.settleActions
  settleActions.push(settleId)
  position.settleActions = settleActions
  position.save()
}

export function updateLiquidatedPosition(
  address: Address, // account being liquidated
  oToken: string, // vault short oToken being liquidated
  amount: BigInt, // oToken amount being liquidated
  liquidationId: string, // vault action of liquidation
  vaultId: string, // Int ID of vault.
): void {
  let initPositionId = BIGINT_ZERO
  let position = loadShortPosition(address, oToken, initPositionId, vaultId)

  if (position == null) {
    // vault is not under a position
    return
  }

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE)
    position = loadShortPosition(address, oToken, initPositionId, vaultId)
    if (position == null) {
      // vault is not under a position
      return
    }
  }

  position.netAmount = position.netAmount.plus(amount)
  // remove this so we can keep track of historical before liquidation
  // position.sellAmount = position.sellAmount.minus(amount);
  // set position to inactive (closed) whenever we get back to zero
  if (position.netAmount.isZero()) position.active = false

  let liquidateActions = position.liquidateActions

  if (liquidateActions == null) {
    liquidateActions = []
  }

  liquidateActions.push(liquidationId)
  position.liquidateActions = liquidateActions
  position.save()
}

export function getVaultIdFromLogs(account: Address, txLogs: ethereum.Log[]): string {
  // Check TX logs to find the presence of a vault ID or default to zero.
  let vaultId = DEFAULT_VAULT_ID
  const logsLength = txLogs.length

  for (let index = 0; index < logsLength; index++) {
    if (txLogs[index].address.toHexString() == CONTROLLER) {
      const topicZero = txLogs[index].topics[0].toHexString()

      if (
        topicZero == COLLATERAL_ASSET_DEPOSITED ||
        topicZero == COLLATERAL_ASSET_WITHDRAWN ||
        topicZero == LONG_OTOKEN_DEPOSITED ||
        topicZero == LONG_OTOKEN_WITHDRAWN
      ) {
        const topicAddress = txLogs[index].topics[2]
          .toHexString()
          .split('000000000000000000000000')
          .join('')

        if (topicAddress == account.toHexString()) {
          const decodedVaultId = ethereum.decode('(uint256,unit256)', txLogs[index].data)

          if (decodedVaultId) {
            vaultId = decodedVaultId
              .toTuple()[0]
              .toBigInt()
              .toString()
            break
          }
        }
      }
    }
  }

  return vaultId
}

export function getCollateralDepositedFromLogs(account: Address, txLogs: ethereum.Log[]): BigInt {
  // Check TX logs to find the presence of a collateral deposited to check open sell or default to zero collateral
  let collateralAmount = BIGINT_ZERO
  const logsLength = txLogs.length

  for (let index = 0; index < logsLength; index++) {
    if (txLogs[index].address.toHexString() == CONTROLLER) {
      const topicZero = txLogs[index].topics[0].toHexString()

      if (topicZero == COLLATERAL_ASSET_DEPOSITED) {
        const topicAddress = txLogs[index].topics[2]
          .toHexString()
          .split('000000000000000000000000')
          .join('')

        if (topicAddress == account.toHexString()) {
          const decodedAmount = ethereum.decode('(uint256,unit256)', txLogs[index].data)

          if (decodedAmount) {
            collateralAmount = decodedAmount.toTuple()[1].toBigInt()

            break
          }
        }
      }
    }
  }

  return collateralAmount
}

export function addOptionsBoughtAction(event: OptionsBought): void {
  const chainlinkAggregatorContract = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR))

  const txHash = event.transaction.hash.toHex()

  const otoken = event.params.series.toHex()
  const buyer = event.params.buyer
  const amount = event.params.optionAmount
  const premium = event.params.premium
  const fee = event.params.fee
  const timestamp = event.block.timestamp
  const from = event.transaction.from
  const receipt = event.receipt
  const txLogs = receipt ? receipt.logs : []

  const id = txHash + '-' + otoken

  const optionsBoughtAction = new OptionsBoughtAction(id)

  optionsBoughtAction.otoken = otoken
  optionsBoughtAction.buyer = buyer
  optionsBoughtAction.amount = amount
  optionsBoughtAction.premium = premium
  optionsBoughtAction.fee = fee
  optionsBoughtAction.timestamp = timestamp
  optionsBoughtAction.transactionHash = txHash

  const ethPrice = chainlinkAggregatorContract.latestAnswer()
  optionsBoughtAction.ethPrice = ethPrice

  optionsBoughtAction.save()

  const total = premium.plus(fee)

  // add fees to stats
  updateStats(amount, fee, true)

  const vaultId = getVaultIdFromLogs(buyer, txLogs)

  for (let i = 0; i < txLogs.length; ++i) {
    // if event is to Controller, avoid reading all events
    if (txLogs[i].address.toHexString() == CONTROLLER) {
      // if topic is ShortOtokenBurned and account owner is tx sender (trader)
      if (
        txLogs[i].topics[0].toHexString() == SHORT_OTOKEN_BURNED &&
        txLogs[i].topics[2].toHexString().slice(26) == from.toHexString().slice(2)
      ) {
        // if topic is shortOTokenBurned and account owner is tx sender (trader)
        updateOptionShortPosition(true, buyer, otoken, amount, id, total, vaultId)
        return
      }
    }
  }

  updateOptionLongPosition(true, buyer, otoken, amount, id, total, vaultId)
}

export function addOptionsSoldAction(event: OptionsSold): void {
  const chainlinkAggregatorContract = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR))

  const txHash = event.transaction.hash.toHex()

  const receipt = event.receipt
  const txLogs = receipt ? receipt.logs : []

  const seller = event.params.seller
  const otoken = event.params.series.toHex()
  const amount = event.params.optionAmount

  const id = txHash + '-' + otoken

  const optionsSoldAction = new OptionsSoldAction(id)

  optionsSoldAction.otoken = otoken
  optionsSoldAction.seller = seller
  optionsSoldAction.amount = amount
  optionsSoldAction.premium = event.params.premium
  optionsSoldAction.fee = event.params.fee
  optionsSoldAction.timestamp = event.block.timestamp
  optionsSoldAction.transactionHash = event.transaction.hash.toHex()

  const ethPrice = chainlinkAggregatorContract.latestAnswer()
  optionsSoldAction.ethPrice = ethPrice

  const collateralAmount = getCollateralDepositedFromLogs(seller, txLogs)

  optionsSoldAction.isOpen = !collateralAmount.isZero()
  optionsSoldAction.collateralAmount = collateralAmount

  optionsSoldAction.save()

  const total = event.params.premium.minus(event.params.fee)

  // add fees to stats
  updateStats(event.params.optionAmount, event.params.fee, false)

  const vaultId = getVaultIdFromLogs(seller, txLogs)

  for (let i = 0; i < txLogs.length; ++i) {
    // if event is to Controller, avoid reading all events
    if (txLogs[i].address.toHexString() == CONTROLLER) {
      // if topic is ShortOtokenMinted and account owner is tx sender (trader)
      if (
        txLogs[i].topics[0].toHexString() == SHORT_OTOKEN_MINTED &&
        txLogs[i].topics[2].toHexString().slice(26) == event.transaction.from.toHexString().slice(2)
      ) {
        // if topic is shortOtokenMinted and account owner is tx sender (trader)

        updateOptionShortPosition(false, seller, otoken, amount, id, total, vaultId)
        return
      }
    }
  }
  updateOptionLongPosition(false, seller, otoken, amount, id, total, vaultId)
}

// dashboard functions

export function updateStats(amount: BigInt, fees: BigInt, isBuy: boolean): void {
  let stats = loadOrCreateStats()

  if (isBuy) {
    stats.totalFeesBought = stats.totalFeesBought.plus(fees)
    stats.volumeOptionsBought = stats.volumeOptionsBought.plus(amount)
  } else {
    stats.totalFeesSold = stats.totalFeesSold.plus(fees)
    stats.volumeOptionsSold = stats.volumeOptionsSold.plus(amount)
  }
  stats.save()
}

export function loadOrCreateStats(): Stat {
  let stats = Stat.load('0')

  if (!stats) {
    stats = new Stat('0')
    stats.totalFeesSold = BIGINT_ZERO
    stats.totalFeesBought = BIGINT_ZERO
    stats.volumeOptionsBought = BIGINT_ZERO
    stats.volumeOptionsSold = BIGINT_ZERO
  }

  return stats
}
