import { Transfer } from "../generated/templates/OToken/OToken"

import { OToken, AccountBalance } from '../generated/schema'
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { BIGINT_ZERO, loadOrCreateAccount, loadOrCreatePosition, ZERO_ADDRESS } from "./helper"

export function handleTransfer(event: Transfer): void {
  // Load oToken entity
  let entity = OToken.load(event.address.toHex())
  let amount = event.params.value
  
  // convert to 1e18 cause LP handleWriteOptions is 1e18 
  const amountLP = amount.times( BigInt.fromString('10000000000') )

  if (event.params.from.toHex() == ZERO_ADDRESS) {
    // Mint Operation

    // update account balance
    let accountBalance = getOrCreateAccountBalance(event.params.to, entity as OToken)
    accountBalance.balance = accountBalance.balance.plus(amount)
    accountBalance.save()

  } else if (event.params.to.toHex() == ZERO_ADDRESS) {
    // Burn event

    let accountBalance = getOrCreateAccountBalance(event.params.from, entity as OToken)
    accountBalance.balance = accountBalance.balance.minus(amount)
    accountBalance.save()
  } else {
    let sourceAccount = getOrCreateAccountBalance(event.params.from, entity as OToken)
    sourceAccount.balance = sourceAccount.balance.minus(amount)
    sourceAccount.save()

    let destinationAccount = getOrCreateAccountBalance(event.params.to, entity as OToken)
    destinationAccount.balance = destinationAccount.balance.plus(amount)
    destinationAccount.save()


    let sourceAccountPosition = loadOrCreatePosition(event.params.from, event.address.toHex());
    sourceAccountPosition.amount =  sourceAccountPosition.amount.minus( amountLP )
    sourceAccountPosition.save()

    let destinationAccountPosition = loadOrCreatePosition(event.params.to, event.address.toHex());
    destinationAccountPosition.amount =  destinationAccountPosition.amount.plus( amountLP )
    destinationAccountPosition.save()
  }

}

function getOrCreateAccountBalance(address: Address, token: OToken): AccountBalance {

  // make sure we create the account entity.
  let accountEntityId = address.toHex()
  let account = loadOrCreateAccount(accountEntityId)
  account.save()

  let entityId = address.toHex() + '-' + token.id;
  let accountBalance = AccountBalance.load(entityId)
  if (accountBalance != null) return accountBalance as AccountBalance

  accountBalance = new AccountBalance(entityId)
  
  accountBalance.token = token.id;
  accountBalance.account = address.toHex()
  accountBalance.balance = BIGINT_ZERO

  return accountBalance as AccountBalance
}