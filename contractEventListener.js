const mongoose = require("mongoose");
const ethers = require("ethers");
require("dotenv").config();

// MODELS
const NFTCollection = require("./models/NFTCollection");
const Block = require("./models/Block");

// HELPERS
const marketplaceArtifact = require("./Marketplace.json");
const {
  handleNewBid,
  handleNewOffer,
  handleSale,
  updateBlock,
  emptyDatabase,
} = require("./helpers");

const CONSTANTS = {
  rinkeby: {
    contractAddress: "0x3185619aD5192b0f728f4874F92A630d0793E179",
    rpc: process.env.RINKEBY_URL,
  },
  fantom: {
    contractAddress: "0xC437B3FF25930C3A013f34ca178696dAed5265c0",
    rpc: "https://rpc.ftm.tools/",
  },
};

const provider = new ethers.providers.JsonRpcProvider(CONSTANTS.fantom.rpc);

const contract = new ethers.Contract(
  CONSTANTS.fantom.contractAddress,
  marketplaceArtifact.abi,
  provider
);

(async () => {
  await mongoose.connect(process.env.MONGO_URI_FTM, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  //TODO:  Remove this on prod.
  await emptyDatabase();

  console.log("DB connected successfully from EListener");
  const currentBlockNumber = await provider.getBlockNumber();

  let recordedBlock = await Block.findOne({
    name: "LastRecorded",
  });

  if (!recordedBlock) {
    await updateBlock(16947958);
    console.log("Genesis Block Number Saved");

    // Update recorded block
    recordedBlock = await Block.findOne({
      name: "LastRecorded",
    });
  }

  if (recordedBlock.number < currentBlockNumber) {
    // make all query filter calls at same time
    const newBidFilter = contract.filters.NewBid();
    const getBids = contract.queryFilter(newBidFilter, recordedBlock.number);

    const saleFilter = contract.filters.Sale();
    const getSales = contract.queryFilter(saleFilter, recordedBlock.number);

    const newOfferFilter = contract.filters.NewOffer();
    const getOffers = contract.queryFilter(
      newOfferFilter,
      recordedBlock.number
    );

    // await later so that you don't miss blocks.
    const bids = await getBids;
    const offers = await getOffers;
    const sales = await getSales;

    for (let bid of bids) {
      const { bidder, owner, price, erc721, tokenId } = bid.args;
      try {
        await handleNewBid(bidder, owner, price, erc721, tokenId, {
          blockNumber: bid.blockNumber,
        });
      } catch (err) {
        console.log(err);
      }
    }

    // TODO: Handle unrecorded sales
    for (let sale of sales) {
      const { buyer, seller, price, erc721, tokenId } = sale.args;
      try {
        await handleSale(buyer, seller, price, erc721, tokenId, {
          blockNumber: sale.blockNumber,
        });
      } catch (err) {
        console.log(err);
      }
    }

    // TODO: Handle Unrecorded offers
    for (let offer of offers) {
      const { seller, price, erc721, tokenId } = offer.args;
      try {
        await handleNewOffer(seller, price, erc721, tokenId, {
          blockNumber: offer.blockNumber,
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  contract.on("NewBid", handleNewBid);

  contract.on("Sale", handleSale);

  contract.on("NewOffer", handleNewOffer);
})();
