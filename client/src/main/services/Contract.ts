import * as ethers from 'ethers'
import { Container, Service } from 'typedi'

import { State } from '@/State'
import abiArtemis from '@/abi/Artemis.json'
import abiMessage from '@/abi/ArtemisMessage.json'

export enum MsgCode {
    UNKNOWN,
    SUB_REQ,
    SUB_RES,
}

@Service()
export class ContractService {

    private _state: State
    private _provider: ethers.providers.JsonRpcProvider
    private _wallet: ethers.Wallet | null
    private _artemis: ethers.Contract | null
    private _message: ethers.Contract | null

    constructor () {
        this._state = Container.get('State')
        this._provider = new ethers.providers.JsonRpcProvider(this._state.ethereumUrl)
        this._wallet = null
        this._artemis = null
        this._message = null
        this.updateService()
    }

    public updateService() {
        try {
            const privateKey = this._state.ethereumAccountPrivateKey
            this._wallet = new ethers.Wallet(privateKey, this._provider)
            const contractsAddr = this._state.ethereumContracts
            this._artemis = new ethers.Contract(contractsAddr.artemis, abiArtemis, this._wallet)
            this._message = new ethers.Contract(contractsAddr.message, abiMessage, this._wallet)
        } catch (error) {
            this._wallet = null
            this._artemis = null
            this._message = null
        }
    }

    // ====== FOR BOTH ======

    // return price in ether
    public async getBalance(): Promise<number> {
        const result = await this._wallet!.getBalance()
        return Number(ethers.utils.formatEther(result))
    }

    public async getTransactionTime(hash: string): Promise<Date> {
        const transction = await this._provider.getTransaction(hash)
        const block = await this._provider.getBlock(transction.blockNumber!)
        return new Date(block.timestamp)
    }

    /* functions below are all contract interface wrappers */

    public async getPublisherName(addr: string): Promise<string | undefined> {
        const artemis = new ethers.Contract(this._state.ethereumContracts.artemis, abiArtemis, this._provider)
        const result = await artemis.getPublisherName(addr)
        if (result.length == 0)
            return undefined
        return result
    }

    public async checkMessage(): Promise<boolean> {
        const result = await this._message!.hasMessage()
        // check
        return result
    }

    public async fetchMessage()
        : Promise<{ from: string, code: MsgCode, content: string }[]>
    {
        const result = await this._message!.fetchMessage()
        if (Array.isArray(result.msgSenders)
            || Array.isArray(result.msgCodes)
            || Array.isArray(result.msgContents)
            || result.msgSenders.length != result.msgCodes.length
            || result.msgSenders.length != result.msgContents.length
        ) {
            // throw error
        }
        const msgs: { from: string, code: MsgCode, content: string }[] = []
        for (let i = 0; i < result.msgSenders!.length; ++i) {
            const msg = {
                from: result.msgSenders![i],
                content: result.msgContents![i],
                code: ((c: number): MsgCode => {
                    switch (c) {
                        case 1:
                            return MsgCode.SUB_REQ
                        case 2:
                            return MsgCode.SUB_RES
                        default:
                            return MsgCode.UNKNOWN
                    }
                })(result.msgCodes![i]),
            }
            msgs.push(msg)
        }
        return msgs
    }

    public async clearMessage(): Promise<string> {
        try {
            const tx = await this._message!.clearMessage()
            await tx.wait()
            return tx.hash
        } catch (error) {
            // handle error
            throw error
        }
    }

    // ===== FOR PUBLISHER ======

    // price in ether
    public async registerPublisher(name: string, price: number): Promise<string> {
        const tx = await this._artemis!.registerPublisher(
            name, this._state.asymmeticKey.pub,
            ethers.utils.parseEther(price.toString())
        )
        await tx.wait()
        return tx.hash
    }

    public async renamePublisher(newName: string): Promise<string> {
        const tx = await this._artemis!.renamePublisher(newName)
        await tx.wait()
        return tx.hash
    }

    // price in ether
    public async setSubscribingPrice(price: number): Promise<string> {
        const tx = await this._artemis!.setSubscribingPrice(
            ethers.utils.parseEther(price.toString())
        )
        await tx.wait()
        return tx.hash
    }

    public async admitSubscribing(subs: string, encKey: string): Promise<string> {
        const tx = await this._artemis!.admitSubscribing(subs, encKey)
        await tx.wait()
        return tx.hash
    }

    public async uploadArticle(fileLoc: string, title: string, reqSubscribing: boolean)
        : Promise<string>
    {
        const tx = await this._artemis!.uploadArticle(
            fileLoc, title, reqSubscribing
        )
        await tx.wait()
        return tx.hash
    }

    public async removeArticle(fileLoc: string): Promise<string> {
        const tx = await this._artemis!.removeArticle(fileLoc)
        await tx.wait()
        return tx.hash
    }

    // ===== FOR READER =====

    public async getPublisherPubKey(publ: string): Promise<string> {
        const result = await this._artemis!.getPublisherPubKey(publ)
        // check
        return result
    }

    // return price in ether
    public async getSubscribingPrice(publ: string): Promise<number> {
        const result = await this._artemis!.getSubscribingPrice(publ)
        // check        
        return Number(ethers.utils.formatEther(result))
    }

    public async subscribe(publ: string, months: number): Promise<string> {
        const balance = await this.getBalance()
        const price = await this.getSubscribingPrice(publ)
        const estimateGas = Number(ethers.utils.formatEther(await this._artemis!.estimateGas.subscribe(
            publ, months, this._state.asymmeticKey.pub,
            { value: ethers.utils.parseEther((months * price).toString()) }
        )))
        if (balance < months * price + estimateGas)
            throw new Error('Insufficient balance!')
        const tx = await this._artemis!.subscribe(
            publ, months, this._state.asymmeticKey.pub,
            { value: ethers.utils.parseEther((months * price).toString()) }
        )
        await tx.wait()
        return tx.hash
    }

    public async getSubscribingTime(publ: string): Promise<Date | undefined> {
        const result = await this._artemis!.getSubscribingTime(publ)
        if (result == 0)
            return undefined
        // check
        return new Date(Number(result * 1000))
    }

    public async getArticleInfo(fileLoc: string):
        Promise<{ title: string, publisher: string, publisherAddr: string, date: Date, reqSubscribing: boolean }>
    {
        const result = await this._artemis!.getArticleInfo(fileLoc)
        // check
        return {
            title: result.title,
            publisher: result.author,
            publisherAddr: result.authorAddr,
            date: new Date(result.date * 1000),
            reqSubscribing: result.reqSubscribing,
        }
    }

    public async accessArticle(fileLoc: string):
        Promise<{ permission: boolean, encKey: string | null }>
    {
        const result = await this._artemis!.accessArticle(fileLoc)
        if (result.permission == false)
            return { permission: false, encKey: null }
        if (result.encKey == '')
            return { permission: true, encKey: null }
        return { permission: true, encKey: result.encKey }
    }
}