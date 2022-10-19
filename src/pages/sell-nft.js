import styles from "../styles/Home.module.css"
import nftMarketplaceAbi from "../constants/NftMarketplace.json"
import nftAbi from "../constants/BasicNft.json"
import { useNotification, Form, Button } from "web3uikit"
import { useWeb3Contract, useMoralis } from "react-moralis"
import { contractAddresses } from "../constants"
import { ethers } from "ethers"
import { useEffect, useState } from "react"

export default function SellNft() {
    const { chainId: chainIdHex, account, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const nftMarketplaceAddress =
        chainId in contractAddresses ? contractAddresses[chainId]["NftMarketplace"][0] : null
    const { runContractFunction } = useWeb3Contract()
    const dispatch = useNotification()
    const [proceeds, setProceeds] = useState("0")

    async function approveAndList(data) {
        console.log("Approving")
        const nftAddress = data.data[0].inputResult
        const tokenId = data.data[1].inputResult
        const price = ethers.utils.parseUnits(data.data[2].inputResult, "ether").toString()
        const approveOptions = {
            abi: nftAbi,
            contractAddress: nftAddress,
            functionName: "approve",
            params: {
                to: nftMarketplaceAddress,
                tokenId: tokenId,
            },
        }

        await runContractFunction({
            params: approveOptions,
            onSuccess: handleApproveSuccess(nftAddress, tokenId, price),
            onError: (error) => {
                console.log(error)
            },
        })
    }

    async function handleApproveSuccess(nftAddress, tokenId, price) {
        const listOptions = {
            abi: nftMarketplaceAbi,
            contractAddress: nftMarketplaceAddress,
            functionName: "listItem",
            params: {
                nftAddress: nftAddress,
                tokenId: tokenId,
                price: price,
            },
        }
        await runContractFunction({
            params: listOptions,
            onSuccess: () => handleListSuccess(),
            onError: (error) => {
                console.log(error)
            },
        })
    }
    async function handleListSuccess() {
        dispatch({
            type: "success",
            message: "Item listed",
            title: "Item listed",
            position: "topR",
        })
    }

    const handleWithdrawSuccess = async (tx) => {
        await tx.wait(1)
        dispatch({
            type: "success",
            message: "Withdrawing proceeds",
            position: "topR",
        })
    }

    async function setupUI() {
        const returnedProceeds = await runContractFunction({
            params: {
                abi: nftMarketplaceAbi,
                contractAddress: nftMarketplaceAddress,
                functionName: "getProceeds",
                params: {
                    seller: account,
                },
            },
            onError: (error) => console.log(error),
        })
        if (returnedProceeds) {
            setProceeds(returnedProceeds.toString())
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            setupUI()
        }
    }, [proceeds, account, isWeb3Enabled, chainId])

    return (
        <div className={styles.container}>
            <Form
                buttonConfig={{
                    theme: "primary",
                }}
                data={[
                    { name: "Nft Address", type: "text", inputWidth: "50%", key: "nftAddress" },
                    {
                        name: "Token ID",
                        type: "number",
                        value: "",
                        key: "tokenId",
                    },
                    {
                        name: "Price in ETH",
                        type: "number",
                        value: "",
                        key: "price",
                    },
                ]}
                onSubmit={approveAndList}
                title="Sell your NFT!"
                id="mainForm"
            ></Form>
            <div>
                <h1 className="text-white text-xl p-2">
                    Withdraw {proceeds} proceeds from sold NFTs
                </h1>
            </div>
            <Button
                onClick={() => {
                    runContractFunction({
                        params: {
                            abi: nftMarketplaceAbi,
                            contractAddress: nftMarketplaceAddress,
                            functionName: "withdrawProceeds",
                            params: {},
                        },
                        onError: (error) => console.log(error),
                        onSuccess: handleWithdrawSuccess,
                    })
                }}
                text="Withdraw"
                type="button"
                theme="colored"
                color="yellow"
            ></Button>
        </div>
    )
}
