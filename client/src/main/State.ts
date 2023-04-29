import * as utils from '@/main/utils'

export type AsymmeticKey = { pub: string, pri: string }
export type AccountInfo = {
    address: string,
    accountKey: string,
    asymKey: AsymmeticKey,
    isPublisher: boolean,
    name: string | undefined,
    following: { addr: string, name: string }[],
}

export class State {
    private _ethereumContractArtemis: string
    private _ethereumContractMessage: string
    private _ethereumUrl: string
    private _ethereumAccountIndex: number
    private _accountInfos: AccountInfo[] = []

    /* constructor
     * required: ipfs url, chain url and contract addrs,
     * optional: log-in accounts
     */
    constructor(file: any) {
        // empty check
        if (file.contractArtemis! == undefined
            || file.contractMessage! == undefined
            || file.ethereumUrl! == undefined
        ) {
            // throw error
        }

        this._ethereumContractArtemis = file.contractArtemis!
        this._ethereumContractMessage = file.contractMessage!
        this._ethereumUrl = file.ethereumUrl!
        this._ethereumAccountIndex = -1

        if (file.accounts != undefined)
            file.accounts!.forEach(ele => {
                // empty/error check
                if (ele.accountAddress! == undefined
                    || ele.accountPrivateKey! == undefined
                    || ele.asymmeticKey! == undefined
                    || ele.asymmeticKey.publicKey! == undefined
                    || ele.asymmeticKey.privateKey! == undefined
                    || ele.isPublisher! == undefined
                ) {
                    // throw error
                }
                if (ele.accountAddress != utils.computeAddr(ele.accountPrivateKey)) {
                    // throw error
                }
                if (utils.Crypto.verifyKeyPair(ele.asymmeticKey.publicKey, ele.asymmeticKey.privateKey)) {
                    // throw error
                }

                if (ele.accountAddress == file.loginAccountAddress!)
                    this._ethereumAccountIndex = this._accountInfos.length
                let following: { addr: string, name: string }[] = []
                if (Array.isArray(ele.following))
                    ele.following.forEach(ele => {
                        if (ele.address != undefined && ele.name != undefined)
                            following.push({
                                addr: ele.address,
                                name: ele.name,
                            })
                    }) 
                let info: AccountInfo = {
                    address: ele.accountAddress,
                    accountKey: ele.accountPrivateKey,
                    asymKey: {
                        pub: ele.asymmeticKey.public,
                        pri: ele.asymmeticKey.private
                    },
                    isPublisher: ele.isPublisher,
                    name: ele.name,
                    following: following
                }
                this._accountInfos.push(info)
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
        this._accountInfos.forEach(ele => list.push(ele.address))
        return list
    }
    get ethereumAddr(): string | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._accountInfos[this._ethereumAccountIndex].address
    }
    get ethereumAccountPrivateKey(): string | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._accountInfos[this._ethereumAccountIndex].accountKey
    }
    get asymmeticKey(): { pub: string, pri: string } | undefined {
        if (this._ethereumAccountIndex == -1)
            return undefined
        return this._accountInfos[this._ethereumAccountIndex]!.asymKey
    }
    set asymmeticKey(keyPair: {pub: string, pri: string} | undefined) {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        if (keyPair == undefined || keyPair!.pub == undefined || keyPair!.pri == undefined) {
            // throw error
        }
        this._accountInfos[this._ethereumAccountIndex].asymKey.pub = keyPair!.pub
        this._accountInfos[this._ethereumAccountIndex].asymKey.pri = keyPair!.pri
    }
    get name(): string | undefined {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        return this._accountInfos[this._ethereumAccountIndex].name
    }
    set name(newName: string| undefined) {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        if (newName == undefined) {
            // throw error
        }
        this._accountInfos[this._ethereumAccountIndex].name = newName!
    }
    get following(): { addr: string, name: string }[] {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        return this._accountInfos[this._ethereumAccountIndex].following
    }

    public isPublisher(): boolean {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        return this._accountInfos[this._ethereumAccountIndex].isPublisher
    }

    public registerPublisher() {
        if (this._ethereumAccountIndex == -1) {
            // throw error
        }
        this._accountInfos[this._ethereumAccountIndex].isPublisher = true
    }

    public follow(addr: string, name: string) {
        const index = this._accountInfos[this._ethereumAccountIndex]
            .following.findIndex(ele => ele.addr == addr)
        if (index != -1)
            return
        this._accountInfos[this._ethereumAccountIndex].following.push({
            addr: addr,
            name: name,
        })
    }

    public unfollow(addr: string) {
        const index = this._accountInfos[this._ethereumAccountIndex]
            .following.findIndex(ele => ele.addr == addr)
        if (index == -1)
            return
        this._accountInfos[this._ethereumAccountIndex]
            .following.splice(index)
    }

    /* fn: addAccount
     * use account private key and address to add a new account
     */
    public addAccount(
        addr: string, accountKey: string, 
        keyPair: { publicKey: string, privateKey: string },
        isPublisher: boolean, name: string | undefined
    ) {
        if (this._accountInfos.findIndex(ele => ele.address == addr) != -1)
            return
        let info: AccountInfo = {
            address: addr,
            accountKey: accountKey,
            asymKey: {
                pub: keyPair.publicKey,
                pri: keyPair.privateKey
            },
            isPublisher: isPublisher,
            name: name,    
            following: [],
        }
        this._accountInfos.push(info)
        if (this._ethereumAccountIndex < 0)
            this._ethereumAccountIndex = 0
    }

    /* fn: switchAccount
     * switch current account to another on the given address
     */
    public switchAccount(addr: string) {
        let index = this._accountInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, do not switch
        if (index == -1) {
            // throw error
        }
        this._ethereumAccountIndex = index
    }

    /* fn: removeAccount
     * remove the account on the given address
     */
    public removeAccount(addr: string) {
        let index = this._accountInfos.findIndex(ele => ele.address == addr)
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
        this._accountInfos.splice(index)
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
        let accounts: any[] = []
        this._accountInfos.forEach(ele => {
            let following: { address: string, name: string }[] = []
            ele.following.forEach( ele => following.push({
                address: ele.addr,
                name: ele.name,
            }))
            const info = {
                accountAddress: ele.address,
                accountPrivateKey: ele.accountKey,
                asymmeticKey: {
                    public: ele.asymKey.pub,
                    private: ele.asymKey.pri,
                },
                isPublisher: ele.isPublisher,
                name: ele.name,
                following: following,
            }
            accounts.push(info)
        })
        let json = {
            contractArtemis: this._ethereumContractArtemis,
            contractMessage: this._ethereumContractMessage,
            ethereumUrl: this._ethereumUrl,
            loginAccountAddress: this.ethereumAddr,
            accounts: accounts,
        }
        return JSON.stringify(json)
    }
}