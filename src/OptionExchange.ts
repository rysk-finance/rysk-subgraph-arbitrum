import { CollateralApprovalChanged } from "../generated/OptionExchange/OptionExchange";
import {
  OptionsBought,
  OptionsSold
} from "../generated/OptionExchange/OptionExchange";

import {
  OptionsBoughtAction,
  OptionsSoldAction,
  Collateral
} from "../generated/schema";

import {
  updateStats,
  CONTROLLER,
  SHORT_OTOKEN_BURNED,
  SHORT_OTOKEN_MINTED,
  updateOptionLongPosition,
  updateOptionShortPosition
} from "./helper";

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
  const txHash = event.transaction.hash.toHex();

  const receipt = event.receipt;
  const txLogs = receipt ? receipt.logs : [];

  const buyer = event.params.buyer;
  const otoken = event.params.series.toHex();
  const amount = event.params.optionAmount;

  const id = txHash + "-" + otoken;

  const optionsBoughtAction = new OptionsBoughtAction(id);

  optionsBoughtAction.otoken = otoken;
  optionsBoughtAction.buyer = buyer;
  optionsBoughtAction.amount = amount;
  optionsBoughtAction.premium = event.params.premium;
  optionsBoughtAction.fee = event.params.fee;
  optionsBoughtAction.timestamp = event.block.timestamp;
  optionsBoughtAction.transactionHash = event.transaction.hash.toHex();

  optionsBoughtAction.save();

  const total = event.params.premium.plus(event.params.fee);

  // add fees to stats
  updateStats(event.params.optionAmount, event.params.fee, true);

  for (let i = 0; i < txLogs.length; ++i) {
    // if event is to Controller, avoid reading all events
    if (txLogs[i].address.toHexString() == CONTROLLER) {
      // if topic is ShortOtokenBurned and account owner is tx sender (trader)
      if (
        txLogs[i].topics[0].toHexString() == SHORT_OTOKEN_BURNED &&
        txLogs[i].topics[2].toHexString().slice(26) ==
          event.transaction.from.toHexString().slice(2)
      ) {
        // if topic is shortOTokenBurned and account owner is tx sender (trader)
        updateOptionShortPosition(true, buyer, otoken, amount, id, total);
        return;
      }
    }
  }
  updateOptionLongPosition(true, buyer, otoken, amount, id, total);
}

export function handleOptionsSold(event: OptionsSold): void {
  const txHash = event.transaction.hash.toHex();

  const receipt = event.receipt;
  const txLogs = receipt ? receipt.logs : [];

  const seller = event.params.seller;
  const otoken = event.params.series.toHex();
  const amount = event.params.optionAmount;

  const id = txHash + "-" + otoken;

  const optionsSoldAction = new OptionsSoldAction(id);

  optionsSoldAction.otoken = otoken;
  optionsSoldAction.seller = seller;
  optionsSoldAction.amount = amount;
  optionsSoldAction.premium = event.params.premium;
  optionsSoldAction.fee = event.params.fee;
  optionsSoldAction.timestamp = event.block.timestamp;
  optionsSoldAction.transactionHash = event.transaction.hash.toHex();

  optionsSoldAction.save();

  const total = event.params.premium.minus(event.params.fee);

  // add fees to stats
  updateStats(event.params.optionAmount, event.params.fee, false);

  for (let i = 0; i < txLogs.length; ++i) {
    // if event is to Controller, avoid reading all events
    if (txLogs[i].address.toHexString() == CONTROLLER) {
      // if topic is ShortOtokenMinted and account owner is tx sender (trader)
      if (
        txLogs[i].topics[0].toHexString() == SHORT_OTOKEN_MINTED &&
        txLogs[i].topics[2].toHexString().slice(26) ==
          event.transaction.from.toHexString().slice(2)
      ) {
        // if topic is shortOtokenMinted and account owner is tx sender (trader)
        updateOptionShortPosition(false, seller, otoken, amount, id, total);
        return;
      }
    }
  }
  updateOptionLongPosition(false, seller, otoken, amount, id, total);
}
