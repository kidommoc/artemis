import { Container } from 'typedi'
import { type Article, ArticleService } from '@/main/services/Article'

export interface ArticleAPI {
    myArticles(): Promise<{ title: string, cid: string }[]>,
    uploadArticle(path: string): Promise<void>,
    removeArticle(title: string): Promise<void>,
    fetchArticle(ipfsAddr: string): Promise<Article>,
    getFavouriteList(): { cid: string, title: string },
    favouriteArticle(ipfsAddr: string, title: string): Promise<void>,
    unfavouriteArticle(ipfsAddr: string): Promise<void>,
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
        function: async function (args: any[]): Promise<{ cid: string, title: string}[]> {
            args.length
            const service = Container.get(ArticleService)
            return await service.myArticles()
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
            const ipfsAddr = args[0]
            const publAddr = args[1]
            const service = Container.get(ArticleService)
            return await service.fetchArticle(ipfsAddr, publAddr)
        }
    },
    getFavouriteList: {
        signal: 'article:GetFavouriteList',
        function: function(args: any[]): { cid: string, title: string }[] {
            args.length
            const service = Container.get(ArticleService)
            return service.getFavouriteList()
        }
    },
    favouriteArticle: {
        signal: 'article:FavouriteArticle',
        function: async function(args: any[]) {
            // check
            const ipfsAddr = args[0]
            const title = args[1]
            const service = Container.get(ArticleService)
            await service.favouriteArticle(ipfsAddr, title)
        }
    },
    unfavouriteArticle: {
        signal: 'article:UnfavouriteArticle',
        function: async function(args: any[]) {
            // check
            const ipfsAddr = args[0]
            const service = Container.get(ArticleService)
            await service.unfavouriteArticle(ipfsAddr)
        }
    },
}

export default articleRouter