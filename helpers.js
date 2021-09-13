const ethers = require("ethers");
const NFTCollection = require("./models/NFTCollection");
const Block = require("./models/Block");

const emptyDatabase = async () => {
  try {
    await NFTCollection.deleteMany({});
    await Block.deleteMany({});
    console.log("Database has be emptied!");
  } catch {
    console.log("Couldn't delete data!");
  }
};

const handleNewBid = async (bidder, owner, price, erc721, tokenId, args) => {
  price = ethers.utils.formatEther(price);
  try {
    await NFTCollection.findOneAndUpdate(
      { contractAddress: erc721, tokenId },
      { bidder, bidPrice: price, seller: owner },
      { upsert: true, new: true }
    );

    // Update recorded block
    await updateBlock(args.blockNumber);
  } catch (err) {
    console.log(err);
    console.log("Error");
  }

  console.log(
    `New bid of ${price}Weth has been submitted from ${bidder} for tokenId ${tokenId.toNumber()} of contract ${erc721}`
  );
};

const handleSale = async (buyer, seller, price, erc721, tokenId, args) => {
  // TODO: Should I delete collection on sale?
  try {
    await NFTCollection.findOneAndUpdate(
      { contractAddress: erc721, tokenId },
      { bidder: null, seller: null, bidPrice: null, offerPrice: null },
      { upsert: true, new: true }
    );

    // Update recorded block
    await updateBlock(args.blockNumber);
  } catch (err) {
    console.log(err);
    console.log("Unable to create or update!");
  }
  console.log(
    `Sold NFT with tokenId ${tokenId.toNumber()} of contract ${erc721} for ${ethers.utils.formatEther(
      price
    )}Weth to ${buyer} from ${seller}`
  );
};

const handleNewOffer = async (seller, price, erc721, tokenId, args) => {
  price = ethers.utils.formatEther(price);

  try {
    await NFTCollection.findOneAndUpdate(
      { contractAddress: erc721, tokenId },
      { bidder: null, seller, offerPrice: price },
      { upsert: true, new: true }
    );

    // Update recorded block
    await updateBlock(args.blockNumber);
  } catch (err) {
    console.log(err);
    console.log("Unable to create or update!");
  }
  console.log(
    `New offer of ${price}Weth recieved for ${erc721} with tokenId ${tokenId.toNumber()}  from ${seller}`
  );
};

const updateBlock = async (blockNumber) => {
  try {
    //   Checking if we are running server for the first time
    if (blockNumber === 16947958) {
      await Block.create({ name: "LastRecorded", number: blockNumber });
    } else {
      await Block.findOneAndUpdate(
        { name: "LastRecorded", $expr: { $gt: [blockNumber, "$number"] } },
        { number: blockNumber },
        { new: true }
      );
      console.log("Updated Block Number");
    }
  } catch (err) {
    console.log(err);
    console.log("Unable to create or update!");
  }
};

module.exports = {
  handleNewBid,
  handleSale,
  handleNewOffer,
  updateBlock,
  emptyDatabase,
};
