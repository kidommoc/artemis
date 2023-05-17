import { Blob } from 'node:buffer'
import { ElectronAPI } from '@electron-toolkit/preload'
import {
    AccountAPI,
    ArticleAPI,
    QueryAPI
} from '@/main/routes'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            account: AccountAPI,
            article: ArticleAPI,
            query: QueryAPI,
            openFile: () => Promise<string | undefined>,
        }
    }
    type PublisherInfo = {
        address: string,
        name: string,
    }
    type ArticleInfo = {
        ipfsAddress: string,
        title: string,
        publisher: PublisherInfo,
        date: Date,
        reqSubscribing: boolean
    }
    type Article = {
        info: ArticleInfo,
        content: string,
        images: {
            hash: string,
            type: string,
            bytes: ArrayBuffer,
        }[],
    }
}