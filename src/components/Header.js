import { ConnectButton } from "web3uikit"
import Link from "next/link"

export default function Header() {
    return (
        <nav className="p-5 border-b-2 flex flex-row justify-between items-center">
            <h1 className="py-4 px-4 font-bold text-3xl text-white">NFT Marketplace</h1>
            <div className="flex flex-rom items-center">
                <Link href="/">
                    <a className="font-bold text-m mr-4 p-6 text-white">Nft Marketplace</a>
                </Link>
                <Link href="/sell-nft">
                    <a className="font-bold text-m mr-4 p-6 text-white">Sell Nft</a>
                </Link>
                <Link href="/my-listed-nfts">
                    <a className=" font-bold text-m mr-4 p-6 text-white">My Listed Nfts</a>
                </Link>
                <ConnectButton moralisAuth={false}></ConnectButton>
            </div>
        </nav>
    )
}
