const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")

!developmentChains
    ? desribe.skip
    : describe("NftMarketplace", function () {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          const token_id_2 = 1
          const tokenID_3 = 2
          beforeEach(async function () {
              //   ;({ deployer, user } = await getNamedAccounts())
              //   console.log(deployer)
              //   console.log(user)
              // try with getnamedaccount
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, token_id_2)
          })

          describe("List items", function () {
              it("reverts if the price is zero or less", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })

              it("emits an event when item is listed", async function () {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })

              it("reverts if item is already listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })

              it("reverts if someone else is listing the item", async function () {
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace_NotOwner")
              })

              it("changes listing item", async function () {})
          })

          describe("fetchListedItems", function () {
              it("gets items", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(basicNft.address, token_id_2, PRICE)
                  const fetchedItems = await nftMarketplace.fetchListedItems()
                  assert.equal(fetchedItems[0].tokenId, TOKEN_ID)
                  assert.equal(fetchedItems[1].tokenId, token_id_2)
              })
          })

          describe("getIndex", function () {
              it("gets correct index", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(basicNft.address, token_id_2, PRICE)
                  const fetchedItems = await nftMarketplace.fetchListedItems()
                  const index = await nftMarketplace.getIndex(TOKEN_ID)
                  const index2 = await nftMarketplace.getIndex(token_id_2)
                  assert.equal(index, 0)
                  assert.equal(index2, 1)
              })
          })
          //why when nft is not minted and approved token id is invalid
          describe("buyItem", function () {
              it("gets correct index", async function () {
                  await basicNft.mintNft()
                  await basicNft.approve(nftMarketplaceContract.address, tokenID_3)
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(basicNft.address, token_id_2, PRICE)
                  await nftMarketplace.listItem(basicNft.address, tokenID_3, PRICE)
                  const fetchedItems = await nftMarketplace.fetchListedItems()
                  await nftMarketplace.buyItem(basicNft.address, token_id_2, { value: PRICE })
                  const fetchedItems2 = await nftMarketplace.fetchListedItems()
                  console.log(fetchedItems)
                  console.log(fetchedItems2)
              })
          })
      })
