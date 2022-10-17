const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

!developmentChains
    ? desribe.skip
    : describe("NftMarketplace", function () {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          const token_id_2 = 1
          const tokenID_3 = 2
          beforeEach(async function () {
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
                  const index = await nftMarketplace.getIndex(TOKEN_ID)
                  const index2 = await nftMarketplace.getIndex(token_id_2)
                  assert.equal(index, 0)
                  assert.equal(index2, 1)
              })
          })

          describe("buyItem", function () {
              it("reverts if not listed", async function () {
                  await basicNft.mintNft()
                  await basicNft.approve(nftMarketplaceContract.address, tokenID_3)
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.listItem(basicNft.address, token_id_2, PRICE)
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${tokenID_3})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, tokenID_3)
                  ).to.be.revertedWith(error)
              })

              it("reverts if money sent are less than price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it("checks if internal mapping are update correctly", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert(newOwner.toString() == user.address)
                  assert(proceeds.toString() == PRICE.toString())
              })
          })

          describe("cancelListing", function () {
              it("reverts if not the owner is canceling", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace_NotOwner")
              })

              it("reverts if an attempt to delete a non-existent listing is made", async function () {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(error)
              })

              it("removes the listing from the mapping and the array", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  const listings = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  const array_listings = await nftMarketplace.fetchListedItems()
                  assert(listings.price == 0)
                  expect(array_listings).to.deep.equal([])
              })
          })

          describe("updateListing", function () {
              it("reverts if not listed", async function () {
                  const error = `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.2")
                      )
                  ).to.be.revertedWith(error)
              })

              it("reverts if request not from owner", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.2")
                      )
                  ).to.be.revertedWith("NftMarketplace_NotOwner")
              })

              it("reverts if new price is less than or equal to zero", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__CannotSetToZero")
              })

              it("updates mapping and array correctly", async function () {
                  const price = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, price)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  const array = await nftMarketplace.fetchListedItems()
                  let array_listing
                  for (let i = 0; i < array.length; i++) {
                      if (array[i].tokenId == TOKEN_ID) {
                          array_listing = array[i]
                      }
                  }
                  assert(listing.price.toString() == price)
                  assert(array_listing.price.toString() == price)
              })
          })

          describe("withdrawProceeds", function () {
              it("reverts if balance is zero", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__BalanceIsZero"
                  )
              })
              it("updates proceeds mapping correctly", async function () {
                  const PRICE_1 = ethers.utils.parseEther("0.4")
                  const PRICE_2 = ethers.utils.parseEther("1")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE_1)
                  await nftMarketplace.listItem(basicNft.address, token_id_2, PRICE_2)
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE_1 })
                  await nftMarketplace.buyItem(basicNft.address, token_id_2, { value: PRICE_2 })
                  nftMarketplace = nftMarketplaceContract.connect(deployer)
                  await nftMarketplace.withdrawProceeds()
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert(proceeds.toString() == 0)
              })
          })
      })
