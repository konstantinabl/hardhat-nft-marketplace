# NFT Marketplace

## Technology Stack & Tools

- Solidity (Writing Smart Contract)
- Javascript
- [NextJs](https://nextjs.org/)
- [Ethers](https://docs.ethers.io/v5/) (Blockchain Interaction)
- [Hardhat](https://hardhat.org/) (Development Framework)
- [Ipfs](https://ipfs.io/) (Metadata storage)
- Moralis (web3UIKit and Blockchain Interactions)

## Requirements For Initial Setup
- Install [NodeJS](https://nodejs.org/en/), should work with any node version below 16.5.0
- Install [Hardhat](https://hardhat.org/)

## Setting Up
### 1. Clone/Download the Repository
``` 
git clone https://github.com/konstantinabl/hardhat-nft-marketplace.git
```
Create your .env file
### 2. Install Dependencies for backend and start node
```
$ cd hardhat-nft-marketplace
$ yarn
$ yarn hardhat node
```
### 3. Install Dependencies for backend and start frontend
```
$ cd src
$ yarn
$ yarn run dev
```

### 4. Connect development blockchain accounts to Metamask
- Copy private key of the addresses and import to Metamask
- Connect your metamask to hardhat blockchain, network 127.0.0.1:8545.
- If you have not added hardhat to the list of networks on your metamask, open up a browser, click the fox icon, then click the top center dropdown button that lists all the available networks then click add networks. A form should pop up. For the "Network Name" field enter "Hardhat". For the "New RPC URL" field enter "http://127.0.0.1:8545". For the chain ID enter "31337". Then click save.  


### 5. Use the mint and list script to mint and list an NFT
```
$ yarn hardhat run scripts/mint-and-list-item.js --network localhost
```
### 6. Run Tests
```
$ yarn hardhat test
```

License
----
MIT
