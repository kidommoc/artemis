import { Container } from 'typedi'
import { State } from '@/State'
import type { ArticleInfo, Article } from '@/routes/types'
import { ArticleService } from '@/services/Article'
import { ContractService } from '@/services/Contract'

export interface ArticleAPI {
    getArticleInfo(ipfsAddress: string): Promise<ArticleInfo | undefined>
    myArticles(): Promise<{ ipfsAddress: string, title: string }[]>
    uploadArticle(path: string, title: string, reqSubscribing: boolean): Promise<void>
    removeArticle(title: string): Promise<void>
    fetchArticle(ipfsAddress: string): Promise<Article | null | undefined>
    getFavouriteList(): Promise<{ ipfsAddress: string, title: string }[]>
    isFavouriting(ipfsAddress: string): Promise<boolean>
    favouriteArticle(ipfsAddress: string): Promise<void>
    unfavouriteArticle(ipfsAddress: string): Promise<void>
}

export interface ArticleRouter {
    getArticleInfo: any,
    myArticles: any,
    uploadArticle: any,
    removeArticle: any,
    fetchArticle: any,
    getFavouriteList: any,
    isFavouriting: any,
    favouriteArticle: any,
    unfavouriteArticle: any,
}

const articleRouter: ArticleRouter = {
    getArticleInfo: {
        signal: 'article:GetArticleInfo',
        function: async function(...args)
            : Promise<ArticleInfo | undefined>
        {
            // check
            const ipfsAddress = args[0]
            const service = Container.get(ContractService)
            try {
                const result = await service.getArticleInfo(ipfsAddress)
                return {
                    ipfsAddress: ipfsAddress,
                    title: result.title,
                    publisher: {
                        address: result.publisherAddr,
                        name: result.publisher,
                    },
                    date: result.date,
                    reqSubscribing: result.reqSubscribing,
                }
            } catch (error) {
                return undefined
            }
        }
    },
    myArticles: {
        signal: 'article:MyArticles',
        function: async function (...args)
            : Promise<{ ipfsAddress: string, title: string}[]>
        {
            const service = Container.get(ArticleService)
            const articles = await service.myArticles()
            const list: { ipfsAddress: string, title: string}[] = []
            for (const ele of articles)
                list.push({
                    ipfsAddress: ele.cid,
                    title: ele.title
                })
            return list
        }
    },
    uploadArticle: {
        signal: 'article:UploadArticle',
        function: async function (...args) {
            // check
            const path = args[0]
            const title = args[1]
            const reqSubscribing = args[2]
            const service = Container.get(ArticleService)
            await service.uploadArticle(path, title, reqSubscribing)
        }
    },
    removeArticle: {
        signal: 'article:RemoveArticle',
        function: async function (...args) {
            // check
            const title = args[0]
            const service = Container.get(ArticleService)
            await service.removeArticle(title)
        }
    },
    fetchArticle: {
        signal: 'article:FetchArticle',
        function: async function (...args): Promise<Article | null | undefined> {
            // check
            const ipfsAddress = args[0]
            const service = Container.get(ArticleService)
            try {
                const result = await service.fetchArticle(ipfsAddress)
                return {
                    content: result.content,
                    images: result.images,
                }
            } catch (error) {
                if ((error as Error).message == 'No access permission!')
                    return undefined
                if ((error as Error).message == 'Inexist article!')
                    return null
                throw error
            }
        }
    },
    getFavouriteList: {
        signal: 'article:GetFavouriteList',
        function: async function(...args)
            : Promise<{ ipfsAddress: string, title: string }[]>
        {
            const state: State = Container.get('State')
            const list: { ipfsAddress: string, title: string }[] = []
            for (const ele of state.favouriteList)
                list.push({
                    ipfsAddress: ele.cid,
                    title: ele.title,
                })
            return list
        }
    },
    isFavouriting: {
        signal: 'article:IsFavouriting',
        function: async function(...args): Promise<boolean> {
            // check
            const ipfsAddress = args[0]
            const state: State = Container.get('State')
            return state.isFavouriting(ipfsAddress)
        }
    },
    favouriteArticle: {
        signal: 'article:FavouriteArticle',
        function: async function(...args) {
            // check
            const ipfsAddress = args[0]
            const article = Container.get(ArticleService)
            const contract = Container.get(ContractService)
            const info = await contract.getArticleInfo(ipfsAddress)
            await article.favouriteArticle(ipfsAddress, info.title)
        }
    },
    unfavouriteArticle: {
        signal: 'article:UnfavouriteArticle',
        function: async function(...args) {
            // check
            const ipfsAddress = args[0]
            const service = Container.get(ArticleService)
            await service.unfavouriteArticle(ipfsAddress)
        }
    },
}

export default articleRouter