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

// Error middleware
const { errorHandler } = require("./middleware/errorMiddleware");

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

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

// Root
app.get("/", (req, res) =>
  res.json({ ok: true, message: "College Portal Backend Running 🚀" })
);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`🚀 Server started at port ${PORT}`));
