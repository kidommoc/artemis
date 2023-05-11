import { Container } from 'typedi'
import { State } from '@/main/State'
import { type Article, ArticleService } from '@/main/services/Article'

export interface ArticleAPI {
    myArticles(): Promise<{ ipfsAddress: string, title: string }[]>
    uploadArticle(path: string): Promise<void>
    removeArticle(title: string): Promise<void>
    fetchArticle(ipfsAddress: string): Promise<Article>
    getFavouriteList(): { ipfsAddress: string, title: string }[]
    favouriteArticle(ipfsAddress: string, title: string): Promise<void>
    unfavouriteArticle(ipfsAddress: string): Promise<void>
}

export interface ArticleRouter {
    myArticles: any,
    uploadArticle: any,
    removeArticle: any,
    fetchArticle: any,
    getFavouriteList: any,
    favouriteArticle: any,
    unfavouriteArticle: any,
}

const articleRouter: ArticleRouter = {
    myArticles: {
        signal: 'article:MyArticles',
        function: async function (args: any[]): Promise<{ ipfsAddress: string, title: string}[]> {
            args.length
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
        function: async function (args: any[]) {
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
        function: async function (args: any[]) {
            // check
            const title = args[0]
            const service = Container.get(ArticleService)
            await service.removeArticle(title)
        }
    },
    fetchArticle: {
        signal: 'article:FetchArticle',
        function: async function (args: any[]): Promise<Article> {
            // check
            const ipfsAddress = args[0]
            const service = Container.get(ArticleService)
            return await service.fetchArticle(ipfsAddress)
        }
    },
    getFavouriteList: {
        signal: 'article:GetFavouriteList',
        function: function(args: any[]): { ipfsAddress: string, title: string }[] {
            args.length
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
    favouriteArticle: {
        signal: 'article:FavouriteArticle',
        function: async function(args: any[]) {
            // check
            const ipfsAddress = args[0]
            const title = args[1]
            const service = Container.get(ArticleService)
            await service.favouriteArticle(ipfsAddress, title)
        }
    },
    unfavouriteArticle: {
        signal: 'article:UnfavouriteArticle',
        function: async function(args: any[]) {
            // check
            const ipfsAddress = args[0]
            const service = Container.get(ArticleService)
            await service.unfavouriteArticle(ipfsAddress)
        }
    },
}

export default articleRouter