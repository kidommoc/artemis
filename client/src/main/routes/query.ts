import { Container } from 'typedi'
import {
    QueryService,
    type AuthorInfo,
    type ArticleInfo
} from '@/main/services/Query'

export interface QueryAPI {
    searchTitle(text: string): Promise<ArticleInfo[]>
    searchAuthor(text: string): Promise<AuthorInfo[]>
    fetchAuthor(publisherAddress: string): Promise<ArticleInfo[]>
    fetchUpdate(): Promise<ArticleInfo[]>
}

export interface QueryRouter {
    searchTitle: any
    searchAuthor: any
    fetchAuthor: any
    fetchUpdate: any
}

const queryRouter: QueryRouter = {
    searchTitle: {
        signal: 'query:SearchTitle',
        function: async function (args: any[]): Promise<ArticleInfo[]> {
            // check
            const text = args[0]
            const service = Container.get(QueryService)
            return await service.searchTitle(text.split(' '))
        },
    },
    searchAuthor: {
        signal: 'query:SearchAuthor',
        function: async function (args: any[]): Promise<AuthorInfo[]> {
            // check
            const text = args[0]
            const service = Container.get(QueryService)
            return await service.searchAuthor(text.split(' '))
        },
    },
    fetchAuthor: {
        signal: 'query:FetchAuthor',
        function: async function (args: any[]): Promise<ArticleInfo[]> {
            // check
            const publisherAddress = args[0]
            const service = Container.get(QueryService)
            return await service.fetchAuthor(publisherAddress)
        }
    },
    fetchUpdate: {
        signal: 'query:FetchUpdate',
        function: async function (args: any[]): Promise<ArticleInfo[]> {
            args.length
            const service = Container.get(QueryService)
            return await service.fetchUpdate()
        }
    },
}

export default queryRouter