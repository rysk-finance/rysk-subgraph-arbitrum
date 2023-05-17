import { Address, BigInt } from "@graphprotocol/graph-ts";
import { OtokenCreated } from "../generated/OTokenFactory/OTokenFactory";
import { OToken as OTokenSource } from "../generated/templates";
import { OToken } from "../generated/schema";

const WETH_ADDRESS = "0x3b3a1de07439eeb04492fa64a889ee25a130cdd3";
// const USDC_ADDRESS = "0x408c5755b5c7a0a28d851558ea3636cfc5b5b19d";

export function handleOtokenCreated(event: OtokenCreated): void {
  // Start indexing the newly created OToken contract
  OTokenSource.create(event.params.tokenAddress);

  // bind to the address that emit the event
  // let factoryContract = FactoryInterface.bind(event.address);
  // let addressBookAddress = Address.fromString(
  //   "0xd6e67bf0b1cdb34c37f31a2652812cb30746a94a"
  // );
  // let addressBookContract = AddressBookInterface.bind(addressBookAddress);
  let implementation = Address.fromString(
    "0xb19d2ea6f662b13f530cb84b048877e5ed0bd8fe"
  );

  // Create Otoken Entity
  let entity = new OToken(event.params.tokenAddress.toHex());

  entity.underlyingAsset = event.params.underlying.toHex();
  entity.strikeAsset = event.params.strike.toHex();
  entity.collateralAsset = event.params.collateral.toHex();
  entity.strikePrice = event.params.strikePrice;
  entity.isPut = event.params.isPut;
  entity.expiryTimestamp = event.params.expiry;
  entity.creator = event.params.creator;
  entity.implementation = implementation;

  // let contract = TokenContract.bind(event.params.tokenAddress);

  // NOTE: This handles well only current cases of WETH as underlying and USDC or WETH as collateral
  if (entity.underlyingAsset.toString() == WETH_ADDRESS) {
    const date = new Date(
      event.params.expiry.times(BigInt.fromString("1000")).toU64()
    )
      .toDateString()
      .split(" "); // ex. ["Fri", "Jun", "30", "2023"]

    const expiry = date[2] + date[1].toUpperCase() + date[3].substr(2);

    entity.symbol = "oWETHUSDC/"
      .concat(entity.collateralAsset == WETH_ADDRESS ? "WETH" : "USDC")
      .concat("-")
      .concat(expiry)
      .concat("-")
      .concat(entity.strikePrice.toString().substr(0, 4))
      .concat(entity.isPut ? "P" : "C");
  } else {
    entity.symbol = ""; // contract.symbol();
  }

  entity.name = ""; // contract.name();

  entity.decimals = 8;

  entity.totalSupply = BigInt.fromI32(0);
  entity.createdAt = event.block.timestamp;
  entity.createdTx = event.transaction.hash;

  entity.save();
}
