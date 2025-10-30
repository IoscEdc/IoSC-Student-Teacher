const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

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

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!', timestamp: new Date() });
});

// Import and use main routes
const mainRoutes = require('./routes/route');
app.use('/api', mainRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server started at port ${PORT}`);
    console.log(`📍 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`📍 API base: http://localhost:${PORT}/api`);
});
