import { Container, Service } from 'typedi'
import { State } from '@/State'
import { SubscribingStatus, SubscribingInfo } from '@/State'
import { ContractService, MsgCode } from '@/services/Contract'
import { IPFSService } from '@/services/IPFS'
import * as utils from '@/utils'
import { save } from '@/config'

@Service()
export class AccountService {
    private _state: State
    private _contractService: ContractService
    private _ipfsService: IPFSService
    private _timer: ReturnType<typeof setInterval>

    constructor() {
        this._state = Container.get('State')
        this._contractService = Container.get(ContractService)
        this._ipfsService = Container.get(IPFSService)
        this.handleMessage()
        this._timer = setInterval(() => this.handleMessage(), 5 * 60 * 1000)
    }

    private async admitSubscribing(addr: string, pubKey: string) {
        const accountKey = this._state.ethereumAccountPrivateKey
        const encKey = utils.Crypto.getSymEncKey(accountKey)
        const encrypted = utils.Crypto.asymEncrypt(encKey, pubKey)
        await this._contractService.admitSubscribing(addr, encrypted)
    }

    private async discardSubscribing(addr: string) {
        await this._contractService.discardSubscribing(addr)
    }

    private async trimSubscribing() {
        if (new Date().getTime() - this._state.lastTrimmed.getTime() < 84 * 86400 * 1000)
            return
        await this._contractService.trimSubscribing()
        this._state.trimmedSubscribingAt(new Date())
    }

    public async switchAccount(accountAddr: string) {
        const list = this._state.ethereumAccountList
        if (list.findIndex(ele => ele.addr == accountAddr) == -1) {
            throw new Error('Inexistent account!')
        }
        this._state.switchAccount(accountAddr)
        this._contractService.updateService()
        const name = await this._contractService.getPublisherName(accountAddr)
        if (name) {
            this._state.name = name
            this._state.registerPublisher()
        }
        this.handleMessage()
    }

    public logout() {
        this._state.logout()
        this._contractService.updateService()
    }

    public async addAccount(accountKey: string) {
        const addr = utils.computeAddr(accountKey)
        const keyPair = utils.Crypto.generateAsymKey()
        const name = await this._contractService.getPublisherName(addr)
        let isPublisher = false
        if (name)
            isPublisher = true
        this._state.addAccount(addr, accountKey, keyPair, isPublisher, name)
        await this.switchAccount(addr)
        await this._ipfsService.createUserDir(addr)
    }

    public async registerPublisher(name: string, price: number) {
        if (this._state.isPublisher())
            throw new Error('Already a publisher!')
        await this._contractService.registerPublisher(name, price)
        this._state.name = name
        this._state.registerPublisher()
    }

    public async rename(newName: string) {
        if (this._state.isPublisher())
            await this._contractService.renamePublisher(newName)
        this._state.name = newName
    }

    public async follow(addr: string) {
        const name = await this._contractService.getPublisherName(addr)
        if (!name)
            throw new Error('Not a publisher!')
        this._state.follow(addr, name)
    }

    public unfollow(addr: string) {
        this._state.unfollow(addr)
    }

    public async updateSubscribing() {
        const result = await this._contractService.getSubscribingStatus()
        const map = new Map<string, SubscribingInfo>()
        for (const ele of result) {
            switch (ele.status) {
                case 0:
                    map.set(ele.addr, { status: SubscribingStatus.NO })
                    break
                case 1:
                    map.set(ele.addr, { status: SubscribingStatus.REQ })
                    break
                case 2:
                    if (!ele.time) {
                        console.error('subscribing status error: status YES, time undefined')
                        continue
                    }
                    map.set(ele.addr, {
                        status: SubscribingStatus.YES,
                        time: ele.time,
                    })
                    break
                case 3:
                    await this.discardSubscribing(ele.addr)
                    break
            }
        }
        this._state.subscribingStatus = map
    }

    public async subscribe(addr: string, months: number) {
        const name = await this._contractService.getPublisherName(addr)
        if (!name)
            throw new Error('Not a publisher!')
        await this._contractService.subscribe(addr, months)
        await this.updateSubscribing()
    }

    public importAsymKeys(path: string) {
        const file = JSON.parse(utils.FSIO.read(path))
        this._state.asymmeticKey = { pub: file.publicKey!, pri: file.privateKey! }
    }

    public exportAsymKeys(path: string) {
        const file = {
            publicKey: this._state.asymmeticKey.pub,
            privateKey: this._state.asymmeticKey.pri,
        }
        utils.FSIO.write(path, JSON.stringify(file))
    }

    public async handleMessage() {
        try {
            this._state.checkLogin()
        } catch (error) {
            return
        }
        const hasMsg = await this._contractService.checkMessage()
        if (!hasMsg)
            return
        const msgs = await this._contractService.fetchMessage()
        for await (const msg of msgs) {
            switch (msg.code) {
                case MsgCode.SUB_REQ:
                    await this.admitSubscribing(msg.from, msg.content)
                    break
                default:
                    break
            }
        }
        await this._contractService.clearMessage()
        this.updateSubscribing()
        await this.trimSubscribing()
        save()
    }

    public stopMessageHandling() {
        clearInterval(this._timer)
    }
}