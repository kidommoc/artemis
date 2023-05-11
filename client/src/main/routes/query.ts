import { Container } from 'typedi'
import { State } from '@/main/State'
import {
    QueryService,
    type AuthorInfo,
    type ArticleInfo
} from '@/main/services/Query'

export interface QueryAPI {
    searchTitle(text: string): Promise<ArticleInfo[]>
    searchAuthor(text: string): Promise<AuthorInfo[]>
    fetchAuthor(publisherAddress: string): Promise<ArticleInfo[]>
    fetchUpdate(): Promise<{ from: Date, to: Date, infos: ArticleInfo[]}>
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
        function: async function (args: any[])
            : Promise<{ from: Date, to: Date, infos: ArticleInfo[] }>
        {
            args.length
            const state: State = Container.get('State')
            const service = Container.get(QueryService)
            const from = state.lastUpdate
            const result =  await service.fetchUpdate()
            const to = state.lastUpdate
            return {
                from: from, to: to,
                infos: result,
            }
        }
    },
}

export default queryRouter