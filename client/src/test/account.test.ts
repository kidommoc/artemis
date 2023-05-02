import 'reflect-metadata'
import { Container } from 'typedi'
import * as fs from 'node:fs'
import { utils as ethersUtils } from 'ethers'
const ipfs = await import('ipfs-core')

import * as utils from '../main/utils'
import { State } from '../main/State'
import { AccountService } from '../main/services/Account'
import { ContractService } from '../main/services/Contract'

var state: State
var ipfsNode
var accountService: AccountService
var contractService: ContractService
var addrs: string[]

beforeAll(async () => {
    ipfsNode = await ipfs.create()
    Container.set('IPFSNode', ipfsNode)
    const file = utils.FSIO.read('./src/test/test-state.json')
    state = new State(JSON.parse(file))
    Container.set('State', state)
}, 120 * 1000)

describe('Test account service', () => {
    beforeAll(async () => {
        contractService = Container.get(ContractService)
        accountService = Container.get(AccountService)
    })

    test('add account0 and account1', async () => {
        const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
        expect(state.ethereumAddr).not.toBeDefined()
        const addr0 = ethersUtils.computeAddress(accounts[0])
        const addr1 = ethersUtils.computeAddress(accounts[1])
        await accountService.addAccount(accounts[0])
        expect(state.ethereumAddr).toEqual(addr0)
        await accountService.addAccount(accounts[1])

        state.ethereumAccountList.forEach(ele => addrs.push(ele.addr))
        expect(addrs[0]).toEqual(addr0)
        expect(addrs[1]).toEqual(addr1)
    }, 120 * 1000) // 2mins timeout

    test('switch from addr1 to addr0', async () => {
        accountService.switchAccount(addrs[0])
        expect(state.ethereumAddr).toEqual(addrs[0])
    })

    test('logout', () => {
        accountService.logout()
        expect(state.ethereumAddr).not.toBeDefined()
    })

    test('login account1', () => {
        accountService.switchAccount(addrs[1])
        expect(state.ethereumAddr).toEqual(addrs[1])
    })

    test('register account0 as publisher', async () => {
        accountService.switchAccount(addrs[0])
        await accountService.registerPublisher('AUTHOR 0', 0.005)
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual('AUTHOR 0')
    })

    test('rename account0 (publisher)', async () => {
        accountService.switchAccount(addrs[0])
        expect(state.isPublisher()).toBeTruthy()
        const name = `AUTHOR ${Math.floor(Math.random() * 10)}`
        await accountService.rename(name)
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual(name)
    })
    
    test('rename account1 (not publisher)', async () => {
        accountService.switchAccount(addrs[1])
        expect(state.isPublisher()).toBeFalsy()
        const name = `ACCOUNT ${Math.floor(Math.random() * 10)}`
        await accountService.rename(name)
        expect(state.name).toEqual(name)
    })

    test('check publisher', () => {
        accountService.switchAccount(addrs[0])
        expect(state.isPublisher()).toBeTruthy()
        accountService.switchAccount(addrs[1])
        expect(state.isPublisher()).toBeFalsy()
    })

    test('follow', () => {
        accountService.switchAccount(addrs[1])
        accountService.follow(addrs[0])
        expect(state.following.findIndex(ele => ele.addr == addrs[0])).not.toEqual(-1)
    })

    test('unfollow', () => {
        accountService.switchAccount(addrs[1])
        accountService.unfollow(addrs[0])
        expect(state.following.findIndex(ele => ele.addr == addrs[0])).toEqual(-1)
    })

    test('export and import asymmetic key', () => {
        accountService.switchAccount(addrs[1])
        const keyPair = state.asymmeticKey
        accountService.exportAsymKeys('testfile')
        state.asymmeticKey = { pub: '', pri: '' }
        accountService.importAsymKeys('testfile')
        fs.rmSync('testfile')
        expect(state.asymmeticKey).toEqual(keyPair)
    })

    afterAll(async () => {
        let list: string[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.files.rm(`/${list[i]}`, { recursive: true })
    }, 120 * 1000)
})

afterAll(async () => {
    await ipfsNode.stop()
}, 120 * 1000)