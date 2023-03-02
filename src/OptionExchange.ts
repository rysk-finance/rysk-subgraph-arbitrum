import { CollateralApprovalChanged } from "../generated/OptionExchange/OptionExchange";
import {
  OptionsBought,
  OptionsSold
} from '../generated/OptionExchange/OptionExchange';

import {
  OptionsBoughtAction,
  OptionsSoldAction,
  Collateral
} from '../generated/schema';

import { updateOptionPosition } from './helper';

export function handleCollateralApprovalChanged(
  event: CollateralApprovalChanged
): void {
  // Load or create collateral
  let collateral = Collateral.load(event.params.collateral.toHexString());

  if (collateral == null) {
    collateral = new Collateral(event.params.collateral.toHexString());
    collateral.calls = false;
    collateral.puts = false;
  }

  if (event.params.isPut) {
    collateral.puts = event.params.isApproved;
  } else {
    collateral.calls = event.params.isApproved;
  }

  collateral.save();
}

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
