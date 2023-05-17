import { Container } from 'typedi'
import { State } from '@/State'
import { ArticleService } from '@/services/Article'
import type { Article } from '@/routes/types'
import { ContractService } from '@/services/Contract'

export interface ArticleAPI {
    myArticles(): Promise<{ ipfsAddress: string, title: string }[]>
    uploadArticle(path: string, title: string, reqSubscribing: boolean): Promise<void>
    removeArticle(title: string): Promise<void>
    fetchArticle(ipfsAddress: string): Promise<Article>
    getFavouriteList(): Promise<{ ipfsAddress: string, title: string }[]>
    isFavouriting(ipfsAddress: string): Promise<boolean>
    favouriteArticle(ipfsAddress: string): Promise<void>
    unfavouriteArticle(ipfsAddress: string): Promise<void>
}

export interface ArticleRouter {
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
    myArticles: {
        signal: 'article:MyArticles',
        function: async function (...args): Promise<{ ipfsAddress: string, title: string}[]> {
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
        function: async function (...args): Promise<Article> {
            // check
            const ipfsAddress = args[0]
            const article = Container.get(ArticleService)
            const contract = Container.get(ContractService)
            const info = await contract.getArticleInfo(ipfsAddress)
            const result =  await article.fetchArticle(ipfsAddress)
            return {
                info: {
                    ipfsAddress: ipfsAddress,
                    title: info.title,
                    publisher: {
                        address: info.publisherAddr,
                        name: info.publisher,
                    },
                    date: info.date,
                    reqSubscribing: info.reqSubscribing,    
                },
                content: result.content,
                images: result.images,
            }
        }
    },
    getFavouriteList: {
        signal: 'article:GetFavouriteList',
        function: async function(...args): Promise<{ ipfsAddress: string, title: string }[]> {
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
            const index = state.favouriteList.findIndex(ele => ele.cid == ipfsAddress)
            if (index === -1)
                return false
            return true
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