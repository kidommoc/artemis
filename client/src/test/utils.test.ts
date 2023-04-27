import * as fs from 'node:fs'
import * as utils from '../main/utils'

const accountKey = '0x4e49300b828d8adcf7a10c26c773d72928c93a7e91d2c7cf3bcae126bf91f966'
const data = 'Hello, world!'
const ipfsAddr = 'TESTIPFSADDROFDATA'
let asymKey: { publicKey: string, privateKey: string }

describe('Test crypto util:', () => {
    beforeAll(() => {
        asymKey = utils.Crypto.generateAsymKey()
    })

    test('symmetic encryption and decryption', () => {
        const encryptResult = utils.Crypto.symEncrypt(
            Buffer.from(data, 'utf-8'),
            ipfsAddr, accountKey
        )
        const decryptResult = utils.Crypto.symDecrypt(
            encryptResult.encrypted,
            ipfsAddr, encryptResult.encKey
        )
        expect(decryptResult).toEqual(Buffer.from(data, 'utf-8'))
    })

    test('asymmetic encryption and decryption', () => {
        const encryptedResult = utils.Crypto.asymEncrypt(data, asymKey.publicKey)
        const decryptResult = utils.Crypto.asymDecrypt(encryptedResult, asymKey.privateKey)
        expect(decryptResult).toEqual(data)
    })

    test('data signing and verification', () => {
        const signature = utils.Crypto.asymSign(
            Buffer.from(data, 'utf-8'),
            asymKey.privateKey
        )
        expect(utils.Crypto.asymVerify(
            Buffer.from(data, 'utf-8'),
            signature, asymKey.publicKey)
        ).toBeTruthy()
    })
})

describe('Test compression util:', () => {
    test('compression and decompression', () => {
        const compressed = utils.Compression.compress(Buffer.from(data, 'utf-8'))
        const decompressed = utils.Compression.decompress(compressed)
        expect(decompressed.toString('utf-8')).toEqual(data)
    })
})

describe('Test filesystem io', () => {
    test('read and write', () => {
        utils.FSIO.write('testfile', data)
        const result = utils.FSIO.read('testfile')
        expect(result).toEqual(data)
    })

    afterAll(() => {
        fs.rmSync('testfile')
    })
})