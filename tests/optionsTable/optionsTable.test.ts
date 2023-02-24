import { test, assert } from "matchstick-as/assembly";
import { createNewSeriesApprovedEvent } from "./utils";
import { BigInt } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as/assembly/log";
import { handleSeriesApproved } from "../../src/OptionCatalogue";

test(
  "Should handle new series",
  () => {
    let newSeriesApprovedEvent = createNewSeriesApprovedEvent(
      BigInt.fromString("1664553600"),
      BigInt.fromString("1600000000000000000000"),
      false,
      true,
      true
    );

    handleSeriesApproved(newSeriesApprovedEvent);

    // a bit confusing but first two params identify entity, last two params identify field
    assert.fieldEquals(
      "Serie",
      newSeriesApprovedEvent.transaction.hash.toHex(),
      "expiration",
      "1664553600"
    );
    log.success("Correct Serie ID", []);
  },
  false
);
