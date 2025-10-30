// const feedbackRoutes = require('./routes/feedback');
// require('dotenv').config();

// const express = require("express")
// const cors = require("cors")
// const mongoose = require("mongoose")
// const dotenv = require("dotenv")
// // const bodyParser = require("body-parser")
// const app = express()
// const Routes = require("./routes/route.js")
// const chatbotRoutes = require('./routes/chatbot');
// app.use('/api/feedback', feedbackRoutes);
// app.use('/api/chat', chatbotRoutes);

// const PORT = process.env.PORT || 5000

// dotenv.config();

// // app.use(bodyParser.json({ limit: '10mb', extended: true }))
// // app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

// app.use(express.json({ limit: '10mb' }))
// app.use(cors())

// // mongoose
// //     .connect(process.env.MONGO_URL, {
// //         useNewUrlParser: true,
// //         useUnifiedTopology: true
// //     })
// //     .then(console.log("Connected to MongoDB"))
// //     .catch((err) => console.log("NOT CONNECTED TO NETWORK", err))

// mongoose
//     .connect(process.env.MONGO_URL, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true
//     })
//     .then(() => console.log("✅ Connected to MongoDB"))
//     .catch((err) => console.log("❌ NOT CONNECTED TO NETWORK", err));


// app.use('/', Routes);

// app.listen(PORT, () => {
//     console.log(`Server started at port no. ${PORT}`)
// })



require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Existing routes
const feedbackRoutes = require("./routes/feedback");
const chatbotRoutes = require("./routes/chatbot");

// College portal routes
const notesRoutes = require("./routes/notesRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const authRoutes = require("./routes/authRoutes");

// Error monitoring routes
const errorMonitoringRoutes = require("./routes/errorMonitoringRoutes");
const attendanceErrorMonitoringRoutes = require("./routes/attendanceErrorMonitoringRoutes");

// Main routes (includes attendance routes)
const mainRoutes = require("./routes/route");

// Error middleware
const { errorHandler } = require("./middleware/errorMiddleware");

// Performance monitoring middleware
const { performanceMonitor } = require("./middleware/performanceMiddleware");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Performance monitoring (should be early in middleware chain)
app.use(performanceMonitor);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ NOT CONNECTED TO NETWORK", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notices", noticeRoutes);

app.use("/api/feedback", feedbackRoutes);
app.use("/api/chat", chatbotRoutes);

// Error monitoring routes
app.use("/api/monitoring", errorMonitoringRoutes);
app.use("/api/attendance-monitoring", attendanceErrorMonitoringRoutes);

// Main routes (includes attendance and other school management routes)
app.use("/api", mainRoutes);

// Root
app.get("/", (req, res) =>
  res.json({ ok: true, message: "College Portal Backend Running 🚀" })
);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`🚀 Server started at port ${PORT}`));
