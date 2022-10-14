//SPDX-License-Identifier : MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace_NotOwner();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketplace__CannotSetToZero();
error NftMarketplace__BalanceIsZero();
error NftMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    struct Listing {
        address nftAddress;
        uint256 price;
        address seller;
        uint256 tokenId;
    }

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCancelled(address indexed seller, address nftAddress, uint256 tokenId);

    event ItemBought(address sender, address nftAddress, uint256 tokenId, uint256 price);

    //NFT Contract address -> NFT TokenID -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    //seller address -> amount earned
    mapping(address => uint256) private s_proceeds;

    Listing[] public listings;

    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) {
            revert NftMarketplace_NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    /*
     * @notice Method for removing an element from an array by index
     * @param index The index of the element to be removed
     */
    function remove(uint256 index) public {
        //Move the last element into the place to delete
        uint256 lastIndex = listings.length - 1;
        listings[index] = listings[lastIndex];
        listings.pop();
    }

    /*
     * @notice Method for getting index of element in array by tokenId
     * @param tokenId The tokenId of the NFT
     */
    function getIndex(uint256 tokenId) public view returns (uint256) {
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].tokenId == tokenId) {
                return i;
            }
        }
    }

    /*
     * @notice Method for listing your NFT on the marketplace
     * @param nftAddress The address of the NFT to be listed
     * @param tokenId The tokenId of the NFT
     * @param price Sale price of the NFT
     * @dev It is possible to have the contract be the owner of the NFT
     * but in this way people can still hold their nfts and list the for sale
     * Could make the contract accept payment in subset of tokens with chainlinke price
     * feeds
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        //owners can still hold their nft, and give the marketplace approval to sell the nft for them
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace();
        }
        //when updating a mapping emit events
        s_listings[nftAddress][tokenId] = Listing(nftAddress, price, msg.sender, tokenId);
        listings.push(s_listings[nftAddress][tokenId]);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /*
     * @notice Method for buying and NFT
     * @param nftAddress the address of the NFT thats gonna be bought
     * @param tokenId the tokenId of the NFT to be bought
     *
     */
    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        nonReentrant
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }
        // we dont just send the money to the seller?
        // solidity pull over push
        // instead of sending the money to the user
        //have them withdraw
        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;

        delete (s_listings[nftAddress][tokenId]);
        uint256 index = getIndex(tokenId);
        remove(index);
        // safeTranferFrom keeps us from a reentrancy attack
        // also first we update the state of the contract and then transfer the money/nft
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        //check to make sure the NFT has been transferred
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /*
     * @notice Method for canceling a listing
     * @param nftAddress the address of the NFT thats gonna be bought
     * @param tokenId the tokenId of the NFT to be bought
     *
     */
    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        uint256 index = getIndex(tokenId);
        remove(index);

        emit ItemCancelled(msg.sender, nftAddress, tokenId);
    }

    /*
     * @notice Method for updating an already listed NFT
     * @param nftAddress the address of the NFT thats gonna be bought
     * @param tokenId the tokenId of the NFT to be bought
     * @param newPrice the new price of the NFT
     */
    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        if (newPrice <= 0) {
            revert NftMarketplace__CannotSetToZero();
        }
        s_listings[nftAddress][tokenId].price = newPrice;
        console.log(s_listings[nftAddress][tokenId].price);
        for (uint256 i = 0; i < listings.length; i++) {
            if (listings[i].tokenId == tokenId) {
                listings[i].price = newPrice;
            }
        }
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    /*
     * @notice Method for withdrawing the money from selling an NFT
     */
    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace__BalanceIsZero();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketplace__TransferFailed();
        }
    }

    function fetchListedItems() external view returns (Listing[] memory) {
        return listings;
    }

    function getListing(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}

// 1. Create a decentralized NFT marketplace
//     1. `listItem`: List NFTs
//     2. `buyItem`: Buy tha NFTs
//     3. `cancelItem` : Cancel a listing
//     4. `updateListing`: Update price of a listing
//     5. `withdrawProceeds`: Witdhraw payment for my bought NFTs
