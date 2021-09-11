const mongoose = require("mongoose");
const ethers = require("ethers");
require("dotenv").config();

const NFTCollection = require("./models/NFTCollection");
const marketplaceArtifact = require("./Marketplace.json");
const contractAddress = "0x3185619aD5192b0f728f4874F92A630d0793E179";

const emptyDatabase = async () => {
  try {
    await NFTCollection.deleteMany({});
    console.log("Database has be emptied!");
  } catch {
    console.log("Couldn't delete data!");
  }
};

const provider = new ethers.providers.JsonRpcProvider(process.env.RINKEBY_URL);

const contract = new ethers.Contract(
  contractAddress,
  marketplaceArtifact.abi,
  provider
);

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("DB connected successfully from EListener");

  contract.on("NewBid", async (bidder, owner, price, erc721, tokenId) => {
    price = ethers.utils.formatEther(price);

    try {
      await NFTCollection.findOneAndUpdate(
        { contractAddress: erc721, tokenId },
        { bidder, bidPrice: price, seller: owner },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.log(err);
      console.log("Error");
    }

    console.log(
      `New bid of ${price}Weth has been submitted from ${bidder} for tokenId ${tokenId.toNumber()} of contract ${erc721}`
    );
  });

  contract.on("Sale", async (buyer, seller, price, erc721, tokenId) => {
    // TODO: Should I delete collection on sale?
    try {
      await NFTCollection.findOneAndUpdate(
        { contractAddress: erc721, tokenId },
        { bidder: null, seller: null, bidPrice: null, offerPrice: null },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.log(err);
      console.log("Unable to create or update!");
    }
    console.log(
      `Sold NFT with tokenId ${tokenId.toNumber()} of contract ${erc721} for ${ethers.utils.formatEther(
        price
      )}Weth to ${buyer} from ${seller}`
    );
  });

  contract.on("NewOffer", async (seller, price, erc721, tokenId) => {
    price = ethers.utils.formatEther(price);

    try {
      await NFTCollection.findOneAndUpdate(
        { contractAddress: erc721, tokenId },
        { bidder: null, seller, offerPrice: price },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.log(err);
      console.log("Unable to create or update!");
    }
    console.log(
      `New offer of ${price}Weth recieved for ${erc721} with tokenId ${tokenId.toNumber()}  from ${seller}`
    );
  });
})();
