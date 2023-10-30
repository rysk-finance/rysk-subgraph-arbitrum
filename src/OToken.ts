import { Transfer } from '../generated/templates/OToken/OToken'

import { OToken, AccountBalance, OptionsTransferAction } from '../generated/schema'
import { Address, BigInt } from '@graphprotocol/graph-ts'
import { BIGINT_ZERO, BIGINT_ONE, ZERO_ADDRESS } from './constants'
import {
  getVaultIdFromLogs,
  LIQUIDITY_POOL,
  LIQUIDITY_POOL_OLD,
  loadOrCreateAccount,
  OPTION_EXCHANGE,
  OPTION_EXCHANGE_OLD,
  OPTION_REGISTRY,
  updateBuyerPosition,
  updateSellerPosition,
  MARGIN_POOL,
  loadLongPosition,
} from './helper'

export function handleTransfer(event: Transfer): void {
  // Load oToken entity
  let entity = OToken.load(event.address.toHex())
  let amount = event.params.value

  const toAddress = event.params.to
  const fromAddress = event.params.from

  const receipt = event.receipt
  const txLogs = receipt ? receipt.logs : []

  // @todo Get these from AddressBook
  // note old option exchange needs to be excluded cause we are still using it for testing
  let excludedAddresses = [LIQUIDITY_POOL, LIQUIDITY_POOL_OLD, OPTION_REGISTRY, OPTION_EXCHANGE, OPTION_EXCHANGE_OLD]

  // convert to 1e18 cause LP handleWriteOptions is 1e18
  const amountLP = amount.times(BigInt.fromString('10000000000'))

  // Set vaultId on long position if transferred from the user to the margin pool.
  if (toAddress.toHexString() == MARGIN_POOL) {
    const receipt = event.receipt
    const txLogs = receipt ? receipt.logs : []

    const vaultId = getVaultIdFromLogs(fromAddress, txLogs)
    const oToken = event.address.toHexString()

    let initPositionId = BIGINT_ZERO
    let position = loadLongPosition(fromAddress, oToken, initPositionId, vaultId)

    if (position == null) return

    // Get the first active position for this oToken.
    while (!position.active) {
      initPositionId = initPositionId.plus(BIGINT_ONE)
      position = loadLongPosition(fromAddress, oToken, initPositionId, vaultId)

      if (position == null) return
    }

    position.vaultId = BigInt.fromString(vaultId)
    position.save()
  }

  if (fromAddress.toHex() == ZERO_ADDRESS) {
    // Mint Operation
    if (entity != null) {
      entity.totalSupply = entity.totalSupply.plus(amount)
    }

    // update account balance
    let accountBalance = getOrCreateAccountBalance(toAddress, entity as OToken)
    accountBalance.balance = accountBalance.balance.plus(amount)
    accountBalance.save()
  } else if (toAddress.toHex() == ZERO_ADDRESS) {
    // Burn event
    if (entity != null) {
      entity.totalSupply = entity.totalSupply.minus(event.params.value)
    }

    let accountBalance = getOrCreateAccountBalance(fromAddress, entity as OToken)
    accountBalance.balance = accountBalance.balance.minus(amount)
    accountBalance.save()
  } else {
    let sourceAccount = getOrCreateAccountBalance(fromAddress, entity as OToken)
    sourceAccount.balance = sourceAccount.balance.minus(amount)
    sourceAccount.save()

    let destinationAccount = getOrCreateAccountBalance(toAddress, entity as OToken)
    destinationAccount.balance = destinationAccount.balance.plus(amount)
    destinationAccount.save()

    // exclude txs with options registry, exchange and liquidity pool since already handled by OptionsSold and Options Bought
    if (!(excludedAddresses.includes(toAddress.toHex()) || excludedAddresses.includes(fromAddress.toHex()))) {
      const vaultId = getVaultIdFromLogs(fromAddress, txLogs)

      const optionsTransferTransaction = new OptionsTransferAction(event.transaction.hash.toHex())

      optionsTransferTransaction.otoken = event.address.toHex()
      optionsTransferTransaction.from = fromAddress
      optionsTransferTransaction.to = toAddress
      optionsTransferTransaction.amount = amount
      optionsTransferTransaction.timestamp = event.block.timestamp
      optionsTransferTransaction.transactionHash = event.transaction.hash.toHex()

      optionsTransferTransaction.save()

      updateBuyerPosition(toAddress, event.address.toHex(), amountLP, optionsTransferTransaction.id, vaultId)

      updateSellerPosition(fromAddress, event.address.toHex(), amountLP, optionsTransferTransaction.id, vaultId)
    }
  }

  if (entity != null) {
    entity.save()
  }
}

function getOrCreateAccountBalance(address: Address, token: OToken): AccountBalance {
  // make sure we create the account entity.
  let accountEntityId = address.toHex()
  let account = loadOrCreateAccount(accountEntityId)
  account.save()

  let entityId = address.toHex() + '-' + token.id
  let accountBalance = AccountBalance.load(entityId)
  if (accountBalance != null) return accountBalance as AccountBalance

  accountBalance = new AccountBalance(entityId)

  accountBalance.token = token.id
  accountBalance.account = address.toHex()
  accountBalance.balance = BIGINT_ZERO

  return accountBalance as AccountBalance
}
