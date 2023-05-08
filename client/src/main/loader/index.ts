import { Container } from 'typedi'
import ipfsLoader from '@/main/loader/ipfs'

export default async () => {
    const ipfsNode = await ipfsLoader()
    Container.set('IPFSNode', ipfsNode)
}