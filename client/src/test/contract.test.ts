import 'reflect-metadata'
import { Container } from 'typedi'
import * as ethers from 'ethers'
import * as utils from '../main/utils'
import { State } from '../main/State'
import { SubscribingStatus } from '../main/State'
import { AccountService } from '../main/services/Account'
import { ContractService, MsgCode as ContractMsgCode } from '../main/services/Contract'

// local test accounts
const freeArticleAddr = 'TEST_ADDR_FREETOACCESS_IN_BASE_58'
const paidArticleAddr = 'TEST_ADDR_REQSUBSCRIBE_IN_BASE_58'
let state: State
let ipfsNode
let accountService: AccountService
let contractService: ContractService
const addrs: string[] = []
let uploadTime = new Date()
let admitTxHash: string

beforeAll(async () => {
    const ipfs = await import('ipfs-core')
    const file = utils.FSIO.read('./src/test/test-state.json')
    state = new State(JSON.parse(file))
    Container.set('State', state)
    ipfsNode = await ipfs.create()
    Container.set('IPFSNode', ipfsNode)
}, 120 * 1000)

describe('Test contract service:', () => {
    beforeAll(async () => {
        accountService = Container.get(AccountService)
        contractService = Container.get(ContractService)
    }, 120 * 1000)

    test('login account0 and account1', async () => {
        const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
        // test adding account
        await accountService.addAccount(accounts[0])
        await accountService.addAccount(accounts[1])
        for (const ele of state.ethereumAccountList)
            addrs.push(ele.addr)

        // check list and current account
        expect(addrs[0]).toEqual(ethers.utils.computeAddress(accounts[0]))
        expect(addrs[1]).toEqual(ethers.utils.computeAddress(accounts[1]))
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(accounts[0]))

        // test switching account
        await accountService.switchAccount(addrs[1])
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(accounts[1]))
    }, 120 * 1000)

    test('account0: register as publisher', async () => {
        await accountService.switchAccount(addrs[0])
        await accountService.registerPublisher('ACCOUNT 0', 0.05)
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual('ACCOUNT 0')
    })

    test('account0, account1: check publisher', async () => {
        await accountService.switchAccount(addrs[0])
        expect(state.isPublisher()).toBeTruthy()
        await accountService.switchAccount(addrs[1])
        expect(state.isPublisher()).toBeFalsy()
    })

    test('account0: rename as publisher', async () => {
        await accountService.switchAccount(addrs[0])
        await contractService.renamePublisher('AUTHOR 0')
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual('AUTHOR 0')
    })

    test ('account1: fetch publisher info', async () => {
        await accountService.switchAccount(addrs[1])
        const subscribingPrice = await contractService.getSubscribingPrice(addrs[0])
        const publisherPubKey = await contractService.getPublisherPubKey(addrs[0])
        expect(subscribingPrice).toBeCloseTo(0.05, 4)
        await accountService.switchAccount(addrs[0])
        expect(publisherPubKey).toEqual(state.asymmeticKey.pub)
    })

    test('account0: upload a free article', async () => {
        await accountService.switchAccount(addrs[0])
        const tx = await contractService.uploadArticle(freeArticleAddr, 'free to read!', false)
        uploadTime = await contractService.getTransactionTime(tx)
    })

    test('account1: fetch info of free article', async () => {
        await accountService.switchAccount(addrs[1])
        const info = await contractService.getArticleInfo(freeArticleAddr)
        expect(info.title).toEqual('free to read!')
        expect(info.publisher).toEqual('AUTHOR 0')
        expect(info.publisherAddr).toEqual(addrs[0])
        expect(info.reqSubscribing).toBeFalsy()
        expect(info.date.getTime()).toEqual(uploadTime.getTime())
    })

    test('account1: access free article', async () => {
        await accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(freeArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toBeNull()
    })

    test('account0: remove free article', async () => {
        await accountService.switchAccount(addrs[0])
        await contractService.removeArticle(freeArticleAddr)

        // removing successed if no one can visit free article
        await accountService.switchAccount(addrs[1])
        await expect(contractService.getArticleInfo(freeArticleAddr))
            .rejects.toThrow()
        await expect(contractService.accessArticle(freeArticleAddr))
            .rejects.toThrow()
    })

    test('account0: upload paid article', async () => {
        await accountService.switchAccount(addrs[0])
        await contractService.uploadArticle(paidArticleAddr, 'need subscribing!', true)
    })

    test('account1: cannot access paid article', async () => {
        await accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeFalsy()
        expect(permission.encKey).toBeNull()
    })

    test('account1: subscribe account0', async () => {
        // clear message of account0
        await accountService.switchAccount(addrs[0])
        await contractService.clearMessage()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()

        // test subscribing
        await accountService.switchAccount(addrs[1])
        await contractService.subscribe(addrs[0], 1)

        // submitting successed if there's any message in account0
        await accountService.switchAccount(addrs[0])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
    })

    test('account0: receive request message', async () => {
        // test checking message
        await accountService.switchAccount(addrs[0])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()

        // test fetching message
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(addrs[1])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_REQ)
        await accountService.switchAccount(addrs[1])
        expect(msgs[0].content).toEqual(state.asymmeticKey.pub)

        // test clearing message
        await accountService.switchAccount(addrs[0])
        await contractService.clearMessage()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()
    })

    test('account0: admit subscribing', async () => {
        await accountService.switchAccount(addrs[0])
        admitTxHash = await contractService.admitSubscribing(addrs[1], 'TESTENCKEY0_1')

        // submitting successed if there's any message in account1
        await accountService.switchAccount(addrs[1])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(addrs[0])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_RES)
        expect(msgs[0].content).toEqual('OK')
    })

    test('account1: check subscribing status of account1', async () => {
        await accountService.switchAccount(addrs[1])
        const status = await contractService.getSubscribingStatus()
        const index = status.findIndex(ele => ele.addr == addrs[0])
        expect(index).not.toEqual(-1)
        expect(status[index].addr).toEqual(addrs[0])
        expect(status[index].status).toEqual(2)
        expect(status[index].time).toBeDefined()
        const admittedTime = await contractService.getTransactionTime(admitTxHash)
        expect(status[index].time?.getTime()).toEqual(admittedTime.getTime())
    })

    test('account1: be able to access paid article', async () => {
        await accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toEqual('TESTENCKEY0_1')
    })

    afterAll(async () => {
        await accountService.switchAccount(addrs[0])
        await contractService.removeArticle(paidArticleAddr)
    })

})

afterAll(async () => {
    accountService.stopMessageHandling()
    await ipfsNode.stop()
}, 120 * 1000)