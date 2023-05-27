export const SEARCH_TITLE = `
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
}`

export const SEARCH_PUBLISHER = `
query SearchPublisher($text: String!) {
    publisherSearch(text: $text) {
        id,
        name
    }
}`

export const FETCH_PUBLISHER = `
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
}`

export const FETCH_UPDATE = (publishers): string => `
query FetchUpdate($start: BigInt!, $end: BigInt!) {
    artemisArticles(orderBy: date, orderDirection: desc,
        where: { and: [
            { date_gte: $start },
            { date_lte: $end },
            { or: ${publishers} }
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
}`