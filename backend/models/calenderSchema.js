const mongoose = require("mongoose");

const calenderSchema = new mongoose.Schema({
    date : { type: String, required: true },
    type : { type: String, required: true },
    title : { type: String, required: true },
    description : { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Calender", calenderSchema);
