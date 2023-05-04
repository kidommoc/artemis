import * as utils from '@/main/utils'

export enum SubscribingStatus {
    NO,
    REQ,
    YES,
}
export type AsymmeticKey = { pub: string, pri: string }
export type AccountInfo = {
    address: string,
    accountKey: string,
    asymKey: AsymmeticKey,
    isPublisher: boolean,
    name: string | undefined,
    following: {
        addr: string,
        name: string,
        isSubscribing: SubscribingStatus
    }[],
}

export class State {
    private _ethereumUrl: string
    private _ethereumContractArtemis: string
    private _ethereumContractMessage: string
    private _ethereumAccountIndex: number
    private _graphqlUrl: string
    private _accountInfos: AccountInfo[] = []

    /* constructor
     * required: ipfs url, chain url and contract addrs,
     * optional: log-in accounts
     */
    constructor(file: any) {
        // empty check
        if (file.EthereumUrl! == undefined
            || file.ContractMessage! == undefined
            || file.ContractArtemis! == undefined
            || file.GraphQLUrl! == undefined
        ) {
            // throw error
        }

        this._ethereumUrl = file.EthereumUrl!
        this._ethereumContractArtemis = file.ContractArtemis!
        this._ethereumContractMessage = file.ContractMessage!
        this._graphqlUrl = file.GraphQLUrl!
        this._ethereumAccountIndex = -1

        if (file.Accounts != undefined)
            for (const ele of file.Accounts!) {
                // empty/error check
                if (ele.AccountAddress! == undefined
                    || ele.AccountPrivateKey! == undefined
                    || ele.AsymmeticKey! == undefined
                    || ele.AsymmeticKey.PublicKey! == undefined
                    || ele.AsymmeticKey.PrivateKey! == undefined
                    || ele.IsPublisher! == undefined
                ) {
                    // throw error
                }
                if (ele.AccountAddress != utils.computeAddr(ele.AccountPrivateKey)) {
                    // throw error
                }
                if (utils.Crypto.verifyKeyPair(ele.AsymmeticKey.PublicKey, ele.AsymmeticKey.PrivateKey)) {
                    // throw error
                }

                if (ele.AccountAddress == file.LoginAccountAddress!)
                    this._ethereumAccountIndex = this._accountInfos.length
                let following: any[] = []
                if (Array.isArray(ele.Following))
                    for (const follow of ele.Following!) {
                        if (follow.Address != undefined
                            && follow.Name != undefined
                            && follow.isSubscribing != undefined
                        )
                            following.push({
                                addr: follow.Address,
                                name: follow.Name,
                                isSubscribing: follow.IsSubscribing,
                            })
                    } 
                let info: AccountInfo = {
                    address: ele.AccountAddress,
                    accountKey: ele.AccountPrivateKey,
                    asymKey: {
                        pub: ele.AsymmeticKey.Public,
                        pri: ele.AsymmeticKey.Private
                    },
                    isPublisher: ele.IsPublisher,
                    name: ele.Name!,
                    following: following
                }
                this._accountInfos.push(info)
            }
    }

    public checkLogin() {
        if (this._ethereumAccountIndex == -1)
            throw Error('Have not logined')
    }

    // getters of static contents

    get ethereumUrl(): string { return this._ethereumUrl }
    get ethereumContracts(): { artemis: string, message: string } {
        return {
            artemis: this._ethereumContractArtemis,
            message: this._ethereumContractMessage,
        }
    }
    get graphqlUrl(): string { return this._graphqlUrl }
    get ethereumAccountList(): { addr: string, name: string | undefined }[] {
        let list: { addr: string, name: string | undefined }[] = []
        for (const ele of this._accountInfos)
            list.push({
                addr: ele.address,
                name: ele.name,
            })
        return list
    }

    // getters and setters of login-account associated contents

    get ethereumAddr(): string {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].address
    }
    get ethereumAccountPrivateKey(): string {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].accountKey
    }
    get asymmeticKey(): { pub: string, pri: string } {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex]!.asymKey
    }
    set asymmeticKey(keyPair: {pub: string, pri: string}) {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].asymKey.pub = keyPair!.pub
        this._accountInfos[this._ethereumAccountIndex].asymKey.pri = keyPair!.pri
    }
    get name(): string | undefined {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].name
    }
    set name(newName: string | undefined) {
        this.checkLogin()
        if (newName! == undefined) {
            // throw error
        }
        this._accountInfos[this._ethereumAccountIndex].name = newName!
    }
    get following(): { addr: string, name: string }[] {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].following
    }
    public isPublisher(): boolean {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].isPublisher
    }
    public registerPublisher() {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].isPublisher = true
    }

    // serialize state now to string
    public serialize(): string {
        let accounts: any[] = []
        for (const ele of this._accountInfos) {
            let following: any[] = []
            for (const follow of ele.following)
                following.push({
                    Address: follow.addr,
                    Name: follow.name,
                    IsSubscribing: follow.isSubscribing,
                })
            const info = {
                AccountAddress: ele.address,
                AccountPrivateKey: ele.accountKey,
                AsymmeticKey: {
                    Public: ele.asymKey.pub,
                    Private: ele.asymKey.pri,
                },
                IsPublisher: ele.isPublisher,
                Name: ele.name,
                Following: following,
            }
            accounts.push(info)
        }
        let json = {
            EthereumUrl: this._ethereumUrl,
            ContractArtemis: this._ethereumContractArtemis,
            ContractMessage: this._ethereumContractMessage,
            GraphQLUrl: this._graphqlUrl,
            LoginAccountAddress: this.ethereumAddr,
            Accounts: accounts,
        }
        return JSON.stringify(json)
    }

    // account operations

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
    }

    public switchAccount(addr: string) {
        let index = this._accountInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, do not switch
        if (index == -1) {
            // throw error
        }
        this._ethereumAccountIndex = index
    }

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

    public logout() {
        this._ethereumAccountIndex = -1
    }

    public follow(addr: string, name: string | undefined, isSubscribing: SubscribingStatus) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .following.findIndex(ele => ele.addr == addr)
        if (index == -1) {
            if (name == undefined)
                throw new Error('Neea a name for publisher!')
            this._accountInfos[this._ethereumAccountIndex].following.push({
                addr: addr,
                name: name!,
                isSubscribing: isSubscribing,
            })
        }
        else
            this._accountInfos[this._ethereumAccountIndex]
                .following[index].isSubscribing = isSubscribing
    }

    public unfollow(addr: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .following.findIndex(ele => ele.addr == addr)
        if (index == -1)
            return
        this._accountInfos[this._ethereumAccountIndex]
            .following.splice(index)
    }
}