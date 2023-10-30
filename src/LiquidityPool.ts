import { BigInt, Address, BigDecimal } from '@graphprotocol/graph-ts'
import {
  BuybackOption,
  Deposit,
  DepositEpochExecuted,
  InitiateWithdraw,
  Redeem,
  Withdraw,
  WriteOption,
  liquidityPool,
  WithdrawalEpochExecuted,
  RebalancePortfolioDelta,
} from '../generated/liquidityPool/liquidityPool'
import { chainlinkAggregator } from '../generated/liquidityPool/chainlinkAggregator'
import {
  BuybackOptionAction,
  // DailyStatSnapshot,
  DepositAction,
  InitiateWithdrawAction,
  LPBalance,
  RedeemSharesAction,
  RebalanceDeltaAction,
  WithdrawAction,
  WriteOptionsAction,
  PricePerShare,
} from '../generated/schema'
import { LIQUIDITY_POOL, CHAINLINK_AGGREGATOR } from './addresses'
import { BIGINT_ZERO } from './constants'

export function handleDeposit(event: Deposit): void {
  const depositAction = new DepositAction(event.transaction.hash.toHex())

  depositAction.address = event.params.recipient
  depositAction.amount = event.params.amount
  depositAction.epoch = event.params.epoch
  depositAction.timestamp = event.block.timestamp

  depositAction.save()

  let lp = LPBalance.load(event.params.recipient.toHex())

  if (lp == null) {
    lp = new LPBalance(event.params.recipient.toHex())
    lp.balance = BIGINT_ZERO
  }

  lp.balance = lp.balance.plus(event.params.amount)
  lp.save()
}

export function handleInitiateWithdraw(event: InitiateWithdraw): void {
  const initiateWithdrawAction = new InitiateWithdrawAction(event.transaction.hash.toHex())

  initiateWithdrawAction.address = event.params.recipient
  initiateWithdrawAction.amount = event.params.amount
  initiateWithdrawAction.epoch = event.params.epoch
  initiateWithdrawAction.timestamp = event.block.timestamp

  initiateWithdrawAction.save()
}

export function handleRedeem(event: Redeem): void {
  const redeemSharesAction = new RedeemSharesAction(event.transaction.hash.toHex())

  redeemSharesAction.address = event.params.recipient
  redeemSharesAction.amount = event.params.amount
  redeemSharesAction.epoch = event.params.epoch
  redeemSharesAction.timestamp = event.block.timestamp

  redeemSharesAction.save()
}

export function handleWithdraw(event: Withdraw): void {
  const withdrawAction = new WithdrawAction(event.transaction.hash.toHex())

  withdrawAction.address = event.params.recipient
  withdrawAction.amount = event.params.amount
  withdrawAction.timestamp = event.block.timestamp

  withdrawAction.save()

  let lp = LPBalance.load(event.params.recipient.toHex())

  if (lp) {
    lp.balance = lp.balance ? lp.balance.minus(event.params.amount) : event.params.amount
    lp.save()
  }
}

export function handleWriteOption(event: WriteOption): void {
  // const lpContract = liquidityPool.bind(Address.fromString(LIQUIDITY_POOL));

  const buyer = event.params.buyer
  const oToken = event.params.series.toHex()
  const amount = event.params.amount
  const premium = event.params.premium.times(BigInt.fromString('1000000000000')) // premium is 1e6 so needed to converted to 1e18 as amount
  const timestamp = event.block.timestamp

  const id = event.transaction.hash.toHex() + '-' + oToken

  const writeOptionAction = new WriteOptionsAction(id)

  writeOptionAction.otoken = oToken
  writeOptionAction.amount = amount //1e18
  writeOptionAction.premium = premium
  writeOptionAction.buyer = buyer
  writeOptionAction.escrow = event.params.escrow
  writeOptionAction.timestamp = timestamp
  writeOptionAction.transactionHash = event.transaction.hash.toHex()

  writeOptionAction.save()

  // updateOptionPosition(buyer, oToken, amount, id);

  // update total returns on daily snapshot
  // using the alpha launch timestamp to remove the test data 1664553600
  // if (timestamp.toI32() >= 1664553600 ) {
  // const dailyStatSnapshot = getDailySnapshot(timestamp)
  // dailyStatSnapshot.totalReturns = dailyStatSnapshot.totalReturns.plus(premium)
  // const totalAssets = lpContract.getAssets()
  // dailyStatSnapshot.totalAssets = totalAssets

  // dailyStatSnapshot.cumulativeYield = (dailyStatSnapshot.totalReturns.toBigDecimal())
  // .div(dailyStatSnapshot.totalAssets.toBigDecimal())
  // dailyStatSnapshot.save()
  // }
}

