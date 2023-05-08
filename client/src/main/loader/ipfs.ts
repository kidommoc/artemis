export default async (): Promise<any> => {
    const ipfs = await import('ipfs-core')
    const node = await ipfs.create()
    const version = await node.version()
    console.log(`connected to ipfs node, version: ${version}`)
    return node
}