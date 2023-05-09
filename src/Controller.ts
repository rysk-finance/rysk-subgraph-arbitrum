import { BigInt } from "@graphprotocol/graph-ts";
import {
  CollateralAssetDeposited,
  CollateralAssetWithdrawed,
  VaultLiquidated,
  VaultOpened,
  VaultSettled,
  ShortOtokenMinted,
  ShortOtokenBurned,
  Redeem
} from "../generated/Controller/Controller";
import {
  MintShortAction,
  BurnShortAction,
  Vault,
  RedeemAction,
  SettleAction
} from "../generated/schema";

import {
  BIGINT_ONE,
  BIGINT_ZERO,
  loadOrCreateAccount,
  loadOrCreateShortPosition,
  OPTION_EXCHANGE,
  updateRedeemerPosition,
  updateSettlerPosition
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
    // create action entity
    let actionId =
      "SETTLE-" +
      event.transaction.hash.toHex() +
      "-" +
      event.logIndex.toString();
    let action = new SettleAction(actionId);
    action.messageSender = event.transaction.from;
    action.vault = vaultId;
    action.block = event.block.number;
    action.transactionHash = event.transaction.hash;
    action.timestamp = event.block.timestamp;

    action.long = vault.longOToken;
    action.short = vault.shortOToken;
    action.longAmount = vault.longAmount;
    action.shortAmount = vault.shortAmount;
    action.collateral = vault.collateralAsset;
    action.collateralAmount = vault.collateralAmount;

    action.to = event.params.to;
    action.amount = event.params.payout;
    action.save();

    // update vault struct
    vault.collateralAsset = null;
    vault.collateralAmount = BIGINT_ZERO;
    vault.shortOToken = null;
    vault.shortAmount = BIGINT_ZERO;
    vault.longOToken = null;
    vault.longAmount = BIGINT_ZERO;
    vault.save();

    const ryskAmount = assert(
      action.shortAmount,
      "shortAmount can't be null"
    ).times(BigInt.fromString("10000000000"));

    updateSettlerPosition(
      event.params.accountOwner, // settler not .to because .to is the address that receives the payout
      event.params.oTokenAddress.toHex(), // settling short oToken
      ryskAmount, // NOTE: settling 0s user's short position
      action.id,
      vaultId
    );
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
  let vault = Vault.load(vaultId);

  if (vault == null) {
    return;
  }

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

  if (event.transaction.to!.toHex() != OPTION_EXCHANGE) {
    // ignore if not from option exchange as it will not have a position
    return;
  }

  // add vault to trader's position
  let initPositionId = BIGINT_ZERO;

  let position = loadOrCreateShortPosition(
    event.params.AccountOwner,
    action.oToken,
    initPositionId
  );

  // get the first active position for this otoken.
  while (!position.active) {
    initPositionId = initPositionId.plus(BIGINT_ONE);
    position = loadOrCreateShortPosition(
      event.params.AccountOwner,
      action.oToken,
      initPositionId
    );
  }

  position.vault = vaultId;
  position.save();
}

export function handleShortOtokenBurned(event: ShortOtokenBurned): void {
  let accountId = event.params.AccountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.otoken;
  let from = event.params.from;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + "-" + id.toString();
  let vault = Vault.load(vaultId);

  if (vault == null) {
    return;
  }

  const shortAmount = vault.shortAmount;

  // if amount = 0, set the longOtoken back to null
  vault.shortOToken =
    shortAmount && shortAmount.minus(amount).isZero() ? null : asset.toHex(); // convert to id
  vault.shortAmount = shortAmount && shortAmount.minus(amount);

  vault.save();

  // create action entity
  let actionId =
    "BURN-SHORT-" +
    event.transaction.hash.toHex() +
    "-" +
    event.logIndex.toString();
  let action = new BurnShortAction(actionId);
  action.messageSender = event.transaction.from;
  action.vault = vaultId;
  action.block = event.block.number;
  action.transactionHash = event.transaction.hash;
  action.timestamp = event.block.timestamp;
  // DepositLong fields
  action.from = from;
  action.oToken = asset.toHex();
  action.amount = amount;
  action.save();
}
