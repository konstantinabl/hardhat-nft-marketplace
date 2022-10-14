import { Modal, Input, useNotification } from "web3uikit"
import { useState } from "react"
import { useWeb3Contract } from "react-moralis"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import { ethers } from "ethers"
import { use } from "chai"

export default function UpdateListingModal({
    nftAddress,
    tokenId,
    isVisible,
    marketplaceAddress,
    onClose,
}) {
    const dispatch = useNotification()
    const [priceToUpdateListingWith, setPriceToUpdateListingWith] = useState(0)
    console.log(tokenId.toString())
    const handleUpdateListingSuccess = async (tx) => {
        //console.log("sth")
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "listing updated",
            title: "Listing updated - please refresh (and move blocks)",
            position: "topR",
        })
        console.log("Success")
        onClose && onClose()
        setPriceToUpdateListingWith(0)
    }
    //console.log(tokenId)
    console.log("Price", ethers.utils.parseEther(priceToUpdateListingWith.toString()))
    const { runContractFunction: updateListing } = useWeb3Contract({
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "updateListing",
        params: {
            nftAddress: nftAddress,
            tokenId: tokenId.toString(),
            newPrice: ethers.utils.parseEther(priceToUpdateListingWith.toString() || "0"),
        },
    })
    return (
        <Modal
            isVisible={isVisible}
            onCancel={onClose}
            onCloseButtonPressed={onClose}
            onOk={() => {
                updateListing({
                    onError: (error) => {
                        console.log(error)
                        console.log("hi")
                    },
                    onSuccess: () => handleUpdateListingSuccess,
                })
            }}
        >
            <Input
                label="Update listing price"
                name="New listing price"
                type="number"
                onChange={(event) => {
                    setPriceToUpdateListingWith(event.target.value)
                    //console.log(priceToUpdateListingWith)
                }}
            />
        </Modal>
    )
}
