const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const NFTCollection = require("./models/NFTCollection");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/collections", async (req, res) => {
  try {
    const nfts = await NFTCollection.find({
      $or: [{ offerPrice: { $ne: null } }, { bidPrice: { $ne: null } }],
    }).sort({ updatedAt: -1 });
    res.status(200).json(nfts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

app.get("/collections/:contractAddress", async (req, res) => {
  try {
    const nfts = await NFTCollection.find({
      contractAddress: req.params.contractAddress,
      $or: [{ offerPrice: { $ne: null } }, { bidPrice: { $ne: null } }],
    }).sort({ updatedAt: -1 });
    res.status(200).json(nfts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

app.get("/wallet/:walletAddress", async (req, res) => {
  try {
    const nfts = await NFTCollection.find({
      $or: [
        { bidder: req.params.walletAddress },
        { seller: req.params.walletAddress },
      ],
    }).sort({ updatedAt: -1 });
    res.status(200).json(nfts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
});

app.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("DB connected successfully");
});
