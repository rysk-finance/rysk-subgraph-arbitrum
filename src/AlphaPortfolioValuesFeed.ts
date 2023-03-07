import { log } from "@graphprotocol/graph-ts";

import { StoresUpdated } from "../generated/AlphaPortfolioValuesFeed/AlphaPortfolioValuesFeed";
import { Serie } from "../generated/schema";
import { getEntityID } from "./OptionCatalogue";

export function handleStoresUpdated(event: StoresUpdated): void {
  const entityID = getEntityID(
    event.params.optionSeries.strike,
    event.params.optionSeries.expiration,
    event.params.optionSeries.isPut
  );

  let entitySerie = Serie.load(entityID);

  if (entitySerie == null) {
    log.error("Trying to update a Serie that doesn't exist", []);
    return;
  }

  entitySerie.netDHVExposure = entitySerie.netDHVExposure.minus(
    event.params.shortExposure
  );
  entitySerie.netDHVExposure = entitySerie.netDHVExposure.plus(
    event.params.longExposure
  );

  entitySerie.save();
}
