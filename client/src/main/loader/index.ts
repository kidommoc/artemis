import { Container } from 'typedi'
import { State } from '@/State'
import ipfsLoader from '@/loader/ipfs'
import urqlLoader from '@/loader/urql'

let ipfsNode

export const load = async () => {
    const state: State = Container.get('State')
    ipfsNode = await ipfsLoader()
    Container.set('IPFSNode', ipfsNode)
    const urqlClient = await urqlLoader(state.graphqlUrl)
    Container.set('urqlClient', urqlClient)
}

export const end = async () => {
    await ipfsNode.stop()
}