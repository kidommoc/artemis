import { utils as ethersUtils } from 'ethers'

export { Crypto } from '@/utils/Crypto'
export { Compression } from '@/utils//Compression'
export { FSIO } from '@/utils/FSIO'

export function computeAddr(accountKey: string): string {
    return ethersUtils.computeAddress(accountKey)
}

export function checksumAddr(addr: string): string {
    return ethersUtils.getAddress(addr)
}