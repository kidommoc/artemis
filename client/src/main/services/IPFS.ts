import { Inject, Service } from 'typedi'
import { State } from '@/main/State'

@Service()
export class IPFSService {
    private _dlist: { cid: string, date: Date }[] = []

    constructor(
        @Inject('State') private _state: State,
        @Inject('IPFSNode') private _node
    ) {}

    private async removePin(cid: string) {
        const CID = (await import('multiformats')).CID
        const result = this._node.pin.rm(CID.parse(cid))
        if (cid != result) {
            // throw error
        }
        const index = this._dlist.findIndex(ele => ele.cid == cid)
        if (index != -1)
            this._dlist.splice(index)
    }

    private async clearPins() {
        const expired = new Date().getTime() + 30 * 86400
        for (let i = 0; i < this._dlist.length; ++i)
            if (this._dlist[i].date.getTime() < expired) {
                await this.removePin(this._dlist[i].cid)
                this._dlist = this._dlist.splice(i)
                --i
            }
    }

    // havn't been tested!
    private async downloadFile(cid: string) {
        const CID = (await import('multiformats')).CID
        this.clearPins()
        const result = this._node.pin.add(CID.parse(cid))
        if (cid != result.toString()) {
            // throw error
        }
        this._dlist.push({ cid: cid, date: new Date() })
    }

    // ===== publisher files =====

    public async createUserDir(addr: string) {
        let deplicated = false
        for await (const file of this._node.files.ls('/'))
            if (file.name == addr)
                deplicated = true
        if (deplicated)
            return
        await this._node.files.mkdir(`/${addr}`)
    }

    public async listFiles(): Promise<{ title: string, cid: string }[]> {
        let list: { cid: string, title: string }[] = []
        for await (const file of this._node.files.ls(`/${this._state.ethereumAddr!}`)) {
            let chunks: any[] = []
            for await (const chunk of this._node.files.read(`/${this._state.ethereumAddr!}/${file.name}`))
                chunks.push(chunk)
            list.push({
                cid: Buffer.concat(chunks).toString('utf-8'),
                title: /^(.+)\.artemis/.exec(file.name)![1],
            })
        }
        return list
    }

    public async addFile(title: string, content: Buffer): Promise<string> {
        const name = `${title}.artemis` 
        const path = `/${this._state.ethereumAddr!}/${name}`
        const { cid } = await this._node.add({
            path: `/${name}`,
            content: content,
        })
        await this._node.files.write(path, cid.toString(), { create: true })
        return cid.toString()
    }

    public async removeFile(title: string) {
        const path = `/${this._state.ethereumAddr!}/${title}.artemis`
        let chunks: any[] = []
        for await (const chunk of this._node.files.read(`/${this._state.ethereumAddr!}/${title}.artemis`))
            chunks.push(chunk)
        const cid = Buffer.concat(chunks).toString('utf-8')
        await this.removePin(cid)
        await this._node.files.rm(path)
    }

    // ===== reader files =====

    public async retrieveFile(cid: string): Promise<Buffer> {
        let chunks: any[] = []
        for await (const chunk of this._node.cat(cid))
            chunks.push(chunk)
        await this.downloadFile(cid)
        return Buffer.concat(chunks)
    }
}