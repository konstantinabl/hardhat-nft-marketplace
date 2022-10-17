import { useWeb3Contract } from "react-moralis"
import { contractAddresses } from "../constants"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import NFTBox from "../components/NFTBox"

export default function MyListedNfts() {
    const { chainId: chainIdHex, isWeb3Enabled, web3, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [fetchedUserItems, setFetchedUserItems] = useState([])
    const nftMarketplaceAddress =
        chainId in contractAddresses ? contractAddresses[chainId]["NftMarketplace"][0] : null
    const { runContractFunction: fetchListedItems, isFetching: fetchingListedItems } =
        useWeb3Contract({
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "fetchListedItems",
            params: {},
        })
    async function getListedItemsOfUser() {
        const fetchedListedItems = await fetchListedItems()
        let fetchedListedUserItems = []
        for (let i = 0; i < fetchedListedItems.length; i++) {
            if (fetchedListedItems[i].seller.toLowerCase() == account) {
                fetchedListedUserItems.push(fetchedListedItems[i])
            }
        }
        return fetchedListedUserItems
    }
    async function updateUI() {
        const fetchedUserItemsFromCall = await getListedItemsOfUser()
        setFetchedUserItems(fetchedUserItemsFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled, account])

    return (
        <div className="container mx-auto">
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingListedItems ? (
                        ((<div>Loading....</div>), console.log("Loading"))
                    ) : (
                        fetchedUserItems.map((nft) => {
                            return (
                                <div className="p-2">
                                    <NFTBox
                                        price={nft.price.toString()}
                                        nftAddress={nft.nftAddress}
                                        tokenId={nft.tokenId}
                                        marketplaceAddress={nftMarketplaceAddress}
                                        seller={nft.seller}
                                        key={`${nftMarketplaceAddress}${nft.tokenId}`}
                                    />
                                </div>
                            )
                        })
                    )
                ) : (
                    <div>Web3 currently not enabled! Please connect your wallet</div>
                )}
            </div>
        </div>
    )
}
