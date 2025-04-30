const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
            title:{
                type: String,
                required : true,
                minLength : 8
            },
            description: {
                type: String,
                required: true,
                minLength : 15
            },
            startDate: Date,
            endDate: Date,
            eventType: String,
            school: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Admin'  // Who created the event
            }
});

module.exports = mongoose.model("event", eventSchema);