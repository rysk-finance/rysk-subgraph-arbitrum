import { CollateralApprovalChanged } from "../generated/OptionExchange/OptionExchange";
import {
  OptionsBought,
  OptionsSold
} from "../generated/OptionExchange/OptionExchange";

import {
  // OptionsBoughtAction,
  OptionsSoldAction,
  Collateral
} from "../generated/schema";

import {
  updateStats,
  CONTROLLER,
  SHORT_OTOKEN_BURNED,
  SHORT_OTOKEN_MINTED,
  updateOptionLongPosition,
  updateOptionShortPosition,
  addOptionsBoughtAction,
  addOptionsSoldAction
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
  addOptionsBoughtAction(event)
}

export function handleOptionsSold(event: OptionsSold): void {
  addOptionsSoldAction(event)
}
