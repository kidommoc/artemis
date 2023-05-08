export const SEARCH_TITLE = `
query SearchTitle($text: String!) {
    titleSearch(text: $text) {
        id,
        title,
        author {
            id,
            name
        },
        date,
        reqSubscribing
    }
}`

export const SEARCH_AUTHOR = `
query SearchAuthor($text: String!) {
    authorSearch(text: $text) {
        id,
        name
    }
}`

export const FETCH_AUTHOR = `
query FetchAuthor($id: Bytes!) {
    artemisArticles(orderBy: date, orderDirection: desc,
        where: { author_: { id: $id }}
    ) {
        id,
        title,
        author {
            id, name
        },
        date,
        reqSubscribing
    }
}`

export const FETCH_UPDATE = (authors): string => `
query FetchToday($start: BigInt!, $end: BigInt!) {
    artemisArticles(orderBy: date, orderDirection: desc,
        where: { and: [
            { date_gte: $start },
            { date_lte: $end },
            { or: ${authors} }
        ]}
    ) {
        id,
        title,
        author {
            id, name
        },
        date,
        reqSubscribing
    }
}`