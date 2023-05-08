import * as fs from 'node:fs'
import { resolve } from 'node:path'

/* simple wrapper of node:fs file io
 * used for read/write config and asymmetic keys
 */
export class FSIO {
    public static read(path: string): string {
        return fs.readFileSync(resolve(path), 'utf-8')
    }

    public static readRaw(path: string): Buffer {
        return fs.readFileSync(resolve(path))
    }

    public static write(path: string, content: string | Buffer) {
        fs.writeFileSync(resolve(path), content, { encoding: 'utf-8' })
    }
}