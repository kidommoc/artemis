const config = require('./test-config.json')
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
    let provider = new ethers.providers.JsonRpcProvider(config.EthereumUrl)
    let artemis = []
    // local test account
    config.Accounts.forEach(ele => {
        let signer = new ethers.Wallet(ele, provider)
        artemis.push(new ethers.Contract(config.ContractAddr, artemisAbi, signer))
    })
    await artemis[0].registerPublisher('AUTHOR 4', 'TESTPUBKEY0', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 4 register as AUTHOR 4`)
    await artemis[1].registerPublisher('AUTHOR 5', 'TESTPUBKEY1', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 5 register as AUTHOR 5`)
    await artemis[2].registerPublisher('AUTHOR 6', 'TESTPUBKEY2', ethers.utils.parseEther((Math.floor(Math.random() * 5) / 100).toString()))
    console.log(`account 6 register as AUTHOR 6`)
    for (let i = 0; i < 10; ++i) {
        let contract = Math.floor(Math.random() * 3)
        let reqSub = Boolean(Math.round(Math.random()))
        let addrCode = addrCodePrefix
        if (i < 10) addrCode += '0' + Math.floor(i)
        else addrCode += Math.floor(i % 100)
        await uploadArticle(artemis[contract], addrCode, `test title ${i}`, reqSub)
        console.log(`uploaded test article${i} by account${contract + 4} at ADDR(${addrCode}), require subscribing: ${reqSub}.`)
    }
    /* replace ? to number */
    // await removeArticle(artemis[?], addrCodePrefix + '??')
}

fn()