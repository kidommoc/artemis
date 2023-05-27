import {
    Client, gql,
    cacheExchange, fetchExchange,
} from '@urql/core'
import { utils } from 'ethers'

let client: Client | undefined = undefined

function createClient() {
    client = new Client({
        url: 'http://127.0.0.1:8000/subgraphs/name/kidommoc/artemis',
        exchanges: [ cacheExchange, fetchExchange ],
        requestPolicy: 'network-only', 
    })
}

function toPublisherInfos(data: any): PublisherInfo[] {
    const result: PublisherInfo[] = []
    if (!Array.isArray(data))
        return result
    for (const ele of data)
        result.push({
            address: utils.getAddress(ele.id.toString()),
            name: ele.name,
        })
    return result
}

function toArticleInfos(data: any): ArticleInfo[] {
    const result: ArticleInfo[] = []
    if (!Array.isArray(data))
        return result
    for (const ele of data)
        result.push({
            ipfsAddress: ele.id.toString(),
            title: ele.title,
            publisher: toPublisherInfos([ele.publisher])[0],
            date: new Date(Number(ele.date) * 1000),
            reqSubscribing: ele.reqSubscribing,
        })
    return result
}

export async function querySearchTitle(keywords: string)
    : Promise<ArticleInfo[]>
{
    if (!client)
        createClient()
    const text = keywords.split(' ').join(' & ')
    const result = await client?.query(gql`
            query SearchTitle($text: String!) {
                titleSearch(text: $text) {
                    id,
                    title,
                    publisher {
                        id,
                        name
                    },
                    date,
                    reqSubscribing
                }
            }
        `,
        { text: text },
    )
    if (result?.data)
        return toArticleInfos(result.data.titleSearch)
    else
        throw new Error('Fetch Error!')
}

export async function querySearchPublisher(keywords: string)
    : Promise<PublisherInfo[]>
{
    if (!client)
        createClient()
    const text = keywords.split(' ').join(' & ')
    const result = await client?.query(gql`
            query SearchPublisher($text: String!) {
                publisherSearch(text: $text) {
                    id,
                    name
                }
            }
        `,
        { text: text },
    )
    if (result?.data)
        return toPublisherInfos(result.data.publisherSearch)
    else
        throw new Error('Fetch Error!')
}

export async function queryFetchPublisher(publisherAddress: string)
    : Promise<ArticleInfo[]>
{
    if (!client)
        createClient()
    const result = await client?.query(gql`
            query FetchPublisher($id: Bytes!) {
                artemisArticles(orderBy: date, orderDirection: desc,
                    where: { publisher_: { id: $id }}
                ) {
                    id,
                    title,
                    publisher {
                        id, name
                    },
                    date,
                    reqSubscribing
                }
            }
        `,
        { id: publisherAddress },
    )
    if (result?.data)
        return toArticleInfos(result.data.artemisArticles)
    else
        throw new Error('Fetch Error!')
}

export async function queryFetchUpdates(followingList: PublisherInfo[])
    : Promise<{ from: Date, to: Date, infos: ArticleInfo[]}>
{
    const from = await window.api.account.getLastUpdated()
    const to = new Date()
    const endTime = Math.floor(to.getTime() / 1000)
    const startTime = Math.floor(from.getTime() / 1000)
    const publishers: any[] = []
    for (const ele of followingList)
        publishers.push({ publisher_: { id: ele.address.toLowerCase() }})
    const publishersStr = JSON.stringify(publishers).replace(/"([^"]+)":/g, '$1:')
    const result = await client?.query(gql`
        query FetchUpdate($start: BigInt!, $end: BigInt!) {
            artemisArticles(orderBy: date, orderDirection: desc,
                where: { and: [
                    { date_gte: $start },
                    { date_lte: $end },
                    { or: ${publishersStr} }
                ]}
            ) {
                id,
                title,
                publisher {
                    id, name
                },
                date,
                reqSubscribing
            }
        }
        `,
        { start: startTime, end: endTime },
    )
    await window.api.account.fetchedUpdates(to)
    if (result?.data)
        return {
            from, to, 
            infos: toArticleInfos(result.data.artemisArticles),
        }
    else
        throw new Error('Fetch error!')
}