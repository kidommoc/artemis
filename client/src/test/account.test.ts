import 'reflect-metadata'
import { Container } from 'typedi'
import { utils as ethersUtils } from 'ethers'
const ipfs = await import('ipfs-core')
import * as utils from '../main/utils'
import { State } from '../main/State'
import { AccountService } from '../main/services/Account'

const account0PriKey = '0x4e49300b828d8adcf7a10c26c773d72928c93a7e91d2c7cf3bcae126bf91f966'
const account1PriKey = '0x35085f8159f66c0af08e6591622783a0585e94610f02f682f22d0c2bb614d53b'
var state: State
var ipfsNode
var accountService: AccountService
var addrs: string[]

describe('Test account service', () => {
    beforeAll(async () => {
        const file = utils.FSIO.read('./src/test/test-state.json')
        state = new State(JSON.parse(file))
        Container.set('State', state)
        ipfsNode = await ipfs.create()
        Container.set('IPFSNode', ipfsNode)
        accountService = Container.get(AccountService)
    })

    afterAll(async () => {
        let list: string[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.files.rm(`/${list[i]}`, { recursive: true })
        await ipfsNode.stop()
    }, 120 * 1000)

    test('add account0 and account1', async () => {
        expect(state.ethereumAddr).not.toBeDefined()
        const addr0 = ethersUtils.computeAddress(account0PriKey)
        const addr1 = ethersUtils.computeAddress(account1PriKey)
        await accountService.addAccount(account0PriKey)
        expect(state.ethereumAddr).toEqual(addr0)
        await accountService.addAccount(account1PriKey)

        addrs = state.ethereumAccountList
        expect(addrs[0]).toEqual(addr0)
        expect(addrs[1]).toEqual(addr1)
    }, 120 * 1000) // 2mins timeout

    test('switch from addr1 to addr0', async () => {
        await accountService.switchAccount(addrs[0])
        expect(state.ethereumAddr).toEqual(addrs[0])
    })

    test('logout', async () => {
        await accountService.logout()
        expect(state.ethereumAddr).not.toBeDefined()
    })

    test('login account1', async () => {
        await accountService.login(addrs[1])
        expect(state.ethereumAddr).toEqual(addrs[1])
    })
})