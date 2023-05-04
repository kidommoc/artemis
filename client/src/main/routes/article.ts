import { Container } from 'typedi'
import { type Article, ArticleService } from '@/main/services/Article'

export interface ArticleAPI {
    myArticles(): Promise<{ title: string, cid: string }[]>,
    uploadArticle(path: string): Promise<void>,
    removeArticle(title: string): Promise<void>,
    fetchArticle(ipfsAddr: string): Promise<Article>,
}

export interface ArticleRouter {
    myArticles: any,
    uploadArticle: any,
    removeArticle: any,
    fetchArticle: any,
}

const articleRouter: ArticleRouter = {
    myArticles: {
        signal: 'article:MyArticles',
        function: async function (args: any[]) {
            args.length
            let service = Container.get(ArticleService)
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
            let service = Container.get(ArticleService)
            await service.uploadArticle(path, title, reqSubscribing)
        }
    },
    removeArticle: {
        signal: 'article:RemoveArticle',
        function: async function (args: any[]) {
            // check
            const title = args[0]
            let service = Container.get(ArticleService)
            await service.removeArticle(title)
        }
    },
    fetchArticle: {
        signal: 'article:FetchArticle',
        function: async function (args: any[]) {
            // check
            const ipfsAddr = args[0]
            const publAddr = args[1]
            let service = Container.get(ArticleService)
            service.fetchArticle(ipfsAddr, publAddr)
        }
    }
}

export default articleRouter