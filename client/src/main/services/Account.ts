import { Inject, Service } from 'typedi'
import { State } from '@/main/State'
import { ContractService } from '@/main/services/Contract'
import { IPFSService } from '@/main/services/IPFS'
import * as utils from '@/main/utils'

@Service()
export class AccountService {
    constructor(
        @Inject('State') private _state: State,
        @Inject() private _contractService: ContractService,
        @Inject() private _ipfsService: IPFSService
    ) {}

    public async login(accountAddr: string) {
        const list = this._state.ethereumAccountList
        if (list.findIndex(ele => ele == accountAddr) == -1) {
            // throw error
        }
        await this.switchAccount(accountAddr)
    }
    
    public async logout() {
        this._state.logout()
        await this._contractService.updateService()
    }

    public switchAccount(accountAddr: string) {
        this._state.switchAccount(accountAddr)
        this._contractService.updateService()
    }

    public async addAccount(accountKey: string) {
        const addr = utils.computeAddr(accountKey)
        const keyPair = utils.Crypto.generateAsymKey()
        const name = await this._contractService.getPublisherName(addr)
        let isPublisher = false
        if (name != undefined)
            isPublisher = true
        this._state.addAccount(addr, accountKey, keyPair, isPublisher, name)
        await this._contractService.updateService()
        await this._ipfsService.createUserDir(addr)
    }

    public async registerPublisher(name: string, price: number) {
        if (this._state.isPublisher()) {
            // throw error
        }
        await this._contractService.registerPublisher(name, price)
        this._state.name = name
        this._state.registerPublisher()
    }

    public async rename(newName: string) {
        if (this._state.isPublisher())
            await this._contractService.renamePublisher(newName)
        this._state.name = newName
    }

    public follow(addr: string, name: string) {
        this._state.follow(addr, name)
    }

    public unfollow(addr: string) {
        this._state.unfollow(addr)
    }

    public importAsymKeys(path: string) {
        const file = JSON.parse(utils.FSIO.read(path))
        this._state.asymmeticKey = { pub: file.publicKey!, pri: file.privateKey! }
    }

    public exportAsymKeys(path: string) {
        if (this._state.ethereumAddr == undefined) {
            // throw error
        }
        const file = {
            publicKey: this._state.asymmeticKey!.pub,
            privateKey: this._state.asymmeticKey!.pri,
        }
        utils.FSIO.write(path, JSON.stringify(file))
    }
}