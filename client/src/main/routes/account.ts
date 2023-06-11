import { Container } from 'typedi'
import { State } from '@/State'
import type { SubscribingInfo } from '@/State'
import { AccountService } from '@/services/Account'
import { ContractService } from '@/services/Contract'
import type { PublisherInfo } from '@/routes/types'

export interface AccountAPI {
    getAccountList(): { accountAddress: string, name?: string }[]
    getAccountAddress(): Promise<string>
    getAccountPrivateKey(): Promise<string>
    getAccountBalance(): Promise<number>
    isPublisher(): Promise<boolean>
    getName(): Promise<string>
    getLastUpdated(): Promise<Date>
    fetchedUpdates(date: Date): Promise<void>
    addAccount(accountPrivateKey: string): Promise<string>
    login(accountAddress: string): Promise<void>
    logout(): Promise<void>
    switchAccount(accountAddress: string): Promise<void>
    rename(newName: string): Promise<void>
    registerAsPublisher(name: string, price: number): Promise<void>
    setSubscribingPrice(price: number): Promise<void>
    getFollowingList(): Promise<{ info: PublisherInfo, subscribing: SubscribingInfo }[]>
    isFollowing(publisherAddress: string): Promise<boolean>
    follow(publisherAddress: string): Promise<void>
    unfollow(publisherAddress: string): Promise<void>
    getSubscribingStatus(publisherAddress: string): Promise<SubscribingInfo>
    subscribe(publisherAddress: string, months: number): Promise<void>
}

export interface AccountRouter {
    getAccountList: any
    getAccountAddress: any
    getAccountPrivateKey: any
    getAccountBalance: any
    isPublisher: any
    getName: any
    getLastUpdated,
    fetchedUpdates,
    addAccount: any
    login: any
    logout: any
    switchAccount: any
    rename: any
    registerAsPublisher: any
    setSubscribingPrice: any
    getFollowingList: any
    isFollowing: any
    follow: any
    unfollow: any
    getSubscribingStatus: any
    subscribe: any
}

const accountRouter: AccountRouter = {
    getAccountList : {
        signal: 'account:GetAccountList',
        function: async function (...args): Promise<{ accountAddress: string, name?: string }[]> {
            const state: State = Container.get('State')
            const list: { accountAddress: string, name?: string }[] = []
            for (const ele of state.ethereumAccountList)
                list.push({
                    accountAddress: ele.addr,
                    name: ele.name,
                })
            return list
        },
    },
    getAccountAddress: {
        signal: 'account:GetAccountAddress',
        function: async function (...args): Promise<string | undefined> {
            const state: State = Container.get('State')
            try {
                return state.ethereumAddr
            } catch (error) {
                return undefined
            }
        }
    },
    getAccountPrivateKey: {
        signal: 'account:GetAccountPrivateKey',
        function: async function (...args): Promise<string> {
            const state: State = Container.get('State')
            return state.ethereumAccountPrivateKey
        }
    },
    getAccountBalance: {
        signal: 'account:GetAccountBalance',
        function: async function (...args): Promise<number> {
            const service = Container.get(ContractService)
            return await service.getBalance()
        }
    },
    isPublisher: {
        signal: 'account:IsPublisher',
        function: async function (...args): Promise<boolean> {
            const state: State = Container.get('State')
            return state.isPublisher()
        }
    },
    getName: {
        signal: 'account:GetName',
        function: async function (...args): Promise<string | undefined> {
            const state: State = Container.get('State')
            if (state.name)
                return state.name
            return undefined
        }
    },
    getLastUpdated: {
        signal: 'account:GetLastUpdated',
        function: async function (...args): Promise<Date> {
            const state: State = Container.get('State')
            return state.lastUpdated
        }
    },
    fetchedUpdates: {
        signal: 'account:FetchedUpdates',
        function: async function (...args): Promise<void> {
            // check
            const date = args[0]
            const state: State = Container.get('State')
            state.fetchedUpdatesAt(date)
        }
    },
    addAccount: {
        signal: 'account:AddAccount',
        function: async function (...args): Promise<string> {
            // check
            const accountPrivateKey = args[0]
            const state: State = Container.get('State')
            const service = Container.get(AccountService)
            await service.addAccount(accountPrivateKey)
            return state.ethereumAddr
        },
    },
    login: {
        signal: 'account:Login',
        function: async function (...args) {
            // check
            const accountAddress = args[0]
            const service = Container.get(AccountService)
            await service.switchAccount(accountAddress)
        },
    },
    logout: {
        signal: 'account:Logout',
        function: async function (...args) {
            const service = Container.get(AccountService)
            service.logout()
        },
    },
    switchAccount: {
        signal: 'account:SwitchAccount',
        function: async function (...args) {
            // check
            const accountAddress = args[0]
            const service = Container.get(AccountService)
            await service.switchAccount(accountAddress)
        },
    },
    rename: {
        signal: 'account:Rename',
        function: async function (...args) {
            // check
            const newName = args[0]
            const service = Container.get(AccountService)
            await service.rename(newName)
        },
    },
    registerAsPublisher: {
        signal: 'account:RegisterAsPublisher',
        function: async function (...args) {
            // check
            const name = args[0]
            const price = args[1]
            const service = Container.get(AccountService)
            await service.registerPublisher(name, price)
        },
    },
    setSubscribingPrice: {
        signal: 'account:SetSubscribingPrice',
        function: async function(...args) {
            // check
            const price = args[0]
            const service = Container.get(ContractService)
            await service.setSubscribingPrice(price)
        }
    },
    getFollowingList: {
        signal: 'account:GetFollowingList',
        function: async function (...args)
            : Promise< { info: PublisherInfo, subscribing: SubscribingInfo }[]>
        {
            const state: State = Container.get('State')
            const service = Container.get(AccountService)
            await service.updateSubscribing()
            const list: any[] = []
            for (const ele of state.followingList)
                list.push({
                    info: {
                        address: ele.addr,
                        name: ele.name,
                    },
                    subscribing: state.subscribingStatusOf(ele.addr),
                })
            return list
        }
    },
    isFollowing: {
        signal: 'account:IsFollowing',
        function: async function (...args): Promise<boolean> {
            // check
            const publisherAddress = args[0]
            const state: State = Container.get('State')
            const index = state.followingList.findIndex(ele => ele.addr == publisherAddress)
            if (index === -1)
                return false
            return true
        }
    },
    follow: {
        signal: 'account:Follow',
        function: async function (...args) {
            // check
            const publisherAddress = args[0]
            const service = Container.get(AccountService)
            await service.follow(publisherAddress)
        },
    },
    unfollow: {
        signal: 'account:Unfollow',
        function: async function (...args) {
            // check
            const publisherAddress = args[0]
            const service = Container.get(AccountService)
            service.unfollow(publisherAddress)
        },
    },
    getSubscribingStatus: {
        signal: 'account:GetSubsribingStatus',
        function: async function (...args): Promise<SubscribingInfo> {
            // check
            const publisherAddress = args[0]
            const state: State = Container.get('State')
            const service = Container.get(AccountService)
            await service.updateSubscribing()
            return state.subscribingStatusOf(publisherAddress)
        },
    },
    subscribe: {
        signal: 'account:Subscribe',
        function: async function (...args) {
            // check
            const publisherAddress = args[0]
            const months = args[1]
            const service = Container.get(AccountService)
            await service.subscribe(publisherAddress, months)
            await service.updateSubscribing()
        },
    },
}

export default accountRouter