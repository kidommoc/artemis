import { Inject, Service } from 'typedi'
import { State } from '@/main/State'

@Service()
export class IPFSService {
    private _dlist: { cid: string, title: string}[] = []

    constructor(
        @Inject('State') private _state: State,
        @Inject('IPFSNode') private _node
    ) {}

    private async removePin(cid: string) {
        const CID = (await import('multiformats')).CID
        try {
            const result = this._node.pin.rm(CID.parse(cid))
            if (cid != result) {
                // throw error
            }
            const index = this._dlist.findIndex(ele => ele.cid == cid)
            if (index != -1)
                this._dlist.splice(index)
        } catch (error) {
            // handle error
        }
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
        try {
            const { cid } = await this._node.add({
                path: `/${name}`,
                content: content,
            })
            await this._node.files.write(path, cid.toString(), { create: true })
            return cid.toString()
        } catch (error) {
            // handle error
            throw error
        }
    }

    public async removeFile(title: string) {
        const path = `/${this._state.ethereumAddr!}/${title}.artemis`
        let chunks: any[] = []
        for await (const chunk of this._node.files.read(`/${this._state.ethereumAddr!}/${title}.artemis`))
            chunks.push(chunk)
        const cid = Buffer.concat(chunks).toString('utf-8')
        this.removePin(cid)
        await this._node.files.rm(path)
    }

    // ===== reader files =====

    get downloadList(): { cid: string, title: string }[] { return this._dlist }

    public async retrieveFile(cid: string): Promise<Buffer> {
        try {
            let chunks: any[] = []
            for await (const chunk of this._node.cat(cid))
                chunks.push(chunk)
            return Buffer.concat(chunks)
        } catch (error) {
            // handle error
            throw error
        }
    }

    // havn't been tested!
    public async downloadFile(cid: string, title: string) {
        const CID = (await import('multiformats')).CID
        try {
            const result = this._node.pin.add(CID.parse(cid))
            if (cid != result.toString()) {
                // throw error
            }
            this._dlist.push({ cid: cid, title: title })
        } catch (error) {
            // handle error
        }
    }

    // havn't been tested!
    public async removeDownloaded(cid: string) {
        await this.removePin(cid)
    }
}