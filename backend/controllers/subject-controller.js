const mongoose = require("mongoose");
const Subject = require('../models/subjectSchema.js');
const Teacher = require('../models/teacherSchema.js');
const Student = require('../models/studentSchema.js');

const subjectCreate = async (req, res) => {
    // 1. Start a Mongoose session for the transaction
    const session = await mongoose.startSession();
    
    try {
        // 2. Begin the transaction
        session.startTransaction();

        const { subjects, sclassName, adminID } = req.body;

        // 3. Check for duplicate subject codes (must be part of the session)
        const subjectCodes = subjects.map(subject => subject.subCode);
        const existingSubject = await Subject.findOne({
            subCode: { $in: subjectCodes },
            school: adminID,
        }).session(session); // <-- Add session to the query

        if (existingSubject) {
            // If a duplicate is found, abort the transaction
            await session.abortTransaction();
            return res.send({
                message: `Subject code ${existingSubject.subCode} already exists. Subject codes must be unique.`
            });
        }

        // 4. Prepare the new subject documents
        const newSubjects = subjects.map((subject) => ({
            subName: subject.subName,
            subCode: subject.subCode,
            teacher: subject.teacher, // The teacher ID from the form
            sclassName: sclassName,
            school: adminID,
        }));

        // 5. Create the new subjects (must be part of the session)
        // This will return an array of the newly created subject documents
        const createdSubjects = await Subject.insertMany(newSubjects, { session: session });

        // 6. Prepare to update the teachers
        // We'll create a map of { teacherId: [list of new assignments] }
        const teacherUpdateMap = new Map();

        for (const subject of createdSubjects) {
            // We need the subject._id (created above) and the teacher ID
            if (subject.teacher) {
                const teacherId = subject.teacher.toString();
                
                // This is the object that matches the teacherSchema
                const newAssignment = {
                    subjectId: subject._id,
                    classId: subject.sclassName,
                    assignedAt: new Date()
                };

                if (!teacherUpdateMap.has(teacherId)) {
                    teacherUpdateMap.set(teacherId, []);
                }
                teacherUpdateMap.get(teacherId).push(newAssignment);
            }
        }

        // 7. Create an array of update promises for all teachers
        const updatePromises = [];
        for (const [teacherId, assignments] of teacherUpdateMap.entries()) {
            updatePromises.push(
                Teacher.updateOne(
                    { _id: teacherId },
                    // Use $push with $each to add all new assignments to the array
                    { $push: { assignedSubjects: { $each: assignments } } }
                ).session(session) // <-- Add session to the update
            );
        }

        // 8. Execute all teacher updates
        await Promise.all(updatePromises);

        // 9. If all operations were successful, commit the transaction
        await session.commitTransaction();
        res.send(createdSubjects);

    } catch (err) {
        // 10. If any error occurred, abort the transaction
        await session.abortTransaction();
        console.error("Subject creation transaction error:", err);
        res.status(500).json(err);
    } finally {
        // 11. Always end the session
        session.endSession();
    }
};

const allSubjects = async (req, res) => {
    try {
        let subjects = await Subject.find({ school: req.params.id })
            .populate("sclassName", "sclassName")
            .populate("teacher", "name"); // Added teacher population
            
        if (subjects.length > 0) {
            res.send(subjects)
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const classSubjects = async (req, res) => {
    try {
        let subjects = await Subject.find({ sclassName: req.params.id })
            .populate("sclassName", "sclassName")
            .populate("teacher", "name");

        // console.log("🔍 BACKEND DEBUG - Retrieved subjects:", subjects);
        if (subjects.length > 0) {
            res.send(subjects)
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        console.error("Population Error:", err);
        res.status(500).json(err);
    }
};

const freeSubjectList = async (req, res) => {
    try {
        // This function logic is correct and remains unchanged
        let subjects = await Subject.find({ sclassName: req.params.id, teacher: { $exists: false } });
        if (subjects.length > 0) {
            res.send(subjects);
        } else {
            res.send({ message: "No subjects found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
};

const getSubjectDetail = async (req, res) => {
    try {
        // Chained populate calls for efficiency
        let subject = await Subject.findById(req.params.id)
            .populate("sclassName", "sclassName")
            .populate("teacher", "name");

        if (subject) {
            res.send(subject);
        }
        else {
            res.send({ message: "No subject found" });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

const deleteSubject = async (req, res) => {
    try {
        const deletedSubject = await Subject.findByIdAndDelete(req.params.id);

        if (!deletedSubject) {
            return res.status(404).send({ message: "Subject not found" });
        }

        const subjectId = deletedSubject._id;

        // Set the teachSubject field to null in teachers
        await Teacher.updateOne(
            { teachSubject: subjectId },
            { $set: { teachSubject: null } } // Cleaner update
        );

        // Remove the deleted subject from students' examResult array
        await Student.updateMany(
            { 'examResult.subName': subjectId },
            { $pull: { examResult: { subName: subjectId } } }
        );

        // Remove the deleted subject from students' attendance array
        await Student.updateMany(
            { 'attendance.subName': subjectId },
            { $pull: { attendance: { subName: subjectId } } }
        );

        res.send(deletedSubject);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjects = async (req, res) => {
    try {
        // 1. Find all subjects for the school
        const subjectsToDelete = await Subject.find({ school: req.params.id });
        if (subjectsToDelete.length === 0) {
            return res.send({ message: "No subjects found to delete." });
        }

        // 2. Get their IDs
        const subjectIds = subjectsToDelete.map(subject => subject._id);

        // 3. Delete all found subjects
        const deleteResult = await Subject.deleteMany({ _id: { $in: subjectIds } });

        // 4. Update Teachers
        await Teacher.updateMany(
            { teachSubject: { $in: subjectIds } },
            { $set: { teachSubject: null } }
        );

        // 5. Update Students by pulling matching subjects
        await Student.updateMany(
            { 'examResult.subName': { $in: subjectIds } },
            { $pull: { examResult: { subName: { $in: subjectIds } } } }
        );
        await Student.updateMany(
            { 'attendance.subName': { $in: subjectIds } },
            { $pull: { attendance: { subName: { $in: subjectIds } } } }
        );

        res.send(deleteResult);
    } catch (error) {
        res.status(500).json(error);
    }
};

const deleteSubjectsByClass = async (req, res) => {
    try {
        // 1. Find all subjects for the class
        const subjectsToDelete = await Subject.find({ sclassName: req.params.id });
        if (subjectsToDelete.length === 0) {
            return res.send({ message: "No subjects found for this class to delete." });
        }

        // 2. Get their IDs
        const subjectIds = subjectsToDelete.map(subject => subject._id);

        // 3. Delete all found subjects
        const deleteResult = await Subject.deleteMany({ _id: { $in: subjectIds } });

        // 4. Update Teachers
        await Teacher.updateMany(
            { teachSubject: { $in: subjectIds } },
            { $set: { teachSubject: null } }
        );

        // 5. Update Students by pulling matching subjects
        await Student.updateMany(
            { 'examResult.subName': { $in: subjectIds } },
            { $pull: { examResult: { subName: { $in: subjectIds } } } }
        );
        await Student.updateMany(
            { 'attendance.subName': { $in: subjectIds } },
            { $pull: { attendance: { subName: { $in: subjectIds } } } }
        );

        res.send(deleteResult);
    } catch (error) {
        res.status(500).json(error);
    }
};


module.exports = { subjectCreate, freeSubjectList, classSubjects, getSubjectDetail, deleteSubjectsByClass, deleteSubjects, deleteSubject, allSubjects };