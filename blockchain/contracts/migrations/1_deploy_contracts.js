const Artemis = artifacts.require("Artemis")
const ArtemisMessage = artifacts.require("ArtemisMessage")

module.exports = async function(deployer) {
    await deployer.deploy(ArtemisMessage)
    const msgAddr = await ArtemisMessage.deployed()
    await deployer.deploy(Artemis, ArtemisMessage.address)
}