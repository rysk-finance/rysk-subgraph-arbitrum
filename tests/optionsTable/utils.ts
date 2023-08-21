import { ethereum, BigInt } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { SeriesApproved } from "../../generated/OptionCatalogue/OptionCatalogue";

export function createNewSeriesApprovedEvent(
  expiration: BigInt,
  strike: BigInt,
  isPut: boolean,
  isBuyable: boolean,
  isSellable: boolean
): SeriesApproved {
  let newSeriesApprovedEvent = changetype<SeriesApproved>(newMockEvent());
  newSeriesApprovedEvent.parameters = [];

  let expirationParam = new ethereum.EventParam(
    "expiration",
    ethereum.Value.fromUnsignedBigInt(expiration)
  );
  let strikeParam = new ethereum.EventParam(
    "strike",
    ethereum.Value.fromUnsignedBigInt(strike)
  );
  let isPutParam = new ethereum.EventParam(
    "isPut",
    ethereum.Value.fromBoolean(isPut)
  );
  let isBuyableParam = new ethereum.EventParam(
    "isBuyable",
    ethereum.Value.fromBoolean(isBuyable)
  );
  let isSellableParam = new ethereum.EventParam(
    "isSellable",
    ethereum.Value.fromBoolean(isSellable)
  );

  newSeriesApprovedEvent.parameters.push(expirationParam);
  newSeriesApprovedEvent.parameters.push(strikeParam);
  newSeriesApprovedEvent.parameters.push(isPutParam);
  newSeriesApprovedEvent.parameters.push(isBuyableParam);
  newSeriesApprovedEvent.parameters.push(isSellableParam);

  return newSeriesApprovedEvent;
}
