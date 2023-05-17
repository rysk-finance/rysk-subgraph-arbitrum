import { test, assert } from "matchstick-as/assembly";
import { createNewOTokenCreatedEvent } from "./utils";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as/assembly/log";
import { handleOtokenCreated } from "../../src/OTokenFactory";

test(
  "Should handle new otoken",
  () => {
    let oTokenCreatedEvent = createNewOTokenCreatedEvent(
      Address.fromString("0x126a34aab4a09e2797ee62eca9160510c530a87b"),
      Address.fromString("0xb672fe86693bf6f3b034730f5d2c77c8844d6b45"),
      Address.fromString("0x3b3a1de07439eeb04492fa64a889ee25a130cdd3"),
      Address.fromString("0x408c5755b5c7a0a28d851558ea3636cfc5b5b19d"),
      Address.fromString("0x408c5755b5c7a0a28d851558ea3636cfc5b5b19d"),
      BigInt.fromString("160000000000"),
      BigInt.fromString("1688112000"),
      false
    );

    handleOtokenCreated(oTokenCreatedEvent);

    // a bit confusing but first two params identify entity, last two params identify field
    assert.fieldEquals(
      "OToken",
      "0x126a34aab4a09e2797ee62eca9160510c530a87b",
      "symbol",
      "oWETHUSDC/USDC-30JUN23-1600C"
    );
    log.success("Correct OToken symbol", []);
  },
  false
);
