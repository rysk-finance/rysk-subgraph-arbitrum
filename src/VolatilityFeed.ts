import { SabrParamsSet } from "../generated/VolatilityFeed/VolatilityFeed";
import { SABR } from "../generated/schema";

// sets or updates the SABR parameters for a given expiry
export function handleSabrParamsSet(event: SabrParamsSet): void {
  // Load or create SABR
  let sabr = SABR.load(event.params._expiry.toString());

  if (sabr == null) {
    sabr = new SABR(event.params._expiry.toString());
  }

  sabr.callAlpha = event.params.callAlpha;
  sabr.callBeta = event.params.callBeta;
  sabr.callRho = event.params.callRho;
  sabr.callVolvol = event.params.callVolvol;
  sabr.putAlpha = event.params.putAlpha;
  sabr.putBeta = event.params.putBeta;
  sabr.putRho = event.params.putRho;
  sabr.putVolvol = event.params.putVolvol;
  sabr.interestRate = event.params.interestRate;

  sabr.save();
}
