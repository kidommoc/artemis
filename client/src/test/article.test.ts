import 'reflect-metadata'
import { Container } from 'typedi'
import { parse as parseHtml } from 'node-html-parser'
import { dirname, extname, resolve } from 'node:path'
import md2h5 from 'md2h5'

import * as utils from '../main/utils'
import { SubscribingStatus, State } from '../main/State'
import { type UploadContent, ArticleService } from '../main/services/Article'
import { AccountService } from '../main/services/Account'
import { ContractService } from '../main/services/Contract'

const path1 = resolve('./src/test/test1.md')
const path2 = resolve('./src/test/test2.md')
const title1 = 'Test Article 1'
const title2 = 'Test Article 2'
const addrs: string[] = []
let state: State
let ipfsNode
let articleService: ArticleService
let accountService: AccountService
let contractService: ContractService
let cid: string
let filename1: string
let filename2: string
let article1: UploadContent
let article2: UploadContent

function generateArticle(path: string, title: string): [UploadContent, string] {
    const article: UploadContent = { content: '', images: [] }
    const filename = title.toLowerCase()
        .replace(new RegExp(/[^a-z]+/, 'g'), '-')
        .replace(/-$/, '')
    article.content = md2h5(utils.FSIO.read(path))
    const htmlRoot = parseHtml(`<div>${article.content}</div>`)

    // extract and insert images
    const imgs = htmlRoot.getElementsByTagName('img')
    const imgMap: { path: string, hash: string }[] = []
    for (const img of imgs) {
        const src = img.attributes['src']
        const imgPath = resolve(dirname(path), src)
        const index = imgMap.findIndex(ele => ele.path == imgPath)
        if (index != -1)
            img.setAttribute('src', imgMap[index].hash)
        else {
            const imgType = extname(imgPath).slice(1)
            if (!['jpg', 'jpeg', 'png', 'webp'].includes(imgType))
                throw new Error(`Unsupported image type of "${imgPath}"!`)
            const rawImg = utils.FSIO.readRaw(imgPath)
            const hash = utils.Crypto.hash64(rawImg.toString('utf-8'))
            const index = imgMap.findIndex(ele => ele.hash == hash)
            if (index == -1) {
                article.images.push({
                    hash: hash,
                    type: `image/${imgType}`,
                    buffer: rawImg,
                })
            }
            imgMap.push({ path: imgPath, hash: hash })
            img.setAttribute('src', hash)
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
    Container.set('State', state);

    ([ article1, filename1 ] = generateArticle(path1, title1));
    ([ article2, filename2 ] = generateArticle(path2, title2))
}, 120 * 1000)

describe('Test article service', () => {
    beforeAll(async () => {
        contractService = Container.get(ContractService)
        accountService = Container.get(AccountService)
        const accounts: string[] = JSON.parse(utils.FSIO.read('./src/test/accounts.json'))
        for (let i = 0; i < 3; ++i) {
            await accountService.addAccount(accounts[i])
            addrs.push(utils.computeAddr(accounts[i]))
            await accountService.switchAccount(addrs[i])
            await contractService.clearMessage()
        }
        try {
            await accountService.switchAccount(addrs[0])
            await accountService.registerPublisher('AUTHOR 0', 0.05)
        } catch (error) { }
        await accountService.switchAccount(addrs[2])
        try {
            accountService.importAsymKeys('./src/test/testasymkeys')
        } catch (error) {
            accountService.exportAsymKeys('./src/test/testasymkeys')
        }

        articleService = Container.get(ArticleService)
    }, 120 * 1000)

    test('upload free article', async () => {
        await accountService.switchAccount(addrs[0])
        cid = await articleService.uploadArticle(path1, title1, false)
    }, 120 * 1000)

    test('get my article list', async () => {
        await accountService.switchAccount(addrs[0])
        const list = await articleService.myArticles()
        expect(list.length).toEqual(1)
        expect(list[0].cid).toEqual(cid)
        expect(list[0].title).toEqual(filename1)
    }, 120 * 1000)

    test('fetch free article', async () => {
        await accountService.switchAccount(addrs[1])
        const fetched = await articleService.fetchArticle(cid)
        expect(fetched.content).toEqual(article1.content)
        expect(fetched.images.length).toEqual(article1.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article1.images[i])
    }, 120 * 1000)

    test('favourite free article', async () => {
        await accountService.switchAccount(addrs[1])
        await articleService.favouriteArticle(cid, title1)
        const list = state.favouriteList
        expect(list.length).toEqual(1)
        expect(list[0].cid).toEqual(cid)
        expect(list[0].title).toEqual(title1)
    })

    test('unfavourite free article', async () => {
        await accountService.switchAccount(addrs[1])
        await articleService.unfavouriteArticle(cid)
        expect(state.favouriteList.length).toEqual(0)
    })

    test('remove free article', async () => {
        await accountService.switchAccount(addrs[0])
        await articleService.removeArticle(filename1)
        const list = await articleService.myArticles()
        expect(list.length).toEqual(0)
    }, 120 * 1000)

    test('upload paid article', async () => {
        await accountService.switchAccount(addrs[0])
        cid = await articleService.uploadArticle(path2, title2, true)
    }, 120 * 1000)

    test('fetch paid article by author', async () => {
        await accountService.switchAccount(addrs[0])
        const fetched = await articleService.fetchArticle(cid)
        expect(fetched.content).toEqual(article2.content)
        expect(fetched.images.length).toEqual(article2.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article2.images[i])
    }, 120 * 1000)

    test('cannot fetch paid article by unsubscribing reader', async () => {
        await accountService.switchAccount(addrs[1])
        await expect(articleService.fetchArticle(cid))
            .rejects.toThrow()
    }, 120 * 1000)

    test('fetch paid article by subscribing reader', async () => {
        await accountService.switchAccount(addrs[2])
        await accountService.updateSubscribing()
        const status = state.subscribingStatusOf(addrs[0])
        if (status.status == SubscribingStatus.NO) {
            await accountService.subscribe(addrs[0], 1)
            await new Promise(resolve => setTimeout(resolve, 10 * 1000))
            await accountService.switchAccount(addrs[0])
            await accountService.switchAccount(addrs[2])
        }
        const fetched = await articleService.fetchArticle(cid)
        expect(fetched.content).toEqual(article2.content)
        expect(fetched.images.length).toEqual(article2.images.length)
        for (let i = 0; i < fetched.images.length; ++i)
            expect(fetched.images[i]).toEqual(article2.images[i])
    }, 120 * 1000)

    afterAll(async () => {
        await accountService.switchAccount(addrs[0])
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