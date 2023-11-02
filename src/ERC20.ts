import { Address } from '@graphprotocol/graph-ts'

import { Transfer } from '../generated/ARB/ERC20'
import { chainlinkAggregator } from '../generated/ARB/chainlinkAggregator'
import { AirdropRecipient, AirdropTransaction } from '../generated/schema'
import { CHAINLINK_AGGREGATOR_ARB_USD, TREASURY } from './addresses'
import { BIGINT_ZERO, BIG_DECIMAL_1e18, BIG_DECIMAL_1e8 } from './constants'

export function handleTransfer(event: Transfer): void {
  const amount = event.params.value
  const fromAddress = event.params.from
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

  if (fromAddress.toHexString() == TREASURY) {
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
  }
}
