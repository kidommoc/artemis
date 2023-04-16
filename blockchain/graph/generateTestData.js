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

async function uploadArticle(artemis, addrCode, title, author, reqSub) {
    try {
        await (await artemis.uploadArticle(toAddr(addrCode), title, author, reqSub)).wait()
    } catch (error) { console.log (error) }
}

async function removeArticle(artemis, addrCode) {
    try {
        await (await artemis.removeArticle(toAddr(addrCode))).wait()
    } catch (error) { console.log(error) }
}

async function fn() {
    let provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545')
    let signer = [
        new ethers.Wallet('0x48174fb0ea3f9a8fc255603eb795eb6fab56acae0a2d1b4c5e663c99001c8318', provider),
        new ethers.Wallet('0x4d3a37c12b361fd94f6baac46f77ecad11b890dbad6aca930fb96d66dd67a61a', provider),
        new ethers.Wallet('0x31b44987a7e6b323f293fa2b412f968f2ee14b68be1423c48720d4d984b573cc', provider),
    ]
    let artemis = [
        new ethers.Contract('0x8c7979807D0c705b6c3B92b2422690b4BCA89EB8', artemisAbi, signer[0]),
        new ethers.Contract('0x8c7979807D0c705b6c3B92b2422690b4BCA89EB8', artemisAbi, signer[1]),
        new ethers.Contract('0x8c7979807D0c705b6c3B92b2422690b4BCA89EB8', artemisAbi, signer[2]),
    ]
    await artemis[0].registerPublisher('TESTPUBKEY0', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    await artemis[1].registerPublisher('TESTPUBKEY1', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    await artemis[2].registerPublisher('TESTPUBKEY2', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    for (let i = 0; i < 20; ++i) {
        let contract = Math.floor(Math.random() * 3)
        let reqSub = Boolean(Math.round(Math.random()))
        let addrCode = addrCodePrefix
        if (i < 10) addrCode += '0' + Math.floor(i)
        else addrCode += Math.floor(i % 100)
        await uploadArticle(artemis[contract], addrCode, `test title ${i}`, `account${contract + 7}`, reqSub)
        console.log(`uploaded test article${i} by account${contract + 7} at ADDR(${addrCode}), require subscribing: ${reqSub}.`)
    }
    /* replace ? to number */
    // await removeArticle(artemis[?], addrCodePrefix + '??')
}

// Math.floor(10.5)

fn()