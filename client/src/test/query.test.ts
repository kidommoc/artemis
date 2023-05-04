/* !!! NOTE !!!
 * This test generate test article and upload them to blockchain,
 * with the Graph node scanning the chain and than record uploadings.
 * However, it takes arbitrary time which is hard to estimate.
 * Use the `generate-test-data.js` in `artemis/blockchain/graph`
 * to achieve it manually.
 */
import 'reflect-metadata'
import { Container } from 'typedi'

import { QueryService } from '../main/services/Query'
import * as utils from '../main/utils'
import { State } from '../main/State'
import { AccountService } from '../main/services/Account'

// local test account 7~9
let accountPriKeys: string[]
let addrs: string[]
// const addrCodePrefix = 'TESTARTICLEADDRESS'
// let cids: string[][] = [[], [], []]
let queryService : QueryService
let ipfsNode
let state : State
let accountService: AccountService

/*
function toAddr(str) {
    let result = '0x'
    for (let i = 0; i < str.length; ++i) {
        result += str.charCodeAt(i).toString(16)
    }
    return result
}
*/

async function generateArticles() {
    /*
    let log = ''
    for (let i = 0; i < 10; ++i) {
        const contractNo = Math.floor(Math.random() * 3)
        const reqSub = Boolean(Math.round(Math.random()))
        let addrCode = addrCodePrefix
        if (i < 10)
            addrCode += '0' + Math.floor(i)
        else
            addrCode += Math.floor(i % 100)
        const addr = toAddr(addrCode)
        const title = `test title ${i}`
        accountService.switchAccount(addrs[contractNo])
        await contractService.uploadArticle(addr, title, reqSub)
        cids[contractNo].push(addr)
        log += `uploaded test article${i} by account${contractNo + 4} at ADDR(${addrCode}), require subscribing: ${reqSub}.\n`
    }
    console.log(log)
    */
}

beforeAll(async () => {
    const ipfs = await import('ipfs-core')
    ipfsNode = await ipfs.create()
    Container.set('IPFSNode', ipfsNode)
    const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
    accountPriKeys = accounts.slice(7, 10)
    addrs = [
        utils.computeAddr(accountPriKeys[0]),
        utils.computeAddr(accountPriKeys[1]),
        utils.computeAddr(accountPriKeys[2]),
    ]
    const file = utils.FSIO.read('./src/test/test-state.json')
    state = new State(JSON.parse(file))
    Container.set('State', state)
}, 120 * 1000)

describe('Test query service:', () => {
    beforeAll(async () => {
        accountService = Container.get(AccountService)
        await accountService.addAccount(accountPriKeys[0])
        accountService.switchAccount(addrs[0])
        // await accountService.registerPublisher('AUTHOR 7', 0.05)
        await accountService.addAccount(accountPriKeys[1])
        accountService.switchAccount(addrs[1])
        // await accountService.registerPublisher('AUTHOR 8', 0.05)
        await accountService.addAccount(accountPriKeys[2])
        accountService.switchAccount(addrs[2])
        // await accountService.registerPublisher('AUTHOR 9', 0.05)

        await generateArticles()
        // wait graphql to form database
        // await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000))

        accountService.switchAccount(addrs[0])
        accountService.follow(addrs[1])
        accountService.follow(addrs[2])

        queryService = Container.get(QueryService)
    }, 120 * 1000)

    test('search title', async () => {
        const result = await queryService.searchTitle(['title'])
        console.log(result)
        expect(result.length).toEqual(20)
    })

    test('search author', async () => {
        const result = await queryService.searchAuthor(['AUTHOR'])
        console.log(result)
        expect(result.length).toEqual(3)
    })

    test('fetch author', async () => {
        const result = await queryService.fetchAuthor(addrs[0])
        console.log(result)
        // expect(result.length).toEqual(cids[0].length)
    })

    test('fetch today', async () => {
        accountService.switchAccount(addrs[0])
        const today = new Date(new Date().getTime() + 86400 * 1000)
        const result = await queryService.fetchToday(today)
        console.log(result)
        // expect(result.length).toEqual(cids[1].length + cids[2].length)
    })

    afterAll(async () => {
        /*
        accountService.switchAccount(addrs[0])
        for await (const cid of cids[0])
            await contractService.removeArticle(cid)
        accountService.switchAccount(addrs[1])
        for await (const cid of cids[1])
            await contractService.removeArticle(cid)
        accountService.switchAccount(addrs[2])
        for await (const cid of cids[2])
            await contractService.removeArticle(cid)
        */
    }, 120 * 1000)
})

afterAll(async () => {
    accountService.stopMessageHandling()
    await ipfsNode.stop()
}, 120 * 1000)