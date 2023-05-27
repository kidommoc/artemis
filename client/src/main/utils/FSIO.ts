import * as fs from 'node:fs'
import { resolve } from 'node:path'

/* simple wrapper of node:fs file io
 * used for read/write config and asymmetic keys
 */
export class FSIO {
    public static read(path: string): string {
        const fullpath = resolve(path)
        console.log(`read from ${fullpath}`)
        return fs.readFileSync(fullpath, 'utf-8')
    }

    public static readRaw(path: string): Buffer {
        const fullpath = resolve(path)
        console.log(`read from ${fullpath}`)
        return fs.readFileSync(fullpath)
    }

    public static write(path: string, content: string | Buffer) {
        const fullpath = resolve(path)
        console.log(`write to ${fullpath}`)
        fs.writeFileSync(fullpath, content, { encoding: 'utf-8' })
    }
}