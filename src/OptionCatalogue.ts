import { crypto, ByteArray, BigInt, log } from "@graphprotocol/graph-ts";
import {
  SeriesAltered,
  SeriesApproved
} from "../generated/OptionCatalogue/OptionCatalogue";
import { Serie, Expiry } from "../generated/schema";

const getEntityID = (
  strike: BigInt,
  expiration: BigInt,
  isPut: boolean
): string => {
  return crypto
    .keccak256(
      ByteArray.fromUTF8(
        strike
          .toString()
          .concat(expiration.toString())
          .concat(isPut ? "P" : "C")
      )
    )
    .toHexString();
};

// this creates a new Serie Entity and Expiry Entity if it doesn't exist
export function handleSeriesApproved(event: SeriesApproved): void {
  // TODO: it would be better if this just comes from the event
  const entityID = getEntityID(
    event.params.strike,
    event.params.expiration,
    event.params.isPut
  );

  // Create Serie Entity
  let entitySerie = new Serie(entityID);

  entitySerie.strike = event.params.strike;
  entitySerie.expiration = event.params.expiration;
  entitySerie.isPut = event.params.isPut;
  entitySerie.isBuyable = event.params.isBuyable;
  entitySerie.isSellable = event.params.isSellable;

  entitySerie.save();

  // Create Expiry Entity if it doesn't exist

  let loadExpiry = Expiry.load(event.params.expiration.toString());

  if (loadExpiry == null) {
    let entityExpiry = new Expiry(event.params.expiration.toString());
    entityExpiry.timestamp = event.params.expiration;
    entityExpiry.utc = "";
    // entityExpiry.utc = new Date(event.params.expiration.toI32() * 1000).toUTCString();
    entityExpiry.save();
  }
}

// this only updates isBuyable and isSellable
export function handleSeriesAltered(event: SeriesAltered): void {
  const entityID = getEntityID(
    event.params.strike,
    event.params.expiration,
    event.params.isPut
  );

  let entitySerie = Serie.load(entityID);

  if (entitySerie == null) {
    log.error("Trying to update a Serie that doesn't exist", []);
    return;
  }

  entitySerie.isBuyable = event.params.isBuyable;
  entitySerie.isSellable = event.params.isSellable;

  entitySerie.save();
}
