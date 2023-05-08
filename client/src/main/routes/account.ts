import { Container } from 'typedi'
import { State } from '@/main/State'
import { AccountService } from '@/main/services/Account'
import { ContractService } from '@/main/services/Contract'

export interface AccountAPI {
    getAccountList(): { accountAddress: string, name: string | undefined }[]
    addAccount(accountPrivateKey: string): Promise<void>
    login(accountAddress: string)
    logout()
    switchAccount(accountAddress: string)
    rename(newName: string): Promise<void>
    registerAsPublisher(name: string, price: number): Promise<void>
    follow(publisherAddress: string): Promise<void>
    unfollow(publisherAddress: string)
    subscribe(publisherAddress: string, months: number): Promise<void>
    getSubscribingTime(publisherAddress: string): Promise<Date>
    importAsymmeticKeys(path: string)
    exportAsymmeticKeys(path: string)
}

export interface AccountRouter {
    getAccountList: any
    addAccount: any
    login: any
    logout: any
    switchAccount: any
    rename: any
    registerAsPublisher: any
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
        function: function (args: any[]): { accountAddress: string, name: string | undefined }[] {
            args.length
            const state: State = Container.get('State')
            const list: { accountAddress: string, name: string | undefined }[] = []
            for (const ele of state.ethereumAccountList)
                list.push({
                    accountAddress: ele.addr,
                    name: ele.name,
                })
            return list
        },
    },
    addAccount: {
        signal: 'account:AddAccount',
        function: async function (args: any[]) {
            // check
            const accountPrivateKey = args[0]
            const service = Container.get(AccountService)
            await service.addAccount(accountPrivateKey)
        },
    },
    login: {
        signal: 'account:Login',
        function: function (args: any[]) {
            // check
            const accountAddress = args[0]
            const service = Container.get(AccountService)
            service.switchAccount(accountAddress)
        },
    },
    logout: {
        signal: 'account:Logout',
        function: function (args: any[]) {
            args.length
            const service = Container.get(AccountService)
            service.logout()
        },
    },
    switchAccount: {
        signal: 'account:SwitchAccount',
        function: function (args: any[]) {
            // check
            const accountAddress = args[0]
            const service = Container.get(AccountService)
            service.switchAccount(accountAddress)
        },
    },
    rename: {
        signal: 'account:Rename',
        function: async function (args: any[]) {
            // check
            const newName = args[0]
            const service = Container.get(AccountService)
            await service.rename(newName)
        },
    },
    registerAsPublisher: {
        signal: 'account:RegisterAsPublisher',
        function: async function (args: any[]) {
            // check
            const name = args[0]
            const price = args[1]
            const service = Container.get(AccountService)
            await service.registerPublisher(name, price)
        },
    },
    follow: {
        signal: 'account:Follow',
        function: async function (args: any[]) {
            // check
            const publisherAddress = args[0]
            const service = Container.get(AccountService)
            await service.follow(publisherAddress)
        },
    },
    unfollow: {
        signal: 'account:Unfollow',
        function: function (args: any[]) {
            // check
            const publisherAddress = args[0]
            const service = Container.get(AccountService)
            service.unfollow(publisherAddress)
        },
    },
    subscribe: {
        signal: 'account:Subscribe',
        function: async function (args: any[]) {
            // check
            const publisherAddress = args[0]
            const months = args[1]
            const service = Container.get(AccountService)
            await service.subscribe(publisherAddress, months)
        },
    },
    getSubscribingTime: {
        signal: 'account:GetSubsribingTime',
        function: async function (args: any[]): Promise<Date> {
            // check
            const publisherAddress = args[0]
            const service = Container.get(ContractService)
            const date =  await service.getSubscribingTime(publisherAddress)
            if (!date)
                throw new Error('Have not subscribed yet!')
            return date
        },
    },
    importAsymmeticKeys: {
        signal: 'account:ImportAsymmeticKeys',
        function: function (args: any[]) {
            // check
            const path = args[0]
            const service = Container.get(AccountService)
            service.importAsymKeys(path)
        },
    },
    exportAsymmeticKeys: {
        signal: 'account:ExportAsymmeticKeys',
        function: function (args: any[]) {
            // check
            const path = args[0]
            const service = Container.get(AccountService)
            service.exportAsymKeys(path)
        },
    },
}

export default accountRouter