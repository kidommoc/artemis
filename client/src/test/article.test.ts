import 'reflect-metadata'
import { Container } from 'typedi'
import { parse as parseHtml } from 'node-html-parser'
import { dirname, extname, resolve } from 'node:path'
import md2h5 from 'md2h5'

import * as utils from '../main/utils'
import { State } from '../main/State'
import { type Article, ArticleService } from '../main/services/Article'
import { AccountService } from '../main/services/Account'
import { ContractService } from '../main/services/Contract'

const path1 = resolve('./src/test/test1.md')
const path2 = resolve('./src/test/test2.md')
const title1 = 'Test Article 1'
const title2 = 'Test Article 2'
let addrs: string[] = []
let state: State
let ipfsNode
let articleService: ArticleService
let accountService: AccountService
let contractService: ContractService
let cid: string
let filename1: string
let filename2: string
let article1: Article = { content: '', images: [] }
let article2: Article = { content: '', images: [] }

function generateArticle(path: string, title: string): [Article, string] {
    let article: Article = { content: '', images: [] }
    let filename = title.toLowerCase()
        .replace(new RegExp(/[^a-z]+/, 'g'), '-')
        .replace(/-$/, '')
    article.content = md2h5(utils.FSIO.read(path))
    let htmlRoot = parseHtml(article.content)
    let imgs = htmlRoot.getElementsByTagName('img')
    let imgSrc: string[] = []
    for (let img of imgs) {
        const src = img.attributes['src']
        const imgPath = resolve(dirname(path), src)
        const index = imgSrc.findIndex(ele => ele == imgPath)
        if (index != -1)
            img.setAttribute('src', index.toString())
        else {
            const imgType = extname(imgPath).slice(1)
            if (!['jpg', 'jpeg', 'png', 'webp'].includes(imgType))
                throw new Error(`Unsupported image type of "${imgPath}"!`)
            const rawImg = utils.FSIO.readRaw(imgPath)
            article.images.push(new Blob(
                [rawImg],
                { type: `image/${imgType}` }
            ))
            imgSrc.push(imgPath)
            img.setAttribute('src', (imgSrc.length - 1).toString())
        }
    }
    article.content = htmlRoot.toString()
    return [ article, filename ]
}

beforeAll(async () => {
    const ipfs = await import('ipfs-core')
    ipfsNode = await ipfs.create()
    Container.set('IPFSNode', ipfsNode)
    const file = utils.FSIO.read('./src/test/test-state.json')
    state = new State(JSON.parse(file))
    Container.set('State', state)

    const [ a, b ] = generateArticle(path1, title1)
    article1 = a
    filename1 = b
    const [ c, d ] = generateArticle(path2, title2)
    article2 = c
    filename2 = d
}, 120 * 1000)

describe('Test article service', () => {
    beforeAll(async () => {
        contractService = Container.get(ContractService)
        accountService = Container.get(AccountService)
        const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
        for (let i = 0; i < 3; ++i) {
            await accountService.addAccount(accounts[i])
            addrs.push(utils.computeAddr(accounts[i]))
            accountService.switchAccount(addrs[i])
            await contractService.clearMessage()
        }
        try {
            accountService.switchAccount(addrs[0])
            await accountService.registerPublisher('AUTHOR 0', 0.05)
        } catch (error) { }
        accountService.switchAccount(addrs[2])
        try {
            accountService.importAsymKeys('./src/test/testasymkeys')
        } catch (error) {
            accountService.exportAsymKeys('./src/test/testasymkeys')
        }

        articleService = Container.get(ArticleService)
    }, 120 * 1000)

    test('upload free article', async () => {
        accountService.switchAccount(addrs[0])
        cid = await articleService.uploadArticle(path1, title1, false)
    }, 120 * 1000)

    test('fetch free article', async () => {
        accountService.switchAccount(addrs[1])
        const fetched = await articleService.fetchArticle(cid, addrs[0])
        expect(fetched.content).toEqual(article1.content)
        expect(fetched.images.length).toEqual(article1.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article1.images[i])
    }, 120 * 1000)

    test('get my article list', async () => {
        accountService.switchAccount(addrs[0])
        const list = await articleService.myArticles()
        expect(list.length).toEqual(1)
        expect(list[0].cid).toEqual(cid)
        expect(list[0].title).toEqual(filename1)
    }, 120 * 1000)

    test('remove free article', async () => {
        accountService.switchAccount(addrs[0])
        await articleService.removeArticle(filename1)
        const list = await articleService.myArticles()
        expect(list.length).toEqual(0)
    }, 120 * 1000)

    test('upload paid article', async () => {
        accountService.switchAccount(addrs[0])
        cid = await articleService.uploadArticle(path2, title2, true)
    }, 120 * 1000)

    test('fetch paid article by author', async () => {
        accountService.switchAccount(addrs[0])
        const fetched = await articleService.fetchArticle(cid, addrs[0])
        expect(fetched.content).toEqual(article2.content)
        expect(fetched.images.length).toEqual(article2.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article2.images[i])
    }, 120 * 1000)

    test('cannot fetch paid article by unsubscribing reader', async () => {
        accountService.switchAccount(addrs[1])
        await expect(articleService.fetchArticle(cid, addrs[0]))
            .rejects.toThrow()
    }, 120 * 1000)

    test('fetch paid article by subscribing reader', async () => {
        accountService.switchAccount(addrs[2])
        const subsTime = await contractService.getSubscribingTime(addrs[0])
        if (subsTime == undefined) {
            await accountService.subscribe(addrs[0], 1)
            await new Promise(resolve => setTimeout(resolve, 10 * 1000))
            accountService.switchAccount(addrs[0])
            await accountService.handleMessage()
            accountService.switchAccount(addrs[2])
            await accountService.handleMessage()
        }
        const fetched = await articleService.fetchArticle(cid, addrs[0])
        expect(fetched.content).toEqual(article2.content)
        expect(fetched.images.length).toEqual(article2.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article2.images[i])
    }, 120 * 1000)

    afterAll(async () => {
        accountService.switchAccount(addrs[0])
        await articleService.removeArticle(filename2)

        let list: any[] = []
        for await (const file of ipfsNode.files.ls('/'))
            list.push(file.name)
        for (const filename of list)
            await ipfsNode.files.rm(`/${filename}`, { recursive: true })

        list = []
        for await (const { cid } of ipfsNode.pin.ls('/'))
            list.push(cid)
        for (const cid of list)
            try {
            await ipfsNode.pin.rm(cid)
            } catch (error) { }
    }, 120 * 1000)
})

afterAll(async () => {
    accountService.stopMessageHandling()
    await ipfsNode.stop()
})