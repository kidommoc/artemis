import 'reflect-metadata'
import { Container } from 'typedi'
import * as ethers from 'ethers'
import * as utils from '../main/utils'
import { State } from '../main/State'
import { AccountService } from '../main/services/Account'
import { ContractService, MsgCode as ContractMsgCode } from '../main/services/Contract'

// local test accounts
const account0PriKey = '0xb3f597447ec2c36bbbf6ac65c9bf28428b0b9423fa28a26cd7a262dd4b4e147d'
const account1PriKey = '0x03efea105c6494e60a30ce57062cb21d95e037c7500143e8df514f4477fc1b0a'
const freeArticleAddr = 'TEST_ADDR_FREETOACCESS_IN_BASE_58'
const paidArticleAddr = 'TEST_ADDR_REQSUBSCRIBE_IN_BASE_58'
let state: State
let ipfsNode
let accountService: AccountService
let contractService: ContractService
let addrs: string[] = []
let uploadTime = new Date()
let admitTxHash: string

describe('Test contract service:', () => {
    beforeAll(async () => {
        const ipfs = await import('ipfs-core')
        const file = utils.FSIO.read('./src/test/test-state.json')
        state = new State(JSON.parse(file))
        Container.set('State', state)
        ipfsNode = await ipfs.create()
        Container.set('IPFSNode', ipfsNode)
        accountService = Container.get(AccountService)
        contractService = Container.get(ContractService)
    }, 120 * 1000)

    test('login account0 and account1', async () => {
        // test adding account
        await accountService.addAccount(account0PriKey)
        await accountService.addAccount(account1PriKey)
        state.ethereumAccountList.forEach(ele => addrs.push(ele.addr))

        // check list and current account
        expect(addrs[0]).toEqual(ethers.utils.computeAddress(account0PriKey))
        expect(addrs[1]).toEqual(ethers.utils.computeAddress(account1PriKey))
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(account0PriKey))

        // test switching account
        accountService.switchAccount(addrs[1])
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(account1PriKey))
    }, 120 * 1000)

    test('account0: register as publisher', async () => {
        accountService.switchAccount(addrs[0])
        await accountService.registerPublisher('ACCOUNT 0', 0.05)
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual('ACCOUNT 0')
    })

    test('account0, account1: check publisher', () => {
        accountService.switchAccount(addrs[0])
        expect(state.isPublisher()).toBeTruthy()
        accountService.switchAccount(addrs[1])
        expect(state.isPublisher()).toBeFalsy()
    })

    test('account0: rename as publisher', async () => {
        accountService.switchAccount(addrs[0])
        await contractService.renamePublisher('AUTHOR 0')
        const result = await contractService.getPublisherName(addrs[0])
        expect(result).toEqual('AUTHOR 0')
    })

    test ('account1: fetch publisher info', async () => {
        accountService.switchAccount(addrs[1])
        const subscribingPrice = await contractService.getSubscribingPrice(addrs[0])
        const publisherPubKey = await contractService.getPublisherPubKey(addrs[0])
        expect(subscribingPrice).toBeCloseTo(0.05, 4)
        accountService.switchAccount(addrs[0])
        expect(publisherPubKey).toEqual(state.asymmeticKey!.pub)
    })

    test('account0: upload a free article', async () => {
        accountService.switchAccount(addrs[0])
        const tx = await contractService.uploadArticle(freeArticleAddr, 'free to read!', false)
        uploadTime = await contractService.getTransactionTime(tx)
    })

    test('account1: fetch info of free article', async () => {
        accountService.switchAccount(addrs[1])
        const info = await contractService.getArticleInfo(freeArticleAddr)
        expect(info.authorAddr).toEqual(addrs[0])
        expect(info.title).toEqual('free to read!')
        expect(info.author).toEqual('AUTHOR 0')
        expect(info.reqSubscribing).toBeFalsy()
        expect(info.date.getTime()).toEqual(uploadTime.getTime())
    })

    test('account1: access free article', async () => {
        accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(freeArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toBeNull()
    })

    test('account0: remove free article', async () => {
        accountService.switchAccount(addrs[0])
        await contractService.removeArticle(freeArticleAddr)

        // removing successed if no one can visit free article
        accountService.switchAccount(addrs[1])
        await expect(contractService.getArticleInfo(freeArticleAddr))
            .rejects.toThrow()
        await expect(contractService.accessArticle(freeArticleAddr))
            .rejects.toThrow()
    })

    test('account0: upload paid article', async () => {
        accountService.switchAccount(addrs[0])
        await contractService.uploadArticle(paidArticleAddr, 'need subscribing!', true)
    })

    test('account1: cannot access paid article', async () => {
        accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeFalsy()
        expect(permission.encKey).toBeNull()
    })

    test('account1: subscribe account0', async () => {
        // clear message of account0
        accountService.switchAccount(addrs[0])
        await contractService.clearMessage()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()

        // test subscribing
        accountService.switchAccount(addrs[1])
        await contractService.subscribe(addrs[0], 1)

        // submitting successed if there's any message in account0
        accountService.switchAccount(addrs[0])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
    })

    test('account0: receive request message', async () => {
        // test checking message
        accountService.switchAccount(addrs[0])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()

        // test fetching message
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(addrs[1])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_REQ)
        accountService.switchAccount(addrs[1])
        expect(msgs[0].content).toEqual(state.asymmeticKey!.pub)

        // test clearing message
        accountService.switchAccount(addrs[0])
        await contractService.clearMessage()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()
    })

    test('account0: admit subscribing', async () => {
        accountService.switchAccount(addrs[0])
        admitTxHash = await contractService.admitSubscribing(addrs[1], 'TESTENCKEY0_1')

        // submitting successed if there's any message in account1
        accountService.switchAccount(addrs[1])
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(addrs[0])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_RES)
        expect(msgs[0].content).toEqual('OK')
    })

    test('account1: check subscribing time to account0', async () => {
        accountService.switchAccount(addrs[1])
        const timeTo = await contractService.getSubscribingTime(addrs[0])
        const timeFrom = await contractService.getTransactionTime(admitTxHash)
        expect(timeTo.getTime()).toEqual(timeFrom.getTime() + 31 * 86400)
    })

    test('account1: be able to access paid article', async () => {
        accountService.switchAccount(addrs[1])
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toEqual('TESTENCKEY0_1')
    })

    afterAll(async () => {
        accountService.switchAccount(addrs[0])
        await contractService.removeArticle(paidArticleAddr)
        await ipfsNode.stop()
    }, 120 * 10000)

})