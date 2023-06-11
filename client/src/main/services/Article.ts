import { Container, Service } from 'typedi'
import { dirname, extname, resolve } from 'node:path'
import { parse as parseHtml } from 'node-html-parser'
import md2h5 from 'md2h5'

import { State } from '@/State'
import { ContractService } from '@/services/Contract'
import { IPFSService } from '@/services/IPFS'
import * as utils from '@/utils/index'

export type Article = {
    content: string,
    images: {
        hash: string,
        type: string,
        bytes: ArrayBuffer,
    }[],
}

export type UploadContent = {
    content: string,
    images: {
        hash: string,
        type: string,
        buffer: Buffer,
    }[]
}

@Service()
export class ArticleService {
    private _state: State
    private _contracts: ContractService
    private _ipfs: IPFSService

    constructor() {
        this._state = Container.get('State')
        this._contracts = Container.get(ContractService)
        this._ipfs = Container.get(IPFSService)
    }

    private toArrayBuffer(buffer: Buffer): ArrayBuffer {
        const arrayBuffer = new ArrayBuffer(buffer.length)
        const view = new Uint8Array(arrayBuffer)
        for (let i = 0; i < buffer.length; ++i)
            view[i] = buffer[i]
        return arrayBuffer
    }

    public async myArticles(): Promise<{ cid: string, title: string }[]> {
        return await this._ipfs.listFiles()
    }

    public async uploadArticle(path: string, title: string, reqSubscribing: boolean)
        : Promise<string>
    {
        if (!this._state.isPublisher())
            throw new Error('Not a publisher!')
        const article: UploadContent = { content: '', images: [] }
        const filename = title.toLowerCase()
            .replace(new RegExp(/[^a-z0-9]+/, 'g'), '-')
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

        const toUpload = ((): Buffer => {
            const compressed = utils.Compression.compress(
                Buffer.from(JSON.stringify(article))
            )
            if (!reqSubscribing)
                return compressed
            const encrypted = utils.Crypto.symEncrypt(
                compressed,
                title,
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
        const permission = await (async () => {
            try {
                return await this._contracts.accessArticle(ipfsAddr)
            } catch (error) {
                throw new Error('Inexist article!')
            }
        })()
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
            return utils.Crypto.symDecrypt(fetched, info.title, encKey)
        })()
        const decompressed = JSON.parse(
            utils.Compression.decompress(compressed)
                .toString('utf-8')
        ) as UploadContent
        
        const article: Article = {
            content: decompressed.content,
            images: []
        }
        for (const img of decompressed.images)
            article.images.push({
                hash: img.hash,
                type: img.type,
                bytes: this.toArrayBuffer(Buffer.from(img.buffer)),
            })
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