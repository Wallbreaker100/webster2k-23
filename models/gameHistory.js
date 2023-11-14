require("../db/connection");
const mongoose = require("mongoose");

const gameHistorySchema = new mongoose.Schema({
  email:String,
  totalMatch:Number,
  wins:Number,
  level:Number
});

const gameHistory = new mongoose.model("gameHistory", gameHistorySchema);

module.exports = gameHistory;
