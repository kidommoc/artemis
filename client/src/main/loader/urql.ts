import * as urql from '@urql/core'

export default async (GraphQlUrl: string): Promise<urql.Client> => {
    const client = new urql.Client({
        url: GraphQlUrl,
        exchanges: [urql.cacheExchange, urql.fetchExchange],
    })
    return client
}