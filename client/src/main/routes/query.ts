import { Container } from 'typedi'
import { State } from '@/State'
import { QueryService } from '@/services/Query'
import { ContractService } from '@/services/Contract'
import type { PublisherInfo, ArticleInfo } from '@/routes/types'

export interface QueryAPI {
    getPublisherName(publisherAddress: string): Promise<string | undefined>
    getSubscribingPrice(publisherAddress: string): Promise<number | undefined>
    searchTitle(text: string): Promise<ArticleInfo[]>
    searchPublisher(text: string): Promise<PublisherInfo[]>
    fetchPublisher(publisherAddress: string): Promise<{ name: string, articles: ArticleInfo[] }>
    fetchUpdate(): Promise<{ from: Date, to: Date, infos: ArticleInfo[]}>
}

export interface QueryRouter {
    getPublisherName: any
    getSubscribingPrice: any
    searchTitle: any
    searchPublisher: any
    fetchPublisher: any
    fetchUpdate: any
}

const queryRouter: QueryRouter = {
    getPublisherName: {
        signal: 'query:GetPublisherName',
        function: async function(...args): Promise<string | undefined> {
            // check
            const publAddr = args[0]
            const service = Container.get(ContractService)
            try {
                return await service.getPublisherName(publAddr)
            } catch (error) {
                return undefined
            }
        }
    },
    getSubscribingPrice: {
        signal: 'query:GetSubcribingPrice',
        function: async function(...args): Promise<number | undefined> {
            // check
            const publAddr = args[0]
            const service = Container.get(ContractService)
            try {
                return await service.getSubscribingPrice(publAddr)
            } catch (error) {
                return undefined
            }
        }
    },
    searchTitle: {
        signal: 'query:SearchTitle',
        function: async function (...args): Promise<ArticleInfo[]> {
            // check
            const text = args[0]
            const service = Container.get(QueryService)
            const result = await service.searchTitle(text.split(' '))
            const list: ArticleInfo[] = []
            for (const ele of result)
                list.push({
                    ipfsAddress: ele.cid,
                    title: ele.title,
                    publisher: {
                        address: ele.publisher.addr,
                        name: ele.publisher.name,
                    },
                    date: ele.date,
                    reqSubscribing: ele.reqSubscribing,
                })
            return list
        },
    },
    searchPublisher: {
        signal: 'query:SearchPublisher',
        function: async function (...args): Promise<PublisherInfo[]> {
            // check
            const text: string = args[0]
            const service = Container.get(QueryService)
            const result = await service.searchPublisher(text.split(' '))
            const list: PublisherInfo[] = []
            for (const ele of result)
                list.push({
                    address: ele.addr,
                    name: ele.name,
                })
            return list
        },
    },
    fetchPublisher: {
        signal: 'query:FetchPublisher',
        function: async function (...args): Promise<ArticleInfo[]> {
            // check
            const publisherAddress = args[0]
            const service = Container.get(QueryService)
            const result = await service.fetchPublisher(publisherAddress)
            const list: ArticleInfo[] = []
            for (const ele of result)
                list.push({
                    ipfsAddress: ele.cid,
                    title: ele.title,
                    publisher: {
                        address: ele.publisher.addr,
                        name: ele.publisher.name,
                    },
                    date: ele.date,
                    reqSubscribing: ele.reqSubscribing,
                })
            return list
        }
    },
    fetchUpdate: {
        signal: 'query:FetchUpdate',
        function: async function (...args)
            : Promise<{ from: Date, to: Date, infos: ArticleInfo[] }>
        {
            const state: State = Container.get('State')
            const service = Container.get(QueryService)
            const from = state.lastUpdate
            const result =  await service.fetchUpdate()
            const list: ArticleInfo[] = []
            for (const ele of result)
                list.push({
                    ipfsAddress: ele.cid,
                    title: ele.title,
                    publisher: {
                        address: ele.publisher.addr,
                        name: ele.publisher.name,
                    },
                    date: ele.date,
                    reqSubscribing: ele.reqSubscribing,
                })
            const to = state.lastUpdate
            return {
                from: from, to: to,
                infos: list,
            }
        }
    },
}

export default queryRouter