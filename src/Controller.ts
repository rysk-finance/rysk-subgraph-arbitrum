
import {
  CollateralAssetDeposited,
  CollateralAssetWithdrawed,
  VaultLiquidated,
  VaultOpened,
  VaultSettled,
} from '../generated/Controller/Controller';

import { BIGINT_ZERO, loadOrCreateAccount, OPTION_REGISTRY } from './helper';

import {
  Vault
} from '../generated/schema';


/**
 * Vault Actions
 */

export function handleCollateralAssetDeposited(event: CollateralAssetDeposited): void {
  let accountId = event.params.accountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.asset;
  let from = event.params.from;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + '-' + id.toString();
  let vault = Vault.load(vaultId);
  if (vault) {
    vault.collateralAsset = asset.toHex();
    vault.collateralAmount = vault.collateralAmount ? vault.collateralAmount!.plus(amount) : BIGINT_ZERO.plus(amount);
    vault.save();
  }
}

export function handleCollateralAssetWithdrawed(event: CollateralAssetWithdrawed): void {
  let accountId = event.params.AccountOwner.toHex();
  let id = event.params.vaultId;
  let asset = event.params.asset;
  let to = event.params.to;
  let amount = event.params.amount;

  // update vault struct
  let vaultId = accountId + '-' + id.toString();
  let vault = Vault.load(vaultId);

  if (vault ) {
    vault.collateralAsset = vault.collateralAmount!.minus(amount).isZero() ? null : asset.toHex();
    vault.collateralAmount = vault.collateralAmount!.minus(amount);

    vault.save();
  }

}

export function handleLiquidation(event: VaultLiquidated):void {
  let accountId = event.params.vaultOwner.toHex();
  let id = event.params.vaultId;
  
  let collateralPayout = event.params.collateralPayout
  let debtAmount = event.params.debtAmount

  // update vault struct
  let vaultId = accountId + '-' + id.toString();
  let vault = Vault.load(vaultId);
  if (vault) {
    vault.shortAmount = vault.shortAmount ? vault.shortAmount!.minus(debtAmount) : BIGINT_ZERO;
    vault.collateralAmount = vault.collateralAmount ? vault.collateralAmount!.minus(collateralPayout) : BIGINT_ZERO;

    vault.save();
  }
}


export function handleVaultOpened(event: VaultOpened): void {
  let accountId = event.params.accountOwner.toHex();
  let id = event.params.vaultId;

  // update the account entity
  let account = loadOrCreateAccount(accountId);
  account.save();

  // create and initialized a vault entity only for LiquidityPool
  if (accountId == OPTION_REGISTRY ) {
    let vaultId = accountId + '-' + id.toString();
    let vault = new Vault(vaultId);
    vault.owner = accountId;
    vault.vaultId = id;
    vault.type = event.params.vaultType;
    vault.firstMintTimestamp = BIGINT_ZERO;

    vault.save();
  }

}

export function handleVaultSettled(event: VaultSettled): void {
  let id = event.params.vaultId;
  let accountId = event.params.accountOwner.toHex();

  let vaultId = accountId + '-' + id.toString();
  
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