import { Inject, Service } from 'typedi'
import { parse as parseHtml } from 'node-html-parser'
import { dirname, extname, resolve } from 'node:path'
import md2h5 from 'md2h5'

import { State } from '@/main/State'
import { ContractService } from '@/main/services/Contract'
import { IPFSService } from '@/main/services/IPFS'
import * as utils from '@/main/utils'

export type Article = {
    title: string,
    author: string,
    authorAddress: string,
    date: Date,
    content: string,
    images: Blob[],
}

@Service()
export class ArticleService {
    constructor(
        @Inject('State') private _state: State,
        @Inject() private _contracts: ContractService,
        @Inject() private _ipfs: IPFSService
    ) {}

    public async myArticles(): Promise<{ cid: string, title: string }[]> {
        return await this._ipfs.listFiles()
    }

    public async uploadArticle(path: string, title: string, reqSubscribing: boolean)
        : Promise<string>
    {
        if (!this._state.isPublisher())
            throw new Error('Not a publisher!')
        const article: {
            content: string,
            images: {
                type: string
                buffer: Buffer,
            }[]
        } = { content: '', images: [] }
        const filename = title.toLowerCase()
            .replace(new RegExp(/[^a-z]+/, 'g'), '-')
            .replace(/-$/, '')
        article.content = md2h5(utils.FSIO.read(path))
        const htmlRoot = parseHtml(article.content)

        // extract and insert images
        const imgs = htmlRoot.getElementsByTagName('img')
        const imgSrc: string[] = []
        for (const img of imgs) {
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
                article.images.push({
                    type: `image/${imgType}`,
                    buffer: rawImg,
                })
                imgSrc.push(imgPath)
                img.setAttribute('src', (imgSrc.length - 1).toString())
            }
        }
        article.content = htmlRoot.toString()

        const toUpload = ((): Buffer => {
            const compressed = utils.Compression.compress(
                Buffer.from(JSON.stringify(article))
            )
            if (!reqSubscribing)
                return compressed
            const encrypted = utils.Crypto.symEncrypt(
                compressed,
                this._state.ethereumAddr,
                utils.Crypto.getSymEncKey(this._state.ethereumAccountPrivateKey),
            )
            return encrypted
        })()
        const cid = await this._ipfs.addFile(filename, toUpload)
        await this._contracts.uploadArticle(cid, title, reqSubscribing)
        return cid
    }

    public async removeArticle(title: string) {
        const ipfsAddr = await this._ipfs.removeFile(title)
        await this._contracts.removeArticle(ipfsAddr)
    }

    public async fetchArticle(ipfsAddr: string): Promise<Article>  {
        const permission = await this._contracts.accessArticle(ipfsAddr)
        if (!permission.permission)
            throw new Error('No access permission!')
        const info = await this._contracts.getArticleInfo(ipfsAddr)
        const fetched = await this._ipfs.retrieveFile(ipfsAddr)
        const compressed = ((): Buffer => {
            if (permission.encKey == null)
                return fetched
            const encKey = ((): string => {
                if (permission.encKey == 'ME')
                    return utils.Crypto.getSymEncKey(this._state.ethereumAccountPrivateKey)
                return utils.Crypto.asymDecrypt(
                    permission.encKey,
                    this._state.asymmeticKey.pri
                )
            })()
            return utils.Crypto.symDecrypt(fetched, info.authorAddr, encKey)
        })()
        const decompressed = JSON.parse(
            utils.Compression.decompress(compressed)
                .toString('utf-8')
        )
        
        const article: Article = {
            title: info.title,
            author: info.author,
            authorAddress: info.authorAddr,
            date: info.date,
            content: decompressed.content,
            images: []
        }
        for (const img of decompressed.images)
            article.images.push(new Blob(
                [Buffer.from(img.buffer)],
                { type: img.type }
            ))
        return article
    }

    public async favouriteArticle(ipfsAddr: string, title: string) {
        this._state.favourite(ipfsAddr, title)
        await this._ipfs.downloadFile(ipfsAddr)
    }

    public async unfavouriteArticle(ipfsAddr: string) {
        this._state.unfavourite(ipfsAddr)
        await this._ipfs.downloadFile(ipfsAddr)
    }
}