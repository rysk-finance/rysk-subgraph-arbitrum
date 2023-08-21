import { createNewWriteOptionEvent, createOptionsBoughtEvent } from "./utils";

import { test } from "matchstick-as/assembly";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as/assembly/log";
import { handleWriteOption } from "../../src/LiquidityPool";
import { handleOptionsBought } from "../../src/OptionExchange";

test(
  "Should handle write option",
  () => {
    let newWriteOptionEvent = createNewWriteOptionEvent(
      // got these from chain
      Address.fromString("0xbcebba683a5ff968340c4212b0ddbeadf80c2d14"),
      BigInt.fromString("1000000000000000000"),
      BigInt.fromString("174080000"),
      BigInt.fromString("882736270"),
      Address.fromString("0xb69dc34f83b0a1a37ae105b76db62b74f68749e8")
    );

    handleWriteOption(newWriteOptionEvent);

    log.success("Write Option", []);
  },
  false
);

test(
  "Should handle options bought",
  () => {
    let optionsBoughtEvent = createOptionsBoughtEvent(
      // got these from chain
      Address.fromString("0xad5b468f6fb897461e388396877fd5e3c5114539"),
      Address.fromString("0xb69dc34f83b0a1a37ae105b76db62b74f68749e8"),
      BigInt.fromString("1000000000000000000"),
      BigInt.fromString("10473488"),
      BigInt.fromString("300000")
    );

    handleOptionsBought(optionsBoughtEvent);

    log.success("Options Bought", []);
  },
  false
);
