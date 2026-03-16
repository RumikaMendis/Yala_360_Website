const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

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
