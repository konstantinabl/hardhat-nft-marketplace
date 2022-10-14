const { ethers, network } = require("hardhat")
const frontEndContractsFile = process.env.FRONT_END_CONTRACTS_FILE_PATH
const frontEndAbiFile = process.env.FRONT_END_ABI_FILE
const fs = require("fs")

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        await updateContractAddresses()
        await updateAbi()
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    fs.writeFileSync(
        `${frontEndAbiFile}NftMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )
    fs.writeFileSync(
        `${frontEndAbiFile}BasicNft.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}
async function updateContractAddresses() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile), "utf8")
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId]["NftMarketplace"].includes(nftMarketplace.address)) {
            contractAddresses[chainId]["NftMarketplace"].push(nftMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = { NftMarketplace: [nftMarketplace.address] }
    }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

module.exports.tags = ["all", "frontend"]
