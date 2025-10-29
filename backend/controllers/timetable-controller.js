const TimeTable = require('../models/timetableSchema.js');
const Calender = require('../models/calenderSchema.js');

const getTimeTable = async (req , res) => {
    const {batch} = req.params;
    const data = await TimeTable.findOne({batch: batch}); 
    if(!data) res.status(404).json({msg : "Not Found"});
    else res.status(200).json({timetable: data.timetable});
}

const putTimeTable = async (req, res) => {
  try {
    const { batch } = req.params;
    const updatedTimetable = req.body;

    const data = await TimeTable.findOneAndUpdate(
      { batch: batch },
      { $set: updatedTimetable }, 
      { new: true, upsert: false } 
    );

    if (!data) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.status(200).json({ message: "Timetable updated successfully", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getBatch = async (req , res) => {
    const data = await TimeTable.find();
    return res.status(200).json({batches : data.map((elem) => {
        return elem.batch;
    })});
}

const postBatch =async (req , res) => {
    const empty = req.body;
    const timetable = new TimeTable(empty);
    await timetable.save();
    res.status(200).json({msg : "Sucess"});
}

const deleteBatch = async (req, res) => {
    try {
        const { batch } = req.params;
        const timetable = await TimeTable.findOne({ batch });

        if (!timetable) {
            return res.status(404).json({ err: "Batch not found" });
        }

        await TimeTable.deleteOne({ batch });
        return res.status(200).json({ msg: "Batch deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ err: "Server error" });
    }
};


const getCalendar = (req , res) => {
    Calender.find().then( calenderData => {
        res.status(200).json({calender: calenderData});
    }).catch( err => {
        console.error(err);
        res.status(500).json({message: "Error retrieving calendar data"});
    });
}

const postCalendar = (req , res) => {
    const { date, type, title, description } = req.body;
    const newEvent = new Calender({ date, type, title, description });
    newEvent.save()
    .then(() => {
        res.status(201).json({ message: "Event added successfully" });
    }
    ).catch( err => {
        console.error(err);
        res.status(500).json({message: "Error adding event to calendar"});
    }
    );
};

const putCalendar = (req , res) => {
    const { id, date, type, title, description } = req.body;
    Calender.findByIdAndUpdate(id, { date, type, title, description })
    .then(() => {
        res.status(200).json({ message: "Event updated successfully" });
    })
    .catch( err => {
        console.error(err);
        res.status(500).json({message: "Error updating event in calendar"});
    }); 
};

const deleteCalendar = async (req , res) => {
    const { id } = req.params;
    Calender.findByIdAndDelete(id).then(() => 
    {
        res.status(200).json({msg : "Sucess"});
    }).catch((err) => {
        res.status(500).json({err : err});
    })
};

module.exports = {
    getTimeTable ,
    putTimeTable,
    getBatch,
    postBatch,
    deleteBatch,
    getCalendar ,
    postCalendar ,
    putCalendar ,
    deleteCalendar
}