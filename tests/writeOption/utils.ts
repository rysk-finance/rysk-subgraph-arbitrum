import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { WriteOption } from "../../generated/liquidityPool/liquidityPool";
import { OptionsBought } from "../../generated/OptionExchange/OptionExchange";

export function createNewWriteOptionEvent(
  series: Address,
  amount: BigInt,
  premium: BigInt,
  escrow: BigInt,
  buyer: Address
): WriteOption {
  let newWriteOptionEvent = changetype<WriteOption>(newMockEvent());
  newWriteOptionEvent.parameters = [];

  let seriesParam = new ethereum.EventParam(
    "series",
    ethereum.Value.fromAddress(series)
  );
  let amountParam = new ethereum.EventParam(
    "amount",
    ethereum.Value.fromUnsignedBigInt(amount)
  );
  let premiumParam = new ethereum.EventParam(
    "premium",
    ethereum.Value.fromUnsignedBigInt(premium)
  );
  let escrowParam = new ethereum.EventParam(
    "escrow",
    ethereum.Value.fromUnsignedBigInt(escrow)
  );
  let buyerParam = new ethereum.EventParam(
    "buyer",
    ethereum.Value.fromAddress(buyer)
  );

  newWriteOptionEvent.parameters.push(seriesParam);
  newWriteOptionEvent.parameters.push(amountParam);
  newWriteOptionEvent.parameters.push(premiumParam);
  newWriteOptionEvent.parameters.push(escrowParam);
  newWriteOptionEvent.parameters.push(buyerParam);

  return newWriteOptionEvent;
}

export function createOptionsBoughtEvent(
  series: Address,
  buyer: Address,
  optionAmount: BigInt,
  premium: BigInt,
  fee: BigInt
): OptionsBought {
  let newOptionsBoughtEvent = changetype<OptionsBought>(newMockEvent());
  newOptionsBoughtEvent.parameters = [];

  let seriesParam = new ethereum.EventParam(
    "series",
    ethereum.Value.fromAddress(series)
  );

  let buyerParam = new ethereum.EventParam(
    "buyer",
    ethereum.Value.fromAddress(buyer)
  );

  let optionAmountParam = new ethereum.EventParam(
    "optionAmount",
    ethereum.Value.fromUnsignedBigInt(optionAmount)
  );

  let premiumParam = new ethereum.EventParam(
    "premium",
    ethereum.Value.fromUnsignedBigInt(premium)
  );

  let feeParam = new ethereum.EventParam(
    "fee",
    ethereum.Value.fromUnsignedBigInt(fee)
  );

  newOptionsBoughtEvent.parameters.push(seriesParam);
  newOptionsBoughtEvent.parameters.push(optionAmountParam);
  newOptionsBoughtEvent.parameters.push(buyerParam);
  newOptionsBoughtEvent.parameters.push(premiumParam);
  newOptionsBoughtEvent.parameters.push(feeParam);

  return newOptionsBoughtEvent;
}
