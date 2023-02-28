
import {
  OptionsBought,
  OptionsSold
} from '../generated/OptionHandler/OptionHandler';

import {
  OptionsBoughtAction,
  OptionsSoldAction
} from '../generated/schema';
import { updateOptionPosition } from './helper';

export function handleOptionsBought(event: OptionsBought): void {

  const id = event.transaction.hash.toHex()
  const buyer = event.params.buyer
  const otoken = event.params.series.toHex()
  const amount = event.params.optionAmount

  const optionsBoughtAction = new OptionsBoughtAction(id)

  optionsBoughtAction.otoken = otoken
  optionsBoughtAction.buyer = buyer
  optionsBoughtAction.amount = amount
  optionsBoughtAction.premium = event.params.premium
  optionsBoughtAction.fee = event.params.fee
  optionsBoughtAction.timestamp = event.block.timestamp
  optionsBoughtAction.transactionHash = event.transaction.hash.toHex()

  optionsBoughtAction.save()

  updateOptionPosition(true, buyer, otoken, amount, id)

}

export function handleOptionsSold(event: OptionsSold): void {

  const id = event.transaction.hash.toHex()
  const seller = event.params.seller
  const otoken = event.params.series.toHex()
  const amount = event.params.optionAmount

  const optionsSoldAction = new OptionsSoldAction(id)

  optionsSoldAction.otoken = otoken
  optionsSoldAction.seller = seller
  optionsSoldAction.amount = amount
  optionsSoldAction.premium = event.params.premium
  optionsSoldAction.fee = event.params.fee
  optionsSoldAction.timestamp = event.block.timestamp
  optionsSoldAction.transactionHash = event.transaction.hash.toHex()

  optionsSoldAction.save()

  updateOptionPosition(false, seller, otoken, amount, id)

}