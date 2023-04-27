const { ethers } = require('ethers')
const artemisAbi = require('../abi/Artemis.json')
const addrCodePrefix = 'TESTARTICLEADDRESS'

function toAddr(str) {
    let result = '0x'
    for (let i = 0; i < str.length; ++i) {
        result += str.charCodeAt(i).toString(16)
    }
    return result
}

async function uploadArticle(artemis, addrCode, title, reqSub) {
    try {
        await (await artemis.uploadArticle(toAddr(addrCode), title, reqSub)).wait()
    } catch (error) { console.log (error) }
}

async function removeArticle(artemis, addrCode) {
    try {
        await (await artemis.removeArticle(toAddr(addrCode))).wait()
    } catch (error) { console.log(error) }
}

async function fn() {
    // local testnet url
    let provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
    // local test account
    let signer = [
        new ethers.Wallet('0x29dd746733502b3134c5dc9051dc8c7dd0338beb2501187832cfb1ae6ba951d4', provider),
        new ethers.Wallet('0xa18cab23a0a1d9288442f74df53f5da598e132708f6cef46cfe293d99f8924e9', provider),
        new ethers.Wallet('0x57a79ddc9ac5e8fd86821d06c8693600f0ef2a3cef87005fac3ea6abcabe9fa4', provider),
    ]
    // local contract addr
    let artemis = [
        new ethers.Contract('0xb3E581Fe8e6F94c23FF2272a56673219712C8197', artemisAbi, signer[0]),
        new ethers.Contract('0xb3E581Fe8e6F94c23FF2272a56673219712C8197', artemisAbi, signer[1]),
        new ethers.Contract('0xb3E581Fe8e6F94c23FF2272a56673219712C8197', artemisAbi, signer[2]),
    ]
    await artemis[0].registerPublisher('AUTHOR 7', 'TESTPUBKEY0', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 7 register as AUTHOR 7`)
    await artemis[1].registerPublisher('AUTHOR 8', 'TESTPUBKEY1', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 8 register as AUTHOR 8`)
    await artemis[2].registerPublisher('AUTHOR 9', 'TESTPUBKEY2', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 9 register as AUTHOR 9`)
    for (let i = 0; i < 20; ++i) {
        let contract = Math.floor(Math.random() * 3)
        let reqSub = Boolean(Math.round(Math.random()))
        let addrCode = addrCodePrefix
        if (i < 10) addrCode += '0' + Math.floor(i)
        else addrCode += Math.floor(i % 100)
        await uploadArticle(artemis[contract], addrCode, `test title ${i}`, reqSub)
        console.log(`uploaded test article${i} by account${contract + 7} at ADDR(${addrCode}), require subscribing: ${reqSub}.`)
    }
    /* replace ? to number */
    // await removeArticle(artemis[?], addrCodePrefix + '??')
}

fn()