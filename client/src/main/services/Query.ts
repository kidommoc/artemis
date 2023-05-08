import { Inject, Service } from 'typedi'
import * as urql from '@urql/core'

import { State } from '@/main/State'
import * as utils from '@/main/utils'
import * as QUERIES from '@/main/graphql'

export type AuthorInfo = {
    addr: string,
    name: string,
}

export type ArticleInfo = {
    cid: string,
    title: string,
    author: AuthorInfo,
    date: Date,
    reqSubscribing: boolean
}

@Service()
export class QueryService {
    private _client: urql.Client

    constructor(@Inject('State') private _state: State) {
        this._client = new urql.Client({
            url: this._state.graphqlUrl,
            exchanges: [urql.cacheExchange, urql.fetchExchange]
        })
    }

    private toAuthorInfos(data: any[]): AuthorInfo[] {
        const result: AuthorInfo[] = []
        if (!Array.isArray(data))
            return result
        for (const ele of data)
            result.push({
                addr: utils.checksumAddr(ele.id.toString()),
                name: ele.name,
            })
        return result
    }

    private toArticleInfos(data: any[]): ArticleInfo[] {
        const result: ArticleInfo[] = []
        if (!Array.isArray(data))
            return result
        for (const ele of data)
            result.push({
                cid: ele.id.toString(),
                title: ele.title,
                author: this.toAuthorInfos([ele.author])[0],
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
        return this.toArticleInfos(result.data!.titleSearch)
    }

    public async searchAuthor(keywords: string[]): Promise<AuthorInfo[]> {
        this._state.checkLogin()
        const text = keywords.join(' & ')
        const QUERY = QUERIES.SEARCH_AUTHOR
        const result = await this._client.query(QUERY, { text: text })
        return this.toAuthorInfos(result.data!.authorSearch)
    }

    public async fetchAuthor(addr: string): Promise<ArticleInfo[]> {
        this._state.checkLogin()
        const QUERY = QUERIES.FETCH_AUTHOR
        const result = await this._client.query(QUERY, { id: addr.toLowerCase() })
        return this.toArticleInfos(result.data!.artemisArticles)
    }

    public async fetchUpdate(): Promise<ArticleInfo[]> {
        const end = new Date()
        const endTime = Math.floor(end.getTime() / 1000)
        const start = this._state.lastUpdate
        const startTime = Math.floor(start.getTime() / 1000)
        const authors: any[] = []
        for (const ele of this._state.followingList)
            authors.push({ author_: { id: ele.addr.toLowerCase() }})
        const QUERY = QUERIES.FETCH_UPDATE(
            JSON.stringify(authors).replace(/"([^"]+)":/g, '$1:')
        )
        const result = await this._client.query(QUERY, { start: startTime, end: endTime })
        this._state.fetchedUpdate()
        return this.toArticleInfos(result.data!.artemisArticles)
    }
}