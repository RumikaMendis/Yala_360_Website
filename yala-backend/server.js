console.log('Starting server.js...');
const express = require('express');
console.log('Express loaded');
const http = require('http');
console.log('HTTP loaded');
const { Server } = require('socket.io');
console.log('Socket.io loaded');
const cors = require('cors');
console.log('CORS loaded');
const dotenv = require('dotenv');
console.log('Dotenv loaded');
const connectDB = require('./config/db');
console.log('ConnectDB loaded');

// Load environment variables
dotenv.config();
console.log('Dotenv configured');

// Connect to MongoDB
if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('<username>')) {
  connectDB();
} else {
  console.log('Skipping MongoDB connection due to placeholder URI');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this for production
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/incidents', require('./routes/incidents'));

app.get('/', (req, res) => {
  res.send('Yala 360º API is running...');
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Join admin room for dashboard updates
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log(`Socket ${socket.id} joined admin-room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Helper to broadcast from routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is roaring on port ${PORT}`);
});
