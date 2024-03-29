import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const BIGINT_ONE = BigInt.fromI32(1)
export const BIGINT_ZERO = BigInt.fromI32(0)
export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')
export const BIG_DECIMAL_1e8 = BigDecimal.fromString('100000000')
export const BIG_DECIMAL_1e18 = BigDecimal.fromString('1000000000000000000')

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const DEFAULT_VAULT_ID = '0'
