import * as ethers from 'ethers'
import { Service } from 'typedi'

import { State } from '@/main/utils/State'
const abiArtemis = require('@/main/abi/Artemis.json')
const abiMessage = require('@/main/abi/ArtemisMessage.json')

export enum MsgCode {
    UNKNOWN,
    SUB_REQ,
    SUB_RES,
}

@Service()
export class ContractService {

    private _provider: ethers.providers.JsonRpcProvider
    private _wallet: ethers.Wallet | null
    private _artemis: ethers.Contract | null
    private _message: ethers.Contract | null

    /* constructor
     * use State single instance (from DI) to init
     * if account not specified, keeps related fields null
     * call updateService() once decided
     */
    constructor (private _state: State) {
        this._provider = new ethers.providers.JsonRpcProvider(this._state.ethereumUrl)
        if (this._state.ethereumAddr == undefined) {
            this._wallet = null
            this._artemis = null
            this._message = null
        }
        else {
            this._wallet = new ethers.Wallet(this._state.ethereumAccountPrivateKey!, this._provider)
            const contractsAddr = this._state.ethereumContracts
            this._artemis = new ethers.Contract(contractsAddr.artemis, abiArtemis, this._wallet)
            this._message = new ethers.Contract(contractsAddr.message, abiMessage, this._wallet)
        }
    }

    /* fn: updateService
     * called when loging-in or switching account
     */
    public async updateService() {
        this._wallet = new ethers.Wallet(this._state.ethereumAccountPrivateKey!, this._provider)
        const contractAddr = this._state.ethereumContracts
        this._artemis = new ethers.Contract(contractAddr.artemis, abiArtemis, this._wallet)
        this._message = new ethers.Contract(contractAddr.message, abiMessage, this._wallet)
    }

    // ====== FOR BOTH ======

    /* fn: getBalance
     * query blockchain for balance of current account
     */
    public async getBalance(): Promise<number> {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._wallet!.getBalance()
        // check
        return Number(ethers.utils.formatEther(result))
    }

    public async getTransactionTime(hash: string): Promise<Date> {
        const transction = await this._provider.getTransaction(hash)
        const block = await this._provider.getBlock(transction.blockNumber!)
        return new Date(block.timestamp)
    }

    /* functions below are all contract interface wrappers */

    public async checkMessage(): Promise<boolean> {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._message!.hasMessage()
        // check
        return result
    }

    public async fetchMessage()
        : Promise<{ from: string, code: MsgCode, content: string }[]>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._message!.fetchMessage()
        // check
        let msgs: { from: string, code: MsgCode, content: string }[] = []
        for (let i = 0; i < result.msgSenders!.length; ++i) {
            const msg = {
                from: result.msgSenders![i],
                content: result.msgContents![i],
                code: ((c: number): MsgCode => {
                    if (c == 1)
                        return MsgCode.SUB_REQ
                    if (c == 2)
                        return MsgCode.SUB_RES
                    return MsgCode.UNKNOWN
                })(result.msgCodes![i]),
            }
            msgs.push(msg)
        }
        return msgs
    }

    public async clearMessage()
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._message!.clearMessage()
            return tx
        } catch (error) {
            // handle error
            throw error
        }
    }

    // ===== FOR PUBLISHER ======

    // price in ether
    public async registerPublisher(price: number)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
            throw new Error()
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.registerPublisher(
                    this._state.asymmeticKey!.pub,
                    ethers.utils.parseEther(price.toString())
                )
            return tx
        } catch (error) {
            // handle error
            throw error
        }
    }

    // price in ether
    public async setSubscribingPrice(price: number)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.setSubscribingPrice(ethers.utils.parseEther(price.toString()))
            return tx
        } catch (error) {
            // handle error
            throw error
        }
    }

    public async admitSubscribing(subs: string, encKey: string)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.admitSubscribing(subs, encKey)
            return tx
        } catch(error) {
            // handle error
            throw error
        }
    }

    public async uploadArticle(fileLoc: string, title: string, author: string, reqSubscribing: boolean)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.uploadArticle(fileLoc, title, author, reqSubscribing)
            return tx
        } catch(error) {
            // handle error
            throw error
        }
    }

    public async removeArticle(fileLoc: string)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        try {
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.removeArticle(fileLoc)
            return tx
        } catch(error) {
            // handle error
            throw error
        }
    }

    // ===== FOR READER =====

    public async getPublisherPubKey(publ: string): Promise<string> {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        let result = await this._artemis!.getPublisherPubKey(publ)
        // check
        return result
    }

    // return price in ether
    public async getSubscribingPrice(publ: string): Promise<number> {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._artemis!.getSubscribingPrice(publ)
        // check        
        return Number(ethers.utils.formatEther(result))
    }

    public async subscribe(publ: string, months: number)
        : Promise<ethers.providers.TransactionResponse>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        // check
        try {
            const price = await this.getSubscribingPrice(publ)
            let tx: ethers.providers.TransactionResponse
                = await this._artemis!.subscribe(
                    publ, months, this._state.asymmeticKey!.pub,
                    { value: ethers.utils.parseEther((months * price).toString()) }
                )
            return tx
        } catch (error) {
            // handle error
            throw error
        }
    }

    public async getSubscribingTime(publ: string): Promise<Date> {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._artemis!.getSubscribingTime(publ)
        // check
        return new Date(Number(result))
    }

    public async getArticleInfo(fileLoc: string):
        Promise<{ authorAddr: string, title: string, author: string, reqSubscribing: boolean }>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._artemis!.getArticleInfo(fileLoc)
        // check
        return {
            authorAddr: result.authorAddr,
            title: result.title,
            author: result.author,
            reqSubscribing: result.reqSubscribing,
        }
    }

    public async accessArticle(fileLoc: string):
        Promise<{ permission: boolean, encKey: string | null }>
    {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const result = await this._artemis!.accessArticle(fileLoc)
        if (result.permission == false)
            return { permission: false, encKey: null }
        if (result.encKey == '')
            return { permission: true, encKey: null }
        return { permission: true, encKey: result.encKey }
    }
}