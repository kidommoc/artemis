import { Inject, Service } from 'typedi'
import { State, SubscribingStatus } from '@/main/State'
import { ContractService, MsgCode } from '@/main/services/Contract'
import { IPFSService } from '@/main/services/IPFS'
import * as utils from '@/main/utils'

@Service()
export class AccountService {
    private _timer: ReturnType<typeof setInterval>
    constructor(
        @Inject('State') private _state: State,
        @Inject() private _contractService: ContractService,
        @Inject() private _ipfsService: IPFSService
    ) {
        this.handleMessage()
        this._timer = setInterval(() => this.handleMessage(), 5 * 60 * 1000)
    }

    private async admitSubscribing(addr: string, pubKey: string) {
        const accountKey = this._state.ethereumAccountPrivateKey
        const encKey = utils.Crypto.getSymEncKey(accountKey)
        const encrypted = utils.Crypto.asymEncrypt(encKey, pubKey)
        await this._contractService.admitSubscribing(addr, encrypted)
    }

    public switchAccount(accountAddr: string) {
        const list = this._state.ethereumAccountList
        if (list.findIndex(ele => ele.addr == accountAddr) == -1) {
            throw new Error('Inexistent account!')
        }
        this._state.switchAccount(accountAddr)
        this._contractService.updateService()
        // this.handleMessage()
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
        this.switchAccount(addr)
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
        if (name! == undefined)
            throw new Error('Not a publisher!')
        this._state.follow(addr, SubscribingStatus.NO, name!)
    }

    public unfollow(addr: string) {
        this._state.unfollow(addr)
    }

    public async subscribe(addr: string, months: number) {
        const name = await this._contractService.getPublisherName(addr)
        if (!name)
            throw new Error('Not a publisher!')
        await this._contractService.subscribe(addr, months)
        this._state.follow(addr, SubscribingStatus.REQ, name!)
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
                case MsgCode.SUB_RES:
                    try {
                        this._state.follow(msg.from, SubscribingStatus.YES)
                    } catch (error) { }
                    break
                default:
                    break
            }
        }
        await this._contractService.clearMessage()
    }

    public stopMessageHandling() {
        clearInterval(this._timer)
    }
}