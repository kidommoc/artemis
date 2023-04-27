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

    public async addAccount(accountKey: string) {
        const addr = utils.computeAddr(accountKey)
        const keyPair = utils.Crypto.generateAsymKey()
        this._state.addAccount(addr, accountKey, keyPair)
        await this._contractService.updateService()
        await this._ipfsService.createUserDir(addr)
    }

    public async login(accountAddr: string) {
        const list = this._state.ethereumAccountList
        if (list.findIndex(ele => ele == accountAddr) == -1) {
            // throw error
        }
        await this.switchAccount(accountAddr)
    }

    public async switchAccount(accountAddr: string) {
        this._state.switchAccount(accountAddr)
        await this._contractService.updateService()
    }
    
    public async logout() {
        this._state.logout()
        await this._contractService.updateService()
    }
}