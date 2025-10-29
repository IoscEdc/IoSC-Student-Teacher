const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema({
  time: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: String, required: true },
  room: { type: String, required: true },
});

const timetableSchema = new mongoose.Schema({
  batch: { type: String, required: true, unique: true }, 
  timetable: {
    
  Monday: [slotSchema],
  Tuesday: [slotSchema],
  Wednesday: [slotSchema],
  Thursday: [slotSchema],
  Friday: [slotSchema]}
}, { timestamps: true });

module.exports = mongoose.model("Timetable", timetableSchema);
