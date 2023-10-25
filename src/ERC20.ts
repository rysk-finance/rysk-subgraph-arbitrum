import { Address } from '@graphprotocol/graph-ts'

import { Transfer } from '../generated/ARB/ERC20'
import { chainlinkAggregator } from '../generated/ARB/chainlinkAggregator'
import { ARBTreasuryAirdrop } from '../generated/schema'
import { CHAINLINK_AGGREGATOR_ARB_USD, TREASURY } from './helper'

export function handleTransfer(event: Transfer): void {
  const chainlinkAggregatorContractARB = chainlinkAggregator.bind(Address.fromString(CHAINLINK_AGGREGATOR_ARB_USD))
  const arbPrice = chainlinkAggregatorContractARB.latestAnswer()

  const fromAddress = event.params.from

  if (fromAddress.toHexString() == TREASURY) {
    const entity = new ARBTreasuryAirdrop(event.transaction.hash.toHex())

    entity.address = event.address
    entity.decimals = 18
    entity.name = 'Arbitrum'
    entity.symbol = 'ARB'

    entity.amount = event.params.value
    entity.arbPrice = arbPrice
    entity.from = fromAddress
    entity.to = event.params.to

    entity.save()
  }
}
