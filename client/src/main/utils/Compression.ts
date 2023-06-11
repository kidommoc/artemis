import * as zlib from 'node:zlib'

export class Compression {
    public static compress(buffer: Buffer): Buffer {
        return zlib.gzipSync(buffer)
    }

    public static decompress(buffer: Buffer): Buffer {
        return zlib.gunzipSync(buffer)
    }
}