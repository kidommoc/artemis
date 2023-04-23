import * as crypto from 'node:crypto'

export class CryptoUtils {
    public static generateAsymKey(phrase: string):
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
                    cipher: 'aes-256-cbc',
                    passphrase: phrase
                }
            }
        )
        let pub = '', pri = ''
        let keySplices = keyPair.publicKey.split('\n')
        for (let i = 1; i < keySplices.length - 2; ++i)
            pub += keySplices[i]
        keySplices = keyPair.privateKey.split('\n')
        for (let i = 1; i < keySplices.length - 2; ++i)
            pri += keySplices[i]
        return { publicKey: pub, privateKey: pri }
    }
}