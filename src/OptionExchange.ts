import { CollateralApprovalChanged } from "../generated/OptionExchange/OptionExchange";
import { Collateral } from "../generated/schema";

export function handleCollateralApprovalChanged(
  event: CollateralApprovalChanged
): void {
  // Load or create collateral
  let collateral = Collateral.load(event.params.collateral.toString());

  if (collateral == null) {
    collateral = new Collateral(event.params.collateral.toString());
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
