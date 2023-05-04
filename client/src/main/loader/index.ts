import { Container } from 'typedi'
import ipfsLoader from '@/main/loader/ipfs'

export default async () => {
    let ipfsNode = await ipfsLoader()
    Container.set('IPFSNode', ipfsNode)
}