export function handleBuybackOption(event: BuybackOption): void {
  const seller = event.params.seller
  const oToken = event.params.series.toHex()
  const amount = event.params.amount
  const premium = event.params.premium.times(BigInt.fromString('1000000000000')) // premium is 1e6 so needed to converted to 1e18 as amount
  const timestamp = event.block.timestamp

  const id = event.transaction.hash.toHex() + '-' + oToken

  const buybackOptionAction = new BuybackOptionAction(event.transaction.hash.toHex())

  buybackOptionAction.otoken = oToken
  buybackOptionAction.amount = amount //1e18
  buybackOptionAction.premium = premium
  buybackOptionAction.seller = seller
  buybackOptionAction.timestamp = timestamp
  buybackOptionAction.transactionHash = event.transaction.hash.toHex()

  buybackOptionAction.save()
}

export function handleWithdrawalEpochExecuted(event: WithdrawalEpochExecuted): void {
  const lpContract = liquidityPool.bind(Address.fromString(LIQUIDITY_POOL))
  const chainlinkAggregatorContract = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR))

  const timestamp = event.block.timestamp
  // const totalAssets = lpContract.getAssets();
  const epoch = event.params.epoch

  // const dailyStatSnapshot = getDailySnapshot(timestamp)
  // dailyStatSnapshot.totalAssets = dailyStatSnapshot.totalReturns.plus(totalAssets)
  // dailyStatSnapshot.epoch = epoch
  // dailyStatSnapshot.save()

  const epochString = epoch.toString()

  const currentPricePerShare = lpContract.withdrawalEpochPricePerShare(epoch)
  const initialPricePerShare = lpContract.withdrawalEpochPricePerShare(BigInt.fromI32(0))

  let pricePerShare = new PricePerShare(epochString)

  pricePerShare.epoch = epoch
  pricePerShare.timestamp = timestamp

  /** Percentage Increase = [ (Final Value - Starting Value) / |Starting Value| ] × 100 */
  pricePerShare.growthSinceFirstEpoch = currentPricePerShare
    .minus(initialPricePerShare)
    .toBigDecimal()
    .div(initialPricePerShare.toBigDecimal())
    .times(BigDecimal.fromString('100'))
  pricePerShare.value = currentPricePerShare

  const ethPrice = chainlinkAggregatorContract.latestAnswer()
  pricePerShare.ethPrice = ethPrice

  pricePerShare.save()
}

export function handleRebalancePortfolioDelta(event: RebalancePortfolioDelta): void {
  const chainlinkAggregatorContract = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR))

  const id = event.transaction.hash.toHex()
  const timestamp = event.block.timestamp

  const rebalanceDeltaAction = new RebalanceDeltaAction(id)
  rebalanceDeltaAction.timestamp = timestamp
  rebalanceDeltaAction.deltaChange = event.params.deltaChange
  rebalanceDeltaAction.transactionHash = event.transaction.hash.toHex()

  const ethPrice = chainlinkAggregatorContract.latestAnswer()
  rebalanceDeltaAction.ethPrice = ethPrice

  rebalanceDeltaAction.save()
}
