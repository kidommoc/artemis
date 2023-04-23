import * as crypto from 'node:crypto'

export const symmeticAlgorithm = 'aes-256-gcm'

export class CryptoUtils {

    public static symEncrypt(data: Buffer, ipfsAddr: string, accountPriKey: string)
        : { encrypted: Buffer, encKey: string }
    {
        const iv = crypto.createHash('sha256')
            .update(ipfsAddr).digest('hex')
            .substring(0, 32)
        const key = crypto.createHash('sha256')
            .update(accountPriKey).digest('hex')
            .substring(0, 64)
        let cipher = crypto.createCipheriv(
            symmeticAlgorithm,
            Buffer.from(key, 'hex'),
            Buffer.from(iv, 'hex'),
        )
        return {
            encrypted: Buffer.concat([cipher.update(data), cipher.final()]),
            encKey: key + '@@' + cipher.getAuthTag().toString('hex'),
        }
    }

    public static symDecrypt(buffer: Buffer, ipfsAddr: string, encryptKey: string): Buffer {
        const meta = encryptKey.split('@@')
        const iv = crypto.createHash('sha256')
            .update(ipfsAddr).digest('hex')
            .substring(0, 32)
        let decipher = crypto.createDecipheriv(
            symmeticAlgorithm,
            Buffer.from(meta[0], 'hex'),
            Buffer.from(iv, 'hex'),
        )
        decipher.setAuthTag(Buffer.from(meta[1], 'hex'))
        return Buffer.concat([decipher.update(buffer), decipher.final()])
    }

    public static generateAsymKey():
        { publicKey: string, privateKey: string }
    {
        const keyPair = crypto.generateKeyPairSync(
            'rsa',
            {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                },
            }
        )
        return keyPair
    }

    public static asymEncrypt(msg: string, publicKey: string): string {
        return crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(msg, 'utf-8'),
        ).toString('base64')
    }

    public static asymDecrypt(msg: string, privateKey: string): string {
        return crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(msg, 'base64'),
        ).toString('utf-8')
    }

    public static asymSign(data: Buffer, privateKey: string): string {
        return crypto.sign(
            "sha256",
            data,
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            }
        ).toString('base64')
    }

    public static asymVerify(data: Buffer, signature: string, publicKey: string): boolean {
        return crypto.verify(
            "sha256",
            data,
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            Buffer.from(signature, 'base64')
        )
    }
}