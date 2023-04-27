import { store } from '@graphprotocol/graph-ts'
import {
    RegisterPublisherEvent,
    RenamePublisherEvent,
    UploadArticleEvent,
    RemoveArticleEvent
} from './generated/Artemis/Artemis'
import { ArtemisArticle, ArtemisPublisher } from './generated/schema'

export function handleRegisterPublisher(event: RegisterPublisherEvent): void {
    let publisher = new ArtemisPublisher(event.params.addr)
    publisher.name = event.params.name
    publisher.save()
}

export function handleRenamePublisher(event: RenamePublisherEvent): void {
    let publisher = ArtemisPublisher.load(event.params.addr)!
    publisher.name = event.params.newName
    publisher.save()
}

export function handleUploadArticle(event: UploadArticleEvent): void {
    let article = new ArtemisArticle(event.params.fileAddr)
    article.title = event.params.title
    article.author = event.params.authorAddr
    article.reqSubscribing = event.params.reqSubscribing
    article.date = event.params.date
    article.save()
}

export function handleRemoveArticle(event: RemoveArticleEvent): void {
    let id = event.params.fileAddr
    store.remove('ArtemisArticle', id)
}