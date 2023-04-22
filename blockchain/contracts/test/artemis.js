const Artemis = artifacts.require('Artemis')
const ArtemisMessage = artifacts.require('ArtemisMessage')
const freeArticleCode = 'TESTADDRFREETOACCESS'
const paidArticleCode = 'TESTADDRREQSUBSCRIBE'

function toAddr(str) {
    let result = '0x'
    for (let i = 0; i < str.length; ++i) {
        result += str.charCodeAt(i).toString(16)
    }
    return result
}

contract('Artemis and ArtemisMessage', async (accounts) => {
    it('should register accounts[0] as a publisher', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const balance0 = await web3.eth.getBalance(accounts[0])
        const balance1 = await web3.eth.getBalance(accounts[1])
        console.log(`balance of account0 is: ${web3.utils.fromWei(balance0, 'ether')}, account1 is: ${web3.utils.fromWei(balance1, 'ether')}`)
        try {
            await instA.registerPublisher('TESTPUBKEY0', 0, { from: account0 })
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should pubKey of accounts[0] is "TESTPUBKEY0"', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        const result = await instA.getPublisherPubKey.call(account0, { from: account1 })
        assert.equal(result, 'TESTPUBKEY0', 'publisher\'s public key error')
    })

    it('should upload a free test article by accounts[0]', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        try {
            await instA.uploadArticle(toAddr(freeArticleCode), 'free to read!', 'me', false, { from: account0 })
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should get info of the free article by accounts[1]', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        const result = await instA.getArticleInfo.call(toAddr(freeArticleCode), { from: account1 })
        assert.equal(result.authorAddr, account0, 'author address error')
        assert.equal(result.title, 'free to read!', 'title error ')
        assert.equal(result.author, 'me', 'author name error')
        assert.equal(result.requireSubscribing, false, 'subscribing requirement error')
    })

    it('should access the free article by accounts[1]', async () => {
        const instA = await Artemis.deployed()
        const account1 = accounts[1]
        const result = await instA.accessArticle.call(toAddr(freeArticleCode), { from: account1 })
        assert.equal(result.permission, true, 'permission error')
        assert.equal(result.encKey, '', 'encrypt key error')
    })

    it('should remove the free article by accounts[0]', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        try {
            await instA.removeArticle(toAddr(freeArticleCode), { from: account0 })
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should set the subscribing price of account0', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        try {
            await instA.setSubscribingPrice(web3.utils.toWei('0.2', 'ether'), { from: account0 })
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should get the subscribing price of account0', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const result = await instA.getSubscribingPrice.call(account0)
        assert.equal(result, web3.utils.toWei('0.2', 'ether'), 'subscribing price error')
    })

    it('should upload a subscribing-required article by account0', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        try {
            await instA.uploadArticle(toAddr(paidArticleCode), 'need subscribing!', 'me', true, { from: account0 })
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should not access the paid article by account1', async () => {
        const instA = await Artemis.deployed()
        const account1 = accounts[1]
        const result = await instA.accessArticle.call(toAddr(paidArticleCode), { from: account1 })
        assert.equal(result.permission, false, 'permission error')
        assert.equal(result.encKey, '', 'encrypt key error')
    })

    it('should subscribe account0 by account1', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        try {
            let balance1 = await web3.eth.getBalance(account1)
            console.log(`before subscribing, balance of account1 is: ${web3.utils.fromWei(balance1, 'ether')}`)
            await instA.subscribe(account0, 1, 'TESTPUBKEY1', { from: account1, value: web3.utils.toWei('0.2', 'ether') })
            balance1 = await web3.eth.getBalance(account1)
            console.log(`after subscribing, balance of account1 is: ${web3.utils.fromWei(balance1, 'ether')}`)
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should fetch message by account0', async () => {
        const instM = await ArtemisMessage.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        const checkResult = await instM.hasMessage.call({ from: account0 })
        assert.equal(checkResult, true, 'check message error')
        const fetchResult = await instM.fetchMessage.call({ from: account0 })
        assert.equal(fetchResult.msgSenders[0], account1, 'msg sender error')
        assert.equal(fetchResult.msgCodes[0], 1, 'msg type error')
        assert.equal(fetchResult.msgContents[0], 'TESTPUBKEY1', 'msg content error')
        try {
            await instM.clearMessage({ from: account0 })
        } catch (error) {
            assert.equal(0, -1, `clear message error. ERRMSG:\n${error}`)
        }
    })

    it('should admit the subscribing from account1 by account0', async () => {
        const instA = await Artemis.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        try {
            let balance0 = await web3.eth.getBalance(account0)
            console.log(`before admitting, balance of account0 is: ${web3.utils.fromWei(balance0, 'ether')}`)
            await instA.admitSubscribing(account1, 'TESTENCKEY01', { from: account0 })
            balance0 = await web3.eth.getBalance(account0)
            console.log(`after admitting, balance of account0 is: ${web3.utils.fromWei(balance0, 'ether')}`)
        } catch (error) {
            assert.equal(0, -1, error)
        }
    })

    it('should fetch message by account1', async () => {
        const instA = await Artemis.deployed()
        const instM = await ArtemisMessage.deployed()
        const account0 = accounts[0]
        const account1 = accounts[1]
        const checkResult = await instM.hasMessage.call({ from: account1 })
        assert.equal(checkResult, true, 'check message error')
        const fetchResult = await instM.fetchMessage.call({ from: account1 })
        assert.equal(fetchResult.msgSenders[0], account0, 'msg sender error')
        assert.equal(fetchResult.msgCodes[0], 2, 'msg type error')
        assert.equal(fetchResult.msgContents[0], 'OK', 'msg content error')
        try {
            const clearResult = await instM.clearMessage({ from: account1 })
        } catch (error) {
            assert.equal(0, -1, `clear message error. ERRMSG:\n${error}`)
        }
        const result = await instA.getSubscribingTime.call(account0)
        const dateSubscribing = new Date(result)
        console.log(`now the subscribing time of account1 to account0 is: ${dateSubscribing.toUTCString()}`)
    })

    it('should access the paid article by account1', async () => {
        const instA = await Artemis.deployed()
        const account1 = accounts[1]
        const result = await instA.accessArticle.call(toAddr(paidArticleCode), { from: account1 })
        assert.equal(result.permission, true, 'permission error')
        assert.equal(result.encKey, 'TESTENCKEY01', 'encrypt key error')
    })
})