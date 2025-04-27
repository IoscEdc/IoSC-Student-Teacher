const Event = require('../models/eventSchema.js');
const mongoose= require('mongoose');

const eventCreate = async (req,res)=>{
    try {
           const newEvent = new Event({
               ...req.body,
               school: req.body.adminID
           })
           const result = await newEvent.save()
           res.send(result)
       } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

const updateEvent = async (req, res) => {
    try {
       //validating the id to make sure correct id is passed
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID"
            });
        }
        const result = await Event.findByIdAndUpdate(req.params.id,
            { $set: req.body },
            { new: true });
        if (!result) {
            return res.status(404).json({
                    success: false,
                    message: "Event not found"
                });
            }
            res.status(200).json({
                success: true,
                message: "Event updated successfully",
                data: result
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

const deleteEvent = async (req, res) => {
    try {
        //validating the id to make sure correct id is passed
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID"
            });
        }

        const result = await Event.findByIdAndDelete(req.params.id)

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
            data: result
        });        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

// Get all events
const getAllEvents = async (req, res) => {
    try {
        const events = await Event.find(); // Fetch all events from the database
        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            data: events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};


// Get event by ID
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id); // Find event by ID
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Event fetched successfully',
            data: event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        });
    }
};


module.exports = { eventCreate,  updateEvent, deleteEvent ,getAllEvents, getEventById};