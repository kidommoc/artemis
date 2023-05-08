import * as utils from '@/main/utils'

export enum SubscribingStatus {
    NO,
    REQ,
    YES,
}

export type StateFile = {
    EthereumUrl: string,
    ContractArtemis: string,
    ContractMessage: string,
    GraphQLUrl: string,
    LoginAccountAddress?: string,
    Accounts: {
        AccountAddress: string,
        AccountPrivateKey: string,
        AsymmeticKey?: {
            PublicKey: string,
            PrivateKey: string,
        },
        IsPublisher?: boolean,
        Name?: string,
        LastUpdate?: number,
        Following?: {
            Address: string,
            Name: string,
            IsSubscribing: SubscribingStatus,
        }[],
        Favourite?: {
            CID: string,
            Title: string,
        }[],
    }[],
}

export type AccountInfo = {
    address: string,
    accountKey: string,
    asymKey: { pub: string, pri: string },
    isPublisher: boolean,
    name: string | undefined,
    lastUpdate: Date,
    following: {
        addr: string,
        name: string,
        isSubscribing: SubscribingStatus
    }[],
    favourite: {
        cid: string,
        title: string,
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
    constructor(file: StateFile) {
        if (!file.EthereumUrl)
            throw new Error('Missing Ethereum network url!')
        if (!file.ContractArtemis)
            throw new Error('Missing Artemis contract address!')
        if (!file.ContractMessage)
            throw new Error('Missing ArtemisMessage contract address!')
        if (!file.GraphQLUrl)
            throw new Error('Missing GraphQL node url!')

        this._ethereumUrl = file.EthereumUrl!
        this._ethereumContractArtemis = file.ContractArtemis!
        this._ethereumContractMessage = file.ContractMessage!
        this._graphqlUrl = file.GraphQLUrl!
        this._ethereumAccountIndex = -1

        if (Array.isArray(file.Accounts))
            for (const ele of file.Accounts!) {
                if (ele.AccountAddress != utils.computeAddr(ele.AccountPrivateKey))
                    continue

                const asymKey = { pub: '', pri: '' }
                if (ele.AsymmeticKey) {
                    if (utils.Crypto.verifyKeyPair(ele.AsymmeticKey.PublicKey, ele.AsymmeticKey.PrivateKey))
                        continue;
                    asymKey.pub = ele.AsymmeticKey.PublicKey
                    asymKey.pri = ele.AsymmeticKey.PrivateKey
                }
                else {
                    const generated = utils.Crypto.generateAsymKey()
                    asymKey.pub = generated.publicKey
                    asymKey.pri = generated.privateKey
                }

                let isPublisher = false
                if (ele.IsPublisher)
                    isPublisher = ele.IsPublisher

                if (ele.AccountAddress == file.LoginAccountAddress!)
                    this._ethereumAccountIndex = this._accountInfos.length
                let lastUpdate = new Date()
                if (ele.LastUpdate && typeof ele.LastUpdate === 'number') {
                    const date = new Date(ele.LastUpdate)
                    if (!isNaN(date.getTime()))
                        lastUpdate = date
                }
                const following: any[] = []
                if (Array.isArray(ele.Following))
                    for (const fo of ele.Following!)
                        if (fo.Address && typeof fo.Address === 'string'
                            && fo.Name && typeof fo.Name === 'string'
                            && fo.IsSubscribing && typeof fo.IsSubscribing === 'boolean'
                        )
                            following.push({
                                addr: fo.Address,
                                name: fo.Name,
                                isSubscribing: fo.IsSubscribing,
                            })
                const favourite: any[] = []
                if (Array.isArray(ele.Favourite))
                    for (const fav of ele.Favourite!)
                        favourite.push({
                            cid: fav.CID,
                            title: fav.Title,
                        })
                const info: AccountInfo = {
                    address: ele.AccountAddress,
                    accountKey: ele.AccountPrivateKey,
                    asymKey: asymKey,
                    isPublisher: isPublisher,
                    name: ele.Name!,
                    lastUpdate: lastUpdate,
                    following: following,
                    favourite: favourite,
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
        const list: { addr: string, name: string | undefined }[] = []
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
        if (!newName) {
            // throw error
        }
        this._accountInfos[this._ethereumAccountIndex].name = newName!
    }
    get lastUpdate(): Date {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].lastUpdate
    }
    get followingList(): { addr: string, name: string }[] {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].following
    }
    get favouriteList(): { cid: string, title: string }[] {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].favourite
    }
    public isPublisher(): boolean {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].isPublisher
    }
    public registerPublisher() {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].isPublisher = true
    }
    public fetchedUpdate() {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].lastUpdate = new Date()
    }
    public isFavourite(cid: string): boolean {
        for (const info of this._accountInfos)
            if (info.favourite.findIndex(ele => ele.cid == cid) != -1)
                return true
        return false
    }

    // serialize state now to string
    public serialize(): string {
        const accounts: any[] = []
        for (const ele of this._accountInfos) {
            const following: any[] = []
            for (const fo of ele.following)
                following.push({
                    Address: fo.addr,
                    Name: fo.name,
                    IsSubscribing: fo.isSubscribing,
                })
            const favourite: any[] = []
            for (const fav of ele.favourite)
                favourite.push({
                    CID: fav.cid,
                    Title: fav.title,
                })
            const info = {
                AccountAddress: ele.address,
                AccountPrivateKey: ele.accountKey,
                AsymmeticKey: {
                    Public: ele.asymKey.pub,
                    Private: ele.asymKey.pri,
                },
                Name: ele.name,
                LastUpdate: ele.lastUpdate.getTime(),
                Following: following,
                Favourite: favourite,
            }
            accounts.push(info)
        }
        const loginAddr = this._ethereumAccountIndex == -1 ? undefined : this.ethereumAddr
        const json = {
            EthereumUrl: this._ethereumUrl,
            ContractArtemis: this._ethereumContractArtemis,
            ContractMessage: this._ethereumContractMessage,
            GraphQLUrl: this._graphqlUrl,
            LoginAccountAddress: loginAddr,
            Accounts: accounts,
        }
        return JSON.stringify(json)
    }

    // account operations

    public addAccount(
        addr: string, accountKey: string, 
        keyPair: { publicKey: string, privateKey: string },
        isPublisher: boolean, name?: string
    ) {
        if (this._accountInfos.findIndex(ele => ele.address == addr) != -1)
            return
        const info: AccountInfo = {
            address: addr,
            accountKey: accountKey,
            asymKey: {
                pub: keyPair.publicKey,
                pri: keyPair.privateKey
            },
            isPublisher: isPublisher,
            name: name,
            lastUpdate: new Date(),
            following: [],
            favourite: [],
        }
        this._accountInfos.push(info)
    }

    public switchAccount(addr: string) {
        const index = this._accountInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, do not switch
        if (index == -1) {
            // throw error
        }
        this._ethereumAccountIndex = index
    }

    public removeAccount(addr: string) {
        const index = this._accountInfos.findIndex(ele => ele.address == addr)
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

    public follow(addr: string, isSubscribing: SubscribingStatus, name?: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .following.findIndex(ele => ele.addr == addr)
        if (index == -1) {
            if (!name)
                throw new Error('Need a name for publisher!')
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

    public favourite(cid: string, title: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .favourite.findIndex(ele => ele.cid == cid)
        if (index == -1) {
            if (!title)
                throw new Error('Need a title for article!')
            this._accountInfos[this._ethereumAccountIndex]
                .favourite.push({
                    cid: cid,
                    title: title,
                })
        }
    }

    public unfavourite(cid: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .favourite.findIndex(ele => ele.cid == cid)
        if (index == -1)
            return
        this._accountInfos[this._ethereumAccountIndex]
            .favourite.splice(index)
    }
}