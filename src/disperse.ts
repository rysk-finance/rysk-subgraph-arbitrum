import { Address } from '@graphprotocol/graph-ts'

import { TokenDispersed } from '../generated/Disperse/Disperse'
import { chainlinkAggregator } from '../generated/Disperse/chainlinkAggregator'
import { AirdropRecipient, AirdropTransaction } from '../generated/schema'
import { ARB_ADDRESS, CHAINLINK_AGGREGATOR_ARB_USD, TREASURY } from './addresses'
import { BIGINT_ZERO, BIG_DECIMAL_1e18, BIG_DECIMAL_1e8 } from './constants'
import { loadOrCreateAirdropStats } from './helper'

export function handleTokenDisperse(event: TokenDispersed): void {
  const fromAddress = event.params.from
  const token = event.params.token

  if (fromAddress.toHexString() == TREASURY && token.toHexString() == ARB_ADDRESS) {
    const amount = event.params.amount
    const toAddress = event.params.to
    const transactionHash = event.transaction.hash.toHex()

    // get current ARB price.
    const chainlinkAggregatorContractARB = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR_ARB_USD))
    const arbPrice = chainlinkAggregatorContractARB.try_latestAnswer()

    // Get USD value.
    const price = !arbPrice.reverted ? arbPrice.value.toBigDecimal().div(BIG_DECIMAL_1e8) : BIGINT_ZERO.toBigDecimal()
    const value = amount
      .toBigDecimal()
      .div(BIG_DECIMAL_1e18)
      .times(price)

    // Get AirdropStats and update total ARB and total value.
    const airdropStat = loadOrCreateAirdropStats()

    const totalAirdropArb = airdropStat.totalArb
    const totalAirdropValue = airdropStat.totalValue

    airdropStat.totalArb = totalAirdropArb.plus(amount)
    airdropStat.totalValue = totalAirdropValue.plus(value)

    airdropStat.save()

    // Create transaction entity.
    const newTransaction = new AirdropTransaction(transactionHash)

    newTransaction.timestamp = event.block.timestamp
    newTransaction.address = event.address
    newTransaction.decimals = 18
    newTransaction.name = 'Arbitrum'
    newTransaction.symbol = 'ARB'

    newTransaction.amount = amount
    newTransaction.arbPrice = !arbPrice.reverted ? arbPrice.value : BIGINT_ZERO
    newTransaction.from = fromAddress
    newTransaction.to = toAddress

    newTransaction.save()

    // Load existing user and update with new transaction.
    const user = AirdropRecipient.load(toAddress.toHex())

    if (user) {
      const userTransactions = user.transactions
      userTransactions.push(transactionHash)
      user.transactions = userTransactions

      const totalTokens = user.totalTokens
      user.totalTokens = totalTokens.plus(amount)

      const totalValue = user.totalValue
      user.totalValue = totalValue.plus(value)

      user.save()

      return
    }

    // If no user was found, create a new one.
    const newUser = new AirdropRecipient(toAddress.toHex())

    newUser.totalTokens = amount
    newUser.totalValue = value
    newUser.transactions = [transactionHash]

    newUser.save()

    // Update AirdropStats with new user.
    const totalAirdropRecipients = airdropStat.totalRecipients

    airdropStat.totalRecipients = totalAirdropRecipients + 1

    airdropStat.save()
  }
}
