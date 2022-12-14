import { useEffect, useState } from "react"
import { useWeb3Contract } from "react-moralis"
import nftAbi from "../constants/BasicNft.json"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { useMoralis } from "react-moralis"
import Image from "next/image"
import { Card, useNotification } from "web3uikit"
import { ethers } from "ethers"
import UpdateListingModal from "./UpdateListingModal"

const truncateStr = (fullStr, strLen) => {
    if (fullStr.length <= strLen) return fullStr

    const separator = "..."
    const seperatorLength = separator.length
    const charsToShow = strLen - seperatorLength
    const frontChars = Math.ceil(charsToShow / 2)
    const backChars = Math.floor(charsToShow / 2)
    return (
        fullStr.substring(0, frontChars) + separator + fullStr.substring(fullStr.length - backChars)
    )
}

export default function NFTBox({ price, nftAddress, tokenId, marketplaceAddress, seller }) {
    const [imageURI, setImageURI] = useState("")
    const [tokenName, setTokenName] = useState("")
    const [tokenDescription, setTokenDescription] = useState("")
    const [showModal, setShowModal] = useState(false)
    const hideModal = () => {
        setShowModal(false)
    }
    const { isWeb3Enabled, account } = useMoralis()
    const dispatch = useNotification()

    const { runContractFunction: getTokenURI } = useWeb3Contract({
        abi: nftAbi,
        contractAddress: nftAddress,
        functionName: "tokenURI",
        params: { tokenId: tokenId },
    })

    const { runContractFunction: buyItem } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "buyItem",
        msgValue: price,
        params: { nftAddress: nftAddress, tokenId: tokenId },
    })
    const handleBuyItemSuccess = () => {
        dispatch({
            type: "success",
            message: "Item bought",
            title: "Item bought",
            position: "topR",
        })
    }
    async function updateUI() {
        const tokenURI = await getTokenURI()
        console.log(`The token URI is ${tokenURI}`)
        if (tokenURI) {
            // ipfs gateway: a server that will return ipfs files from a normal url
            const requestURL = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            const tokenURIResponse = await (await fetch(requestURL)).json()
            const imageURI = tokenURIResponse.image
            const imageURIURL = imageURI.replace("ipfs://", "https://ipfs.io/ipfs/")
            setImageURI(imageURIURL)
            setTokenName(tokenURIResponse.name)
            setTokenDescription(tokenURIResponse.description)
            // for testnets and main nets useNFTBalance
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    // To fix:
    const isOwnedByUser = seller.toLowerCase() == account.toLowerCase() || seller === undefined
    const formattedSellerAddress = isOwnedByUser ? "you" : truncateStr(seller || "", 15)

    const handleCardClick = () => {
        isOwnedByUser
            ? setShowModal(true)
            : buyItem({
                  onError: (error) => {
                      console.log(error)
                  },
                  onSuccess: () => handleBuyItemSuccess,
              })
    }

    return (
        <div>
            <div>
                {imageURI ? (
                    <div className="pt-2">
                        <UpdateListingModal
                            isVisible={showModal}
                            nftAddress={nftAddress}
                            tokenId={tokenId}
                            marketplaceAddress={marketplaceAddress}
                            onClose={hideModal}
                        ></UpdateListingModal>
                        <Card
                            title={tokenName}
                            description={tokenDescription}
                            onClick={handleCardClick}
                        >
                            <div className="p-2">
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-rose-dust">#{tokenId.toString()}</div>
                                    <div className="italic text-sm text-rose-dust">
                                        Owned by {formattedSellerAddress}
                                    </div>
                                    <Image
                                        loader={() => imageURI}
                                        src={imageURI}
                                        height="200"
                                        width="200"
                                    />
                                    <div className="font-bold text-rose-dust">
                                        {ethers.utils.formatUnits(price, "ether")} ETH
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div>Loading</div>
                )}
            </div>
        </div>
    )
}
