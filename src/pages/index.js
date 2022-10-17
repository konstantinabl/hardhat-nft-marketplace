import { useWeb3Contract } from "react-moralis"
import { contractAddresses } from "../constants"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { useMoralis } from "react-moralis"
import { useEffect, useState } from "react"
import NFTBox from "../components/NFTBox"
export default function Home() {
    //How do we show recently listed?
    //we will index the events off chain and then read from our database
    //setup a server to listen for those events to be fired and we will add them to a database
    // moralis indexes events in a centralized database

    const { chainId: chainIdHex, isWeb3Enabled, web3 } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const [fetchedItems, setFetchedItems] = useState([])
    const nftMarketplaceAddress =
        chainId in contractAddresses ? contractAddresses[chainId]["NftMarketplace"][0] : null

    const {
        data,
        error,
        runContractFunction: fetchListedItems,
        isFetching: fetchingListedItems,
    } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: nftMarketplaceAddress,
        functionName: "fetchListedItems",
        params: {},
    })

    async function updateUI() {
        const fetchedItemsFromCall = await fetchListedItems()
        setFetchedItems(fetchedItemsFromCall)
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    return (
        <div className="container mx-auto">
            <div className="flex flex-wrap">
                {isWeb3Enabled ? (
                    fetchingListedItems ? (
                        ((<div>Loading....</div>), console.log("Loading"))
                    ) : (
                        fetchedItems.map((nft) => {
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
                    <div>Web3 currently not enabled! Please connect your waller</div>
                )}
            </div>
        </div>
    )
}
