import * as utils from '@/utils'

export enum SubscribingStatus {
    NO,
    REQ,
    YES,
}
export type SubscribingInfo = {
    status: SubscribingStatus,
    time?: Date,
}
export type AccountInfo = {
    AccountAddress: string,
    AccountPrivateKey: string,
    AsymmeticKey?: {
        PublicKey: string,
        PrivateKey: string,
    },
    IsPublisher?: boolean,
    Name?: string,
    LastUpdated?: number,
    Followings?: {
        Address: string,
        Name: string,
    }[],
    Subscribings?: {
        Address: string,
        Status: SubscribingStatus,
        Time?: Date,
    }[],
    Favourites?: {
        CID: string,
        Title: string,
    }[],
}

export type StateFile = {
    EthereumUrl: string,
    ContractArtemis: string,
    ContractMessage: string,
    GraphQLUrl: string,
    Accounts: AccountInfo[],
}

export class State {
    private _ethereumUrl: string
    private _ethereumContractArtemis: string
    private _ethereumContractMessage: string
    private _ethereumAccountIndex: number
    private _graphqlUrl: string
    private _accountInfos: {
        address: string,
        accountKey: string,
        asymKey: { pub: string, pri: string },
        isPublisher: boolean,
        name: string | undefined,
        lastUpdated: Date,
        followings: {
            addr: string,
            name: string,
        }[],
        lastTrimmed: Date,
        subscribings: Map<string, SubscribingInfo>,
        favourites: {
            cid: string,
            title: string,
        }[],
    }[] = []

    /* constructor
     * required: ipfs url, chain url and contract addrs,
     * optional: login accounts
     */
    constructor(file: StateFile) {
        console.log(JSON.stringify(file))
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
                    if (!utils.Crypto.verifyKeyPair(ele.AsymmeticKey.PublicKey, ele.AsymmeticKey.PrivateKey))
                        continue;
                    asymKey.pub = ele.AsymmeticKey.PublicKey
                    asymKey.pri = ele.AsymmeticKey.PrivateKey
                }
                else {
                    const generated = utils.Crypto.generateAsymKey()
                    asymKey.pub = generated.publicKey
                    asymKey.pri = generated.privateKey
                }

                const isPublisher = ele.IsPublisher ? ele.IsPublisher : false

