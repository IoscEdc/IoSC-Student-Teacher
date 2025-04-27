const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  totalClasses: { type: Number, default: 0 },   // Important field
  attendedClasses: { type: Number, default: 0 }, // Important field
});

module.exports = mongoose.model('Student', StudentSchema);
