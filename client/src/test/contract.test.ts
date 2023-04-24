import 'reflect-metadata'
import { Container } from 'typedi'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as ethers from 'ethers'
import { State } from '../main/State'
import { ContractService, MsgCode as ContractMsgCode } from '../main/services/Contract'

var state: State
var contractService: ContractService
const account0PriKey = '0x4e49300b828d8adcf7a10c26c773d72928c93a7e91d2c7cf3bcae126bf91f966'
const account1PriKey = '0x35085f8159f66c0af08e6591622783a0585e94610f02f682f22d0c2bb614d53b'
const freeArticleAddr = 'TEST_ADDR_FREETOACCESS_IN_BASE_58=='
const paidArticleAddr = 'TEST_ADDR_REQSUBSCRIBE_IN_BASE_58=='
var accountList: string[] = []
var subscribeTxHash: string

describe('Test Contract Service:', () => {
    beforeAll(() => {
        const file = fs.readFileSync(path.resolve('./src/test/test-state.json'), 'utf-8')
        state = new State(JSON.parse(file))
        Container.set('State', state)
        contractService = Container.get(ContractService)
    })

    test('login account0 and account1', async () => {
        // test adding account
        state.addAccount(account0PriKey)
        state.addAccount(account1PriKey)
        accountList = state.ethereumAccountList
        contractService.updateService()

        // check list and current account
        expect(accountList[0]).toEqual(ethers.utils.computeAddress(account0PriKey))
        expect(accountList[1]).toEqual(ethers.utils.computeAddress(account1PriKey))
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(account0PriKey))

        // test switching account
        state.switchAccount(accountList[1])
        contractService.updateService()
        expect(state.ethereumAddr).toEqual(ethers.utils.computeAddress(account1PriKey))
    })

    test('account0: register as publisher', async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.registerPublisher(0.05)).wait()
    })

    test ('account1: fetch publisher info', async () => {
        state.switchAccount(accountList[1])
        contractService.updateService()
        const subscribingPrice = await contractService.getSubscribingPrice(accountList[0])
        const publisherPubKey = await contractService.getPublisherPubKey(accountList[0])
        expect(subscribingPrice).toBeCloseTo(0.05, 4)
        state.switchAccount(accountList[0])
        contractService.updateService()
        expect(publisherPubKey).toEqual(state.asymmeticKey!.pub)
    })

    test('account0: upload a free article', async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.uploadArticle
            (freeArticleAddr, 'free to read!', 'AUTHOR0', false)
        ).wait()
    })

    test('account1: fetch info of free article', async () => {
        state.switchAccount(accountList[1])
        contractService.updateService()
        const info = await contractService.getArticleInfo(freeArticleAddr)
        expect(info.title).toEqual('free to read!')
        expect(info.authorAddr).toEqual(accountList[0])
        expect(info.author).toEqual('AUTHOR0')
        expect(info.reqSubscribing).toBeFalsy()
    })

    test('account1: access free article', async () => {
        state.switchAccount(accountList[1])
        contractService.updateService()
        const permission = await contractService.accessArticle(freeArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toBeNull()
    })

    test('account0: remove free article', async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.removeArticle(freeArticleAddr)).wait()

        // removing successed if no one can visit free article
        state.switchAccount(accountList[1])
        contractService.updateService()
        await expect(contractService.getArticleInfo(freeArticleAddr))
            .rejects.toThrow()
        await expect(contractService.accessArticle(freeArticleAddr))
            .rejects.toThrow()
    })

    test('account0: upload paid article', async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.uploadArticle
            (paidArticleAddr, 'need subscribing!', 'AUTHOR0', true)
        ).wait()
    })

    test('account1: cannot access paid article', async () => {
        state.switchAccount(accountList[1])
        contractService.updateService()
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeFalsy()
        expect(permission.encKey).toBeNull()
    })

    test('account1: subscribe account0', async () => {
        // clear message of account0
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.clearMessage()).wait()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()

        // test subscribing
        state.switchAccount(accountList[1])
        contractService.updateService()
        let tx = await contractService.subscribe(accountList[0], 1)
        await tx.wait()
        subscribeTxHash = tx.hash

        // submitting successed if there's any message in account0
        state.switchAccount(accountList[0])
        contractService.updateService()
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
    })

    test('account0: receive request message', async () => {
        // test checking message
        state.switchAccount(accountList[0])
        contractService.updateService()
        await expect(contractService.checkMessage()).resolves.toBeTruthy()

        // test fetching message
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(accountList[1])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_REQ)
        state.switchAccount(accountList[1])
        contractService.updateService()
        expect(msgs[0].content).toEqual(state.asymmeticKey!.pub)

        // test clearing message
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.clearMessage()).wait()
        await expect(contractService.checkMessage()).resolves.toBeFalsy()
    })

    test('account0: admit subscribing', async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.admitSubscribing(accountList[1], 'TESTENCKEY0_1')).wait()

        // submitting successed if there's any message in account1
        state.switchAccount(accountList[1])
        contractService.updateService()
        await expect(contractService.checkMessage()).resolves.toBeTruthy()
        const msgs = await contractService.fetchMessage()
        expect(msgs[0].from).toEqual(accountList[0])
        expect(msgs[0].code).toEqual(ContractMsgCode.SUB_RES)
        expect(msgs[0].content).toEqual('OK')
    })

    test('account1: check subscribing time to account0', async () => {
        state.switchAccount(accountList[1])
        contractService.updateService()
        const timeTo = await contractService.getSubscribingTime(accountList[0])
        const timeFrom = await contractService.getTransactionTime(subscribeTxHash)
        expect(timeTo.valueOf()).toEqual(timeFrom.valueOf() + 31 * 86400)
    })

    test('account1: be able to access paid article', async () => {
        const permission = await contractService.accessArticle(paidArticleAddr)
        expect(permission.permission).toBeTruthy()
        expect(permission.encKey).toEqual('TESTENCKEY0_1')
    })

    afterAll(async () => {
        state.switchAccount(accountList[0])
        contractService.updateService()
        await (await contractService.removeArticle(paidArticleAddr)).wait()
    })

})