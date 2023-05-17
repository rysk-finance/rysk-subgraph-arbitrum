import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import { newMockEvent } from "matchstick-as/assembly/index";
import { OtokenCreated } from "../../generated/OTokenFactory/OTokenFactory";

export function createNewOTokenCreatedEvent(
  tokenAddress: Address,
  creator: Address,
  underlying: Address,
  strike: Address,
  collateral: Address,
  strikePrice: BigInt,
  expiry: BigInt,
  isPut: boolean
): OtokenCreated {
  let newOTokenCreatedEvent = changetype<OtokenCreated>(newMockEvent());
  newOTokenCreatedEvent.parameters = [];

  let tokenAddressParam = new ethereum.EventParam(
    "tokenAddress",
    ethereum.Value.fromAddress(tokenAddress)
  );
  let creatorParam = new ethereum.EventParam(
    "creator",
    ethereum.Value.fromAddress(creator)
  );
  let underlyingParam = new ethereum.EventParam(
    "underyling",
    ethereum.Value.fromAddress(underlying)
  );
  let strikeParam = new ethereum.EventParam(
    "strike",
    ethereum.Value.fromAddress(strike)
  );
  let collateralParam = new ethereum.EventParam(
    "collateral",
    ethereum.Value.fromAddress(collateral)
  );

  let strikePriceParam = new ethereum.EventParam(
    "strikePrice",
    ethereum.Value.fromUnsignedBigInt(strikePrice)
  );
  let expiryParam = new ethereum.EventParam(
    "expiry",
    ethereum.Value.fromUnsignedBigInt(expiry)
  );

  let isPutParam = new ethereum.EventParam(
    "isPut",
    ethereum.Value.fromBoolean(isPut)
  );

  newOTokenCreatedEvent.parameters.push(tokenAddressParam);
  newOTokenCreatedEvent.parameters.push(creatorParam);
  newOTokenCreatedEvent.parameters.push(underlyingParam);
  newOTokenCreatedEvent.parameters.push(strikeParam);
  newOTokenCreatedEvent.parameters.push(collateralParam);
  newOTokenCreatedEvent.parameters.push(strikePriceParam);
  newOTokenCreatedEvent.parameters.push(expiryParam);
  newOTokenCreatedEvent.parameters.push(isPutParam);

  return newOTokenCreatedEvent;
}
