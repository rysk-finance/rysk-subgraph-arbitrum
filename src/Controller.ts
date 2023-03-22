import { BigInt } from "@graphprotocol/graph-ts";
import {
  CollateralAssetDeposited,
  CollateralAssetWithdrawed,
  VaultLiquidated,
  VaultOpened,
  VaultSettled,
  ShortOtokenMinted,
  Redeem
} from "../generated/Controller/Controller";
import {
  MintShortAction,
  Vault,
  RedeemAction
  // SettleAction
} from "../generated/schema";

import {
  BIGINT_ONE,
  BIGINT_ZERO,
  loadOrCreateAccount,
  loadOrCreatePosition,
  updateRedeemerPosition
  // updateSettlerPosition
} from "./helper";

/**
 * Vault Actions
 */

export function handleCollateralAssetDeposited(
  event: CollateralAssetDeposited
): void {
  let accountId = event.params.accountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.asset;
  let from = event.params.from;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + "-" + id.toString();
  let vault = Vault.load(vaultId);
  if (vault) {
    vault.collateralAsset = asset.toHex();
    vault.collateralAmount = vault.collateralAmount
      ? vault.collateralAmount!.plus(amount)
      : BIGINT_ZERO.plus(amount);
    vault.save();
  }
}

export function handleCollateralAssetWithdrawed(
  event: CollateralAssetWithdrawed
): void {
  let accountId = event.params.AccountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.asset;
  let to = event.params.to;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + "-" + id.toString();
  let vault = Vault.load(vaultId);

  if (vault) {
    vault.collateralAsset = vault.collateralAmount!.minus(amount).isZero()
      ? null
      : asset.toHex();
    vault.collateralAmount = vault.collateralAmount!.minus(amount);

    vault.save();
  }
}

export function handleLiquidation(event: VaultLiquidated): void {
  let accountId = event.params.vaultOwner.toHex();
  let id = event.params.vaultId;

  let collateralPayout = event.params.collateralPayout;
  let debtAmount = event.params.debtAmount;

  // update vault struct
  let vaultId = accountId + "-" + id.toString();
  let vault = Vault.load(vaultId);
  if (vault) {
    vault.shortAmount = vault.shortAmount
      ? vault.shortAmount!.minus(debtAmount)
      : BIGINT_ZERO;
    vault.collateralAmount = vault.collateralAmount
      ? vault.collateralAmount!.minus(collateralPayout)
      : BIGINT_ZERO;

    vault.save();
  }
}

export function handleVaultOpened(event: VaultOpened): void {
  let accountId = event.params.accountOwner.toHex();
  let id = event.params.vaultId;

  // update the account entity
  let account = loadOrCreateAccount(accountId);
  account.vaultCount = account.vaultCount.plus(BigInt.fromI32(1));
  account.save();

  let vaultId = accountId + "-" + id.toString();
  let vault = new Vault(vaultId);
  vault.owner = accountId;
  vault.vaultId = id;
  vault.type = event.params.vaultType;
  vault.firstMintTimestamp = BIGINT_ZERO;

  vault.save();
}

export function handleVaultSettled(event: VaultSettled): void {
  let id = event.params.vaultId;
  let accountId = event.params.accountOwner.toHex();

  let vaultId = accountId + "-" + id.toString();

  let vault = Vault.load(vaultId);

  if (vault) {
    // update vault struct
    vault.collateralAsset = null;
    vault.collateralAmount = BIGINT_ZERO;
    vault.shortOToken = null;
    vault.shortAmount = BIGINT_ZERO;
    vault.longOToken = null;
    vault.longAmount = BIGINT_ZERO;
    vault.save();
  }
}

export function handleRedeem(event: Redeem): void {
  // Create Redeem Action to keep track of this event.
  let actionId =
    "REDEEM-" +
    event.transaction.hash.toHex() +
    "-" +
    event.logIndex.toString();
  let action = new RedeemAction(actionId);
  action.id = actionId;
  action.block = event.block.number;
  action.transactionHash = event.transaction.hash;
  action.timestamp = event.block.timestamp;
  action.messageSender = event.transaction.from;
  action.oToken = event.params.otoken.toHex();
  action.otokenBurned = event.params.otokenBurned;
  action.payoutAsset = event.params.collateralAsset.toHex();
  action.payoutAmount = event.params.payout;
  action.receiver = event.params.receiver;
  action.save();

  updateRedeemerPosition(
    event.params.receiver,
    action.oToken,
    action.otokenBurned.times(BigInt.fromString("10000000000")), // positions are stored as Rysk: e18
    action.id
  );
}

export function handleShortOtokenMinted(event: ShortOtokenMinted): void {
  let accountId = event.params.AccountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.otoken;
  let to = event.params.to;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + "-" + id.toString();

  // Yassine - Opyn doesn't have !, due to breaking changes from AS 0.0.4 to 0.07
  let vault = Vault.load(vaultId)!;

  const shortAmount = vault.shortAmount;

  vault.shortOToken = asset.toHex(); // convert to id
  // if this is the first time creating a short position, mark the timestamp
  if (!shortAmount || (shortAmount && shortAmount.isZero())) {
    //  (!vault.shortAmount || vault.shortAmount.isZero()) {
    vault.firstMintTimestamp = event.block.timestamp;
  }

  // Yassine - Opyn doesn't have !, due to breaking changes from AS 0.0.4 to 0.07
  vault.shortAmount = shortAmount ? shortAmount.plus(amount) : amount;
  vault.save();

  // create action entity
  let actionId =
    "MINT-SHORT-" +
    event.transaction.hash.toHex() +
    "-" +
    event.logIndex.toString();
  let action = new MintShortAction(actionId);
  action.messageSender = event.transaction.from;
  action.vault = vaultId;
  action.block = event.block.number;
  action.transactionHash = event.transaction.hash;
  action.timestamp = event.block.timestamp;
  // MintShort fields
  action.to = to;
  action.oToken = asset.toHex();
  action.amount = amount;
  action.save();
}
