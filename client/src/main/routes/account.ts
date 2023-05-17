import { Container } from 'typedi'
import { State } from '@/State'
import { SubscribingStatus } from '@/State'
import { AccountService } from '@/services/Account'
import { ContractService } from '@/services/Contract'
import type { PublisherInfo } from '@/routes/types'

export interface AccountAPI {
    getAccountList(): { accountAddress: string, name?: string }[]
    getAccountAddress(): Promise<string | undefined>
    getAccountPrivateKey(): Promise<string | undefined>
    getAccountBalance(): Promise<number | undefined>
    isPublisher(): Promise<boolean | undefined>
    getName(): Promise<string | undefined>
    getLastUpdateds(): Promise<Date>
    fetchedUpdateds(): Promise<void>
    addAccount(accountPrivateKey: string): Promise<string>
    login(accountAddress: string): Promise<void>
    logout(): Promise<void>
    switchAccount(accountAddress: string): Promise<void>
    rename(newName: string): Promise<void>
    registerAsPublisher(name: string, price: number): Promise<void>
    setSubscribingPrice(price: number): Promise<void>
    getFollowingList(): Promise<PublisherInfo[] | undefined>
    isFollowing(publisherAddress: string): Promise<boolean>
    follow(publisherAddress: string): Promise<void>
    unfollow(publisherAddress: string): Promise<void>
    subscribe(publisherAddress: string, months: number): Promise<void>
    getSubscribingTime(publisherAddress: string): Promise<Date | string>
    importAsymmeticKeys(path: string): Promise<void>
    exportAsymmeticKeys(path: string): Promise<void>
}

export interface AccountRouter {
    getAccountList: any
    getAccountAddress: any
    getAccountPrivateKey: any
    getAccountBalance: any
    isPublisher: any
    getName: any
    getLastUpdates,
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
    subscribe: any
    getSubscribingTime: any
    importAsymmeticKeys: any
    exportAsymmeticKeys: any
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
        function: async function (...args): Promise<string | undefined> {
            const state: State = Container.get('State')
            try {
                return state.ethereumAccountPrivateKey
            } catch (error) {
                return undefined
            }
        }
    },
    getAccountBalance: {
        signal: 'account:GetAccountBalance',
        function: async function (...args): Promise<number | undefined> {
            const service = Container.get(ContractService)
            try {
                return await service.getBalance()
            } catch (error) {
                return undefined
            }
        }
    },
    isPublisher: {
        signal: 'account:IsPublisher',
        function: async function (...args): Promise<boolean | undefined> {
            const state: State = Container.get('State')
            try {
                return state.isPublisher()
            } catch (error) {
                return undefined
            }
        }
    },
    getName: {
        signal: 'account:GetName',
        function: async function (...args): Promise<string | undefined> {
            const state: State = Container.get('State')
            try {
                if (state.name)
                    return state.name
                return undefined
            } catch (error) {
                return undefined
            }
        }
    },
    getLastUpdates: {
        signal: 'account:GetLastUpdates',
        function: async function (...args): Promise<Date> {
            const state: State = Container.get('State')
            return state.lastUpdate
        }
    },
    fetchedUpdates: {
        signal: 'account:FetchedUpdates',
        function: async function (...args): Promise<void> {
            const state: State = Container.get('State')
            state.fetchedUpdatesAt(new Date())
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
            service.switchAccount(accountAddress)
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
            service.switchAccount(accountAddress)
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
        function: async function (...args): Promise<PublisherInfo[] | undefined> {
            const state: State = Container.get('State')
            try {
                const list: PublisherInfo[] = []
                for (const ele of state.followingList)
                    list.push({
                        address: ele.addr,
                        name: ele.name,
                    })
                return list
            } catch (error) {
                return undefined
            }
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
    subscribe: {
        signal: 'account:Subscribe',
        function: async function (...args) {
            // check
            const publisherAddress = args[0]
            const months = args[1]
            const service = Container.get(AccountService)
            await service.subscribe(publisherAddress, months)
        },
    },
    getSubscribingTime: {
        signal: 'account:GetSubsribingTime',
        function: async function (...args): Promise<Date | string | undefined> {
            // check
            const publisherAddress = args[0]
            const state: State = Container.get('State')
            const service = Container.get(ContractService)
            const result = await service.getSubscribingTime(publisherAddress)
            if (result)
                return result
            else {
                const type = state.subscribingStatus(publisherAddress)
                switch (type) {
                    case SubscribingStatus.NO:
                        return 'NO'
                    case SubscribingStatus.REQ:
                        return 'REQ'
                    default:
                        return undefined
                }
            }
        },
    },
    importAsymmeticKeys: {
        signal: 'account:ImportAsymmeticKeys',
        function: async function (...args) {
            // check
            const path = args[0]
            const service = Container.get(AccountService)
            service.importAsymKeys(path)
        },
    },
    exportAsymmeticKeys: {
        signal: 'account:ExportAsymmeticKeys',
        function: async function (...args) {
            // check
            const path = args[0]
            const service = Container.get(AccountService)
            service.exportAsymKeys(path)
        },
    },
}

export default accountRouter