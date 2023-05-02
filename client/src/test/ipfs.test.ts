import 'reflect-metadata'
import { Container } from 'typedi'
import * as utils from '../main/utils'
import { State } from '../main/State'
import { IPFSService } from '../main/services/IPFS'

const title = 'hello-world'
const data = 'hello, world!'
let accountPriKey: string
let cid: string
let state: State
let ipfsNode
let ipfsService: IPFSService

beforeAll(async () => {
    const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
    accountPriKey = accounts[0]
    const file = utils.FSIO.read('./src/test/test-state.json')
    state = new State(JSON.parse(file))
    state.addAccount(
        utils.computeAddr(accountPriKey), accountPriKey,
        { publicKey: '', privateKey: '' },
        true, 'AUTHOR 0'
    )
    Container.set('State', state)
})

describe('Test IPFS service:', () => {
    beforeAll(async () => {
        const ipfs = await import('ipfs-core')
        ipfsNode = await ipfs.create()
        Container.set('IPFSNode', ipfsNode)

        let list: string[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.files.rm(`/${list[i]}`, { recursive: true })
        ipfsService = Container.get(IPFSService)
    }, 120 * 1000)

    afterAll(async () => {
        let list: string[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.files.rm(`/${list[i]}`, { recursive: true })
        await ipfsNode.stop()
    })

    test('create user directory', async () => {
        await ipfsService.createUserDir(state.ethereumAddr!)
    })

    test('add file', async () => {
        const content = utils.Compression.compress(Buffer.from(data, 'utf-8'))
        cid = await ipfsService.addFile(title, content)
        expect(cid).toEqual('QmaWUzh55puEWvnkgG8VkJ28EhULPT2e9QLEjbBRdtFP7B')
    })

    test('list files', async () => {
        const result = await ipfsService.listFiles()
        expect(result.length).toEqual(1)
        expect(result[0].cid).toEqual('QmaWUzh55puEWvnkgG8VkJ28EhULPT2e9QLEjbBRdtFP7B')
        expect(result[0].title).toEqual(title)
    })

    test('retrieve file', async () => {
        const content = await ipfsService.retrieveFile(cid)
        const fetchData = utils.Compression.decompress(content).toString('utf-8')
        expect(fetchData).toEqual(data)
    })

    test('remove file', async () => {
        await ipfsService.removeFile(title)
    })

    afterAll(async () => {
        const CID = (await import('multiformats')).CID
        let list: string[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.files.rm(`/${list[i]}`, { recursive: true })

        for await (const { cid } of ipfsNode.pin.ls('/'))
            list.push(cid)
        for (let i = 0; i < list.length; ++i)
            await ipfsNode.pin.rm(CID.parse(cid))
        await ipfsNode.stop()
    })
})