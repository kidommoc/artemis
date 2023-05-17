export type PublisherInfo = {
    address: string,
    name: string,
}
export type ArticleInfo = {
    ipfsAddress: string,
    title: string,
    publisher: PublisherInfo,
    date: Date,
    reqSubscribing: boolean
}
export type Article = {
    info: ArticleInfo,
    content: string,
    images: {
        hash: string,
        type: string,
        bytes: ArrayBuffer,
    }[],
}