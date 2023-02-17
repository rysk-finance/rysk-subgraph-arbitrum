import { SeriesApproved } from "../generated/OptionCatalogue/OptionCatalogue"
import { Serie, Expiry } from "../generated/schema"

export function handleSeriesApproved(event: SeriesApproved): void {
    // Create Serie Entity
    let entitySerie = new Serie(event.transaction.hash.toHex());

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

