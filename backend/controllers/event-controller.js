const Event = require('../models/eventSchema.js');
const mongoose= require('mongoose');

const eventCreate = async (req,res)=>{
    try {
          // Validate required fields
          const { title, description, startDate, endDate } = req.body;
          
          if (!title || title.trim().length < 3) {
              return res.status(400).json({
                  success: false,
                  message: "Title is required and must be at least 3 characters"
              });
          }
          
          if (!description || description.trim().length < 10) {
              return res.status(400).json({
                  success: false,
                  message: "Description is required and must be at least 10 characters"
              });
          }
          
          if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
              return res.status(400).json({
                  success: false,
                  message: "End date must be after start date"
              });
          }
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
       // validating the id to make sure correct id is passed
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID"
            });
        }
        
       // Fetch the event first to check authorization
       const event = await Event.findById(req.params.id);
       
       if (!event) {
           return res.status(404).json({
               success: false,
               message: "Event not found"
           });
       }
       
       // Check if the current admin is the creator or has sufficient permissions
       // Assuming req.body.adminID contains the current admin's ID
       if (event.school.toString() !== req.body.adminID && !req.body.isSuper) {
           return res.status(403).json({
               success: false,
               message: "Unauthorized to update this event"
           });
       }
        const result = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
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

           // Fetch the event first to check authorization
            const event = await Event.findById(req.params.id);
               
              if (!event) {
                   return res.status(404).json({
                       success: false,
                       message: "Event not found"
                   });
               }
               
               // Check if the current admin is the creator or has sufficient permissions
               // Assuming req.body.adminID contains the current admin's ID
               if (event.createdBy.toString() !== req.body.adminID && !req.body.isSuper) {
                   return res.status(403).json({
                       success: false,
                       message: "Unauthorized to delete this event"
                   });
               }
               const result = await Event.findByIdAndDelete(req.params.id);

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
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build dynamic filter object
        const filter = {};

        if (req.query.eventType) {
            filter.eventType = req.query.eventType;
        }

        if (req.query.startDate || req.query.endDate) {
            filter.startDate = {};
            if (req.query.startDate) {
                filter.startDate.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.startDate.$lte = new Date(req.query.endDate);
            }
        }

        // Count total documents matching filter
        const total = await Event.countDocuments(filter);

        // Fetch paginated, filtered, sorted results
        const events = await Event.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ startDate: 1 });

        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            data: {
                events,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
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
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Event ID"
            });
        }
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