import { store } from '@graphprotocol/graph-ts'
import { UploadArticleEvent, RemoveArticleEvent } from './generated/Artemis/Artemis'
import { ArtemisArticle } from './generated/schema'

export function handleUploadArticle(event: UploadArticleEvent): void {
    let article = new ArtemisArticle(event.params.fileAddr)
    article.title = event.params.title
    article.author = event.params.author
    article.authorAddr = event.params.authorAddr
    article.reqSubscribing = event.params.reqSubscribing
    article.date = event.params.date
    article.save()
}

export function handleRemoveArticle(event: RemoveArticleEvent): void {
    let id = event.params.fileAddr
    store.remove('ArtemisArticle', id)
}