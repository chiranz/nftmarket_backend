const mongoose = require("mongoose");

const Block = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
    },
    number: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Block || mongoose.model("Block", Block);
