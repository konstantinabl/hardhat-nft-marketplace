const { verify } = require("../utils/verify")
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function deploy({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()
    const { deploy, log } = deployments

    arg = []
    log("----------")
    log("Deploying")
    const nftMarketplace = await deploy("NftMarketplace", {
        from: deployer,
        arguments: arg,
        log: true,
        waitConfirmations: network.config.waitConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(nftMarketplace.address, args)
    }
}

module.exports.tags = ["all", "nftMarketplace"]
