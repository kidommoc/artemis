export { SubscribingStatus } from '@/State'
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
    content: string,
    images: {
        hash: string,
        type: string,
        bytes: ArrayBuffer,
    }[],
}