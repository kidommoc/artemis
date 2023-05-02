import { utils as ethersUtils } from 'ethers'

export { Crypto } from '@/main/utils/Crypto'
export { Compression } from '@/main/utils//Compression'
export { FSIO } from '@/main/utils/FSIO'

export function computeAddr(accountKey: string): string {
    return ethersUtils.computeAddress(accountKey)
}

export function checksumAddr(addr: string): string {
    return ethersUtils.getAddress(addr)
}