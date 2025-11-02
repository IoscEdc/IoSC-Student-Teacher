// 1. IMPORTS (All at the top)
require('dotenv').config(); // Load environment variables ONCE
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// --- Route Imports ---
const Routes = require("./routes/route.js");
const feedbackRoutes = require('./routes/feedback');
const chatbotRoutes = require('./routes/chatbot');
// const notesRoutes = require("./routes/notesRoutes");
const assignmentsRoutes = require("./routes/assignmentsRoutes");

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

// 3. MIDDLEWARES (All defined together)
app.use(express.json({ limit: '10mb' })); // Replaces bodyParser
app.use(cors());

// --- Debug middleware to log all requests ---
app.use((req, res, next) => {
    // Be careful logging req.body, it can be very large!
    console.log(`🔍 REQUEST DEBUG - ${req.method} ${req.path}`); 
    next();
});

// 4. ROUTES (All defined together)
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chat', chatbotRoutes);
// app.use("/api/notes", notesRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use('/', Routes); // This should usually be last if it has "catch-all" routes

// 5. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.log("❌ NOT CONNECTED TO NETWORK", err));

// 6. SERVER START (Called ONLY ONCE at the very end)
app.listen(PORT, () => {
    console.log(`🚀 Server started at port no. ${PORT}`);
});


// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const mongoose = require("mongoose");




// // Initialize app
// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// // app.use(express.json({ limit: "10mb" }));

// // MongoDB connection
// mongoose
//   .connect(process.env.MONGO_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ Connected to MongoDB"))
//   .catch((err) => console.error("❌ NOT CONNECTED TO NETWORK", err));

// // Routes
// app.use("/api/auth", authRoutes);

// // Root
// app.get("/", (req, res) =>
//   res.json({ ok: true, message: "College Portal Backend Running 🚀" })
// );

// // Error handler (must be last)
// app.use(errorHandler);

// // Start server
// app.listen(PORT, () => console.log(`🚀 Server started at port ${PORT}`));