                const lastUpdated = (() => {
                    if (ele.LastUpdated) {
                        const date = new Date(ele.LastUpdated)
                        if (!isNaN(date.getTime()))
                            return date
                    }
                    return new Date()
                })()
                const followings: any[] = []
                if (Array.isArray(ele.Followings))
                    for (const fo of ele.Followings!)
                        followings.push({
                            addr: fo.Address,
                            name: fo.Name,
                        })
                const subscribings: Map<string, any> = new Map<string, any>()
                if (Array.isArray(ele.Subscribings))
                    for (const subs of ele.Subscribings!)
                        subscribings.set(subs.Address, {
                            status: subs.Status,
                            time: subs.Time!,
                        })
                const favourites: any[] = []
                if (Array.isArray(ele.Favourites))
                    for (const fav of ele.Favourites!)
                        favourites.push({
                            cid: fav.CID,
                            title: fav.Title,
                        })
                const info = {
                    address: ele.AccountAddress,
                    accountKey: ele.AccountPrivateKey,
                    asymKey: asymKey,
                    isPublisher: isPublisher,
                    name: ele.Name,
                    lastUpdated: lastUpdated,
                    followings: followings,
                    lastTrimmed: new Date(),
                    subscribings: subscribings,
                    favourites: favourites,
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
    get lastUpdated(): Date {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].lastUpdated
    }
    get followingList(): { addr: string, name: string }[] {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].followings
    }
    get lastTrimmed(): Date {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].lastTrimmed
    }
    set subscribingStatus(subs: Map<string, { status: SubscribingStatus, time?: Date }>) {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].subscribings = subs
    }
    get favouriteList(): { cid: string, title: string }[] {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].favourites
    }
    public isPublisher(): boolean {
        this.checkLogin()
        return this._accountInfos[this._ethereumAccountIndex].isPublisher
    }
    public registerPublisher() {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].isPublisher = true
    }
    public isFavouriting(cid: string): boolean {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .favourites.findIndex(ele => ele.cid == cid)
        if (index === -1)
            return false
        return true
    }
    public fetchedUpdatesAt(date: Date) {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].lastUpdated = date
    }
    public trimmedSubscribingAt(date: Date) {
        this.checkLogin()
        this._accountInfos[this._ethereumAccountIndex].lastTrimmed = date
    }
    public subscribingStatusOf(addr: string)
        : { status: SubscribingStatus, time?: Date }
    {
        this.checkLogin()
        const result = this._accountInfos[this._ethereumAccountIndex]
            .subscribings.get(addr)
        if (!result)
            return { status: SubscribingStatus.NO }
        return { status: result.status, time: result.time }
    }

    // serialize state now to string
    public serialize(): string {
        const accounts: AccountInfo[] = []
        for (const ele of this._accountInfos) {
            const info: AccountInfo = {
                AccountAddress: ele.address,
                AccountPrivateKey: ele.accountKey,
                AsymmeticKey: {
                    PublicKey: ele.asymKey.pub,
                    PrivateKey: ele.asymKey.pri,
                },
                Name: ele.name,
                LastUpdated: ele.lastUpdated.getTime(),
                Followings: [],
                Favourites: [],
            }
            for (const fo of ele.followings)
                info.Followings?.push({
                    Address: fo.addr,
                    Name: fo.name,
                })
            for (const subs of ele.subscribings)
                info.Subscribings?.push({
                    Address: subs[0],
                    Status: subs[1].status,
                    Time: subs[1].time,
                })
            for (const fav of ele.favourites)
                info.Favourites?.push({
                    CID: fav.cid,
                    Title: fav.title,
                })
            accounts.push(info)
        }
        return JSON.stringify(accounts)
    }

    // account operations

    public addAccount(
        addr: string, accountKey: string, 
        keyPair: { publicKey: string, privateKey: string },
        isPublisher: boolean, name?: string
    ) {
        if (this._accountInfos.findIndex(ele => ele.address == addr) != -1)
            return
        const info = {
            address: addr,
            accountKey: accountKey,
            asymKey: {
                pub: keyPair.publicKey,
                pri: keyPair.privateKey
            },
            isPublisher: isPublisher,
            name: name,
            lastUpdated: new Date(),
            followings: [],
            lastTrimmed: new Date(),
            subscribings: new Map<string, any>(),
            favourites: [],
        }
        this._accountInfos.push(info)
    }

    public switchAccount(addr: string) {
        const index = this._accountInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, do not switch
        if (index == -1)
            throw new Error('No this account!')
        this._ethereumAccountIndex = index
    }

    public removeAccount(addr: string) {
        const index = this._accountInfos.findIndex(ele => ele.address == addr)
        // fail: index == -1, remove nothing
        if (index == -1)
            throw new Error('No this account!')
        this.logout()
        this._accountInfos.splice(index)
    }

    public logout() {
        this._ethereumAccountIndex = -1
    }

    public follow(addr: string, name?: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .followings.findIndex(ele => ele.addr == addr)
        if (index == -1) {
            if (!name)
                throw new Error('Need a name for publisher!')
            this._accountInfos[this._ethereumAccountIndex].followings.push({
                addr: addr,
                name: name!,
            })
        }
    }

    public unfollow(addr: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .followings.findIndex(ele => ele.addr == addr)
        if (index == -1)
            return
        this._accountInfos[this._ethereumAccountIndex]
            .followings.splice(index)
    }

    public favourite(cid: string, title: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .favourites.findIndex(ele => ele.cid == cid)
        if (index == -1) {
            if (!title)
                throw new Error('Need a title for article!')
            this._accountInfos[this._ethereumAccountIndex]
                .favourites.push({
                    cid: cid,
                    title: title,
                })
        }
    }

    public unfavourite(cid: string) {
        this.checkLogin()
        const index = this._accountInfos[this._ethereumAccountIndex]
            .favourites.findIndex(ele => ele.cid == cid)
        if (index == -1)
            return
        this._accountInfos[this._ethereumAccountIndex]
            .favourites.splice(index)
    }
}