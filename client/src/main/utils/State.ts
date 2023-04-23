// import * as fs from 'node:fs'
import { utils as ethersUtils } from 'ethers'

// import { CryptoUtils } from '@/main/utils/Crypto'
import { CryptoUtils } from './Crypto'

export type AsymmeticKey = { pub: string, pri: string }
export type AccountInfo = { address: string, accountKey: string, asymKey: AsymmeticKey}
export class State {
    private _ethereumContractArtemis: string
    private _ethereumContractMessage: string
    private _ethereumUrl: string
    private _ethereumInfos: AccountInfo[]
    private _ethereumAccountIndex: number
    private _ipfsUrl: string

    /* constructor
     * required: ipfs url, chain url and contract addrs,
     * optional: log-in accounts
     */
    constructor(file: any) {
        this._ethereumContractArtemis = file.contractArtemis!
        this._ethereumContractMessage = file.contractMessage!
        this._ethereumUrl = file.ethereumUrl!
        this._ipfsUrl = file.ipfsUrl!
        this._ethereumAccountIndex = -1
        this._ethereumInfos = []
        if (file.accounts != undefined)
            file.accounts!.forEach((ele: any) => {
                if (ele.address != ethersUtils.computeAddress(ele.accountKey)) {
                    // throw error
                }
                if (ele.address == file.address)
                    this._ethereumAccountIndex = this._ethereumInfos.length
                let info: AccountInfo = {
                    address: ele.address,
                    accountKey: ele.accountKey,
                    asymKey: { pub: ele.asymKey.pub, pri: ele.asymKey.pri },
                }
                this._ethereumInfos.push(info)
            })
    }

    get ethereumContracts(): { artemis: string, message: string } {
        return {
            artemis: this._ethereumContractArtemis,
            message: this._ethereumContractMessage,
        }
    }
    get ethereumUrl(): string { return this._ethereumUrl }
    get ethereumAccountList(): string[] {
        let list: string[] = []
        this._ethereumInfos.forEach(ele => list.push(ele.address))
        return list
    }
    get ethereumAddr(): string | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._ethereumInfos[this._ethereumAccountIndex].address
    }
    get ethereumAccountPrivateKey(): string | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._ethereumInfos[this._ethereumAccountIndex].accountKey
    }
    get asymmeticKey(): { pub: string, pri: string } | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._ethereumInfos[this._ethereumAccountIndex]!.asymKey
    }
    get ipfsUrl(): string { return this._ipfsUrl }

    /* fn: addAccount
     * use account private key and address to add a new account
     */
    public async addAccount(accountKey: string) {
        if (this._ethereumInfos.findIndex(ele => ele.accountKey == accountKey) != -1)
            return
        const addr = ethersUtils.computeAddress(accountKey)
        // generate asymmetic key-pair
        const keyPair = CryptoUtils.generateAsymKey(accountKey)
        let info: AccountInfo = {
            address: addr,
            accountKey: accountKey,
            asymKey: {
                pub: keyPair.publicKey,
                pri: keyPair.privateKey
            },
        }
        this._ethereumInfos.push(info)
        if (this._ethereumAccountIndex < 0)
            this._ethereumAccountIndex = 0
    }

    /* fn: switchAccount
     * switch current account to another on the given address
     */
    public async switchAccount(addr: string) {
        let index = this._ethereumInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, do not switch
        if (index == -1) {
            // throw error
        }
        this._ethereumAccountIndex = index
    }

    /* fn: removeAccount
     * remove the account on the given address
     */
    public async removeAccount(addr: string) {
        let index = this._ethereumInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, remove nothing
        if (index == -1) {
            // throw error
        }
        if (index == this._ethereumAccountIndex) {
            // emit logout event
            // which will call the logout() of Configuration
        }
        if (index > this._ethereumAccountIndex)
            --this._ethereumAccountIndex
        this._ethereumInfos.splice(index)
    }

    /* fn: logout
     * set state as logout
     */
    public logout() {
        this._ethereumAccountIndex = -1
    }

    /* fn: serialize
     * return serialized state for storage
     */
    public serialize(): string {
        let accounts: AccountInfo[] = []
        this._ethereumInfos.forEach(ele => {
            const info: AccountInfo = {
                address: ele.address,
                accountKey: ele.accountKey,
                asymKey: {
                    pub: ele.asymKey.pub,
                    pri: ele.asymKey.pri,
                },
            }
            accounts.push(info)
        })
        let json = {
            contractArtemis: this._ethereumContractArtemis,
            contractMessage: this._ethereumContractMessage,
            ethereumUrl: this._ethereumUrl,
            address: this._ethereumInfos[this._ethereumAccountIndex].address,
            // accounts: this._ethereumInfos
            accounts: accounts,
            ipfsUrl: this._ipfsUrl,
        }
        return JSON.stringify(json)
    }
}