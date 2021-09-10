const mongoose = require("mongoose");

const NFTCollectionSchema = new mongoose.Schema(
  {
    contractAddress: {
      type: String,
    },
    bidder: {
      type: String,
    },
    seller: {
      type: String,
    },
    bidPrice: {
      type: String,
    },
    offerPrice: {
      type: String,
    },
    tokenId: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NFTCollection ||
  mongoose.model("NFTCollection", NFTCollectionSchema);
