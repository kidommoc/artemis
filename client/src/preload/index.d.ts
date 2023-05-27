import { Blob } from 'node:buffer'
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
    interface Window {
        electron: ElectronAPI
        api: {
            account: {
                getAccountList: () => { accountAddress: string, name?: string }[],
                getAccountAddress: () => Promise<string>,
                getAccountPrivateKey: () => Promise<string>,
                getAccountBalance: () => Promise<number>,
                isPublisher: () => Promise<boolean>,
                getName: () => Promise<string>,
                getLastUpdated: () => Promise<Date>,
                fetchedUpdateds: () => Promise<void>,
                addAccount: (accountPrivateKey: string) => Promise<string>,
                login: (accountAddress: string) => Promise<void>,
                logout: () => Promise<void>,
                switchAccount: (accountAddress: string) => Promise<void>,
                rename: (newName: string) => Promise<void>,
                registerAsPublisher: (name: string, price: number) => Promise<void>,
                setSubscribingPrice: (price: number) => Promise<void>,
                getFollowingList: () => Promise<{ info: PublisherInfo, subscribing: SubscribingInfo }[]>,
                isFollowing: (publisherAddress: string) => Promise<boolean>,
                follow: (publisherAddress: string) => Promise<void>,
                unfollow: (publisherAddress: string) => Promise<void>,
                getSubscribingStatus: (publisherAddress: string) => Promise<SubscribingInfo>,
                subscribe: (publisherAddress: string, months: number) => Promise<void>,
                importAsymmeticKeys: (path: string) => Promise<void>,
                exportAsymmeticKeys: (path: string) => Promise<void>,
                getAccountAddress: () => Promise<string>,
                getAccountPrivateKey: () => Promise<string>,
                getAccountBalance: () => Promise<number>,
                isPublisher: () => Promise<boolean>,
                getName: () => Promise<string>,
                getLastUpdated: () => Promise<Date>,
                fetchedUpdates: (date: Date) => Promise<void>,
                addAccount: (accountPrivateKey: string) => Promise<string>,
                login: (accountAddress: string) => Promise<void>,
                logout: () => Promise<void>,
                switchAccount: (accountAddress: string) => Promise<void>,
                rename: (newName: string) => Promise<void>,
                registerAsPublisher: (name: string, price: number) => Promise<void>,
                setSubscribingPrice: (price: number) => Promise<void>,
                getFollowingList: () => Promise<{ info: PublisherInfo, subscribing: SubscribingInfo }[]>,
                isFollowing: (publisherAddress: string) => Promise<boolean>,
                follow: (publisherAddress: string) => Promise<void>,
                unfollow: (publisherAddress: string) => Promise<void>,
                getSubscribingStatus: (publisherAddress: string) => Promise<SubscribingInfo>,
                subscribe: (publisherAddress: string, months: number) => Promise<void>,
            },
            article: {
                getArticleInfo: (ipfsAddress: string) => Promise<ArticleInfo | undefined>,
                myArticles: () => Promise<{ ipfsAddress: string, title: string }[]>,
                uploadArticle: (path: string, title: string, reqSubscribing: boolean) => Promise<void>,
                removeArticle: (title: string) => Promise<void>,
                fetchArticle: (ipfsAddress: string) => Promise<Article | null | undefined>,
                getFavouriteList: () => Promise<{ ipfsAddress: string, title: string }[]>,
                isFavouriting: (ipfsAddress: string) => Promise<boolean>,
                favouriteArticle: (ipfsAddress: string) => Promise<void>,
                unfavouriteArticle: (ipfsAddress: string) => Promise<void>,
            },
            query: {
                getPublisherName: (publisherAddress: string) => Promise<string | undefined>,
                getSubscribingPrice: (publisherAddress: string) => Promise<number | undefined>,
                searchTitle: (text: string) => Promise<ArticleInfo[]>,
                searchPublisher: (text: string) => Promise<PublisherInfo[]>,
                fetchPublisher: (publisherAddress: string) => Promise<{ name: string, articles: ArticleInfo[] }>,
                fetchUpdate: () => Promise<{ from: Date, to: Date, infos: ArticleInfo[]}>,
            },
            openFile: () => Promise<string | undefined>,
        }
    }
    type SubscribingInfo = {
        status: SubscribingStatus,
        time?: Date,
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
        content: string,
        images: {
            hash: string,
            type: string,
            bytes: ArrayBuffer,
        }[],
    }
}