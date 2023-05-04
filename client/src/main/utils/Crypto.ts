import * as crypto from 'node:crypto'

export const symmeticAlgorithm = 'aes-256-cbc'

export class Crypto {
    public static getSymEncKey(accountPriKey: string): string {
        return crypto.createHash('sha256')
            .update(accountPriKey).digest('hex')
            .substring(0, 64)
    }

    public static symEncrypt(data: Buffer, publAddr: string, encryptKey: string)
        : Buffer
    {
        const iv = crypto.createHash('sha256')
            .update(publAddr).digest('hex')
            .substring(0, 32)
        let cipher = crypto.createCipheriv(
            symmeticAlgorithm,
            Buffer.from(encryptKey, 'hex'),
            Buffer.from(iv, 'hex'),
        )
        return Buffer.concat([cipher.update(data), cipher.final()])
    }

    public static symDecrypt(buffer: Buffer, publAddr: string, encryptKey: string): Buffer {
        const iv = crypto.createHash('sha256')
            .update(publAddr).digest('hex')
            .substring(0, 32)
        let decipher = crypto.createDecipheriv(
            symmeticAlgorithm,
            Buffer.from(encryptKey, 'hex'),
            Buffer.from(iv, 'hex'),
        )
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
                    type: 'pkcs1',
                    format: 'pem',
                },
            }
        )
        return keyPair
    }

    public static verifyKeyPair(pub: string, pri: string): boolean {
        const generated = crypto.createPublicKey({
            key: pri,
            type: 'pkcs1',
            format: 'pem',
        }).export({
            type: 'spki',
            format: 'pem',
        }).toString()
        return generated == pub
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