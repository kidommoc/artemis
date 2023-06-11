import { Container, Service } from 'typedi'
import * as urql from '@urql/core'

import { State } from '@/State'
import * as utils from '@/utils'
import * as QUERIES from '@/graphql'

type PublisherInfo = {
    addr: string,
    name: string,
}

type ArticleInfo = {
    cid: string,
    title: string,
    publisher: PublisherInfo,
    date: Date,
    reqSubscribing: boolean
}

@Service()
export class QueryService {
    private _state: State
    private _client: urql.Client

    constructor() {
        this._state = Container.get('State')
        this._client = Container.get('urqlClient')
    }

    private toPublisherInfos(data: any): PublisherInfo[] {
        const result: PublisherInfo[] = []
        if (!Array.isArray(data))
            return result
        for (const ele of data)
            result.push({
                addr: utils.checksumAddr(ele.id.toString()),
                name: ele.name,
            })
        return result
    }

    private toArticleInfos(data: any): ArticleInfo[] {
        const result: ArticleInfo[] = []
        if (!Array.isArray(data))
            return result
        for (const ele of data)
            result.push({
                cid: ele.id.toString(),
                title: ele.title,
                publisher: this.toPublisherInfos([ele.publisher])[0],
                date: new Date(Number(ele.date) * 1000),
                reqSubscribing: ele.reqSubscribing,
            })
        return result
    }

    public async searchTitle(keywords: string[]): Promise<ArticleInfo[]> {
        this._state.checkLogin()
        const text = keywords.join(' & ')
        const QUERY = QUERIES.SEARCH_TITLE
        const result = await this._client.query(QUERY, { text: text })
        return this.toArticleInfos(result.data?.titleSearch)
    }

    public async searchPublisher(keywords: string[]): Promise<PublisherInfo[]> {
        this._state.checkLogin()
        const text = keywords.join(' & ')
        const QUERY = QUERIES.SEARCH_PUBLISHER
        const result = await this._client.query(QUERY, { text: text })
        await this.fetchPublisher('0x060da7b0026cc1e522f24a1d593212b51880cd18fbcfa01db35c1c2bdcc817b1')
        return this.toPublisherInfos(result.data?.publisherSearch)
    }

    public async fetchPublisher(addr: string): Promise<ArticleInfo[]> {
        this._state.checkLogin()
        const QUERY = QUERIES.FETCH_PUBLISHER
        const result = await this._client.query(QUERY, { id: addr.toLowerCase() })
        return this.toArticleInfos(result.data?.artemisArticles)
    }

    public async fetchUpdate(s?: Date): Promise<ArticleInfo[]> {
        const end = new Date()
        const endTime = Math.floor(end.getTime() / 1000)
        const start = s ? s : this._state.lastUpdated
        const startTime = Math.floor(start.getTime() / 1000)
        const publishers: any[] = []
        for (const ele of this._state.followingList)
            publishers.push({ publisher_: { id: ele.addr.toLowerCase() }})
        const QUERY = QUERIES.FETCH_UPDATE(
            JSON.stringify(publishers).replace(/"([^"]+)":/g, '$1:')
        )
        const result = await this._client.query(QUERY, { start: startTime, end: endTime })
        this._state.fetchedUpdatesAt(end)
        return this.toArticleInfos(result.data?.artemisArticles)
    }
}