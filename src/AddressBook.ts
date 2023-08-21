import { ProxyCreated } from "../generated/AddressBook/AddressBook";
import { Controller } from "../generated/schema";
import { Controller as ControllerContract } from "../generated/Controller/Controller";
import { Address } from "@graphprotocol/graph-ts";

export function handleProxyCreated(event: ProxyCreated): void {
  // createProxy is only used when Controller address is first created
  // so we initialize Controller entity in this event.
  let controllerEntity = new Controller("1");
  // let controllerContract = ControllerContract.bind(event.params.proxy);

  // NOTE: Hardcoded to avoid contract binding

  controllerEntity.addressBook = Address.fromString(
    "0xca19f26c52b11186b4b1e76a662a14da5149ea5a" // Testnet: 0xd6e67bf0b1cdb34c37f31a2652812cb30746a94a
  ); // controllerContract.addressbook();

  controllerEntity.owner = Address.fromString(
    "0xfbde2e477ed031f54ed5ad52f35ee43cd82cf2a6" // Testnet: 0xaf7f68c50de6dd885d91ced7a6572ed764d6a0b8
  ); // controllerContract.owner();
  controllerEntity.partialPauser = Address.fromString(
    "0x0000000000000000000000000000000000000000"
  ); // controllerContract.partialPauser();
  controllerEntity.fullPauser = Address.fromString(
    "0x0000000000000000000000000000000000000000"
  ); // controllerContract.fullPauser();
  controllerEntity.systemFullyPaused = false; // controllerContract.systemFullyPaused();
  controllerEntity.systemPartiallyPaused = false; // controllerContract.systemPartiallyPaused();
  controllerEntity.callRestricted = true; // controllerContract.callRestricted();

  controllerEntity.save();
}
