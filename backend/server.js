const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Route Imports
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const logRoutes = require('./routes/logRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const aiRoutes = require('./routes/aiRoutes'); // <--- Ajout Import

const app = express();
const server = http.createServer(app);

// Configuration Socket.io (CORS permissif pour le dev)
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware pour rendre 'io' accessible dans les routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunaflow';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---
app.use('/api/user', userRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes); // <--- Ajout Route

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // Rejoindre une "room" privée basée sur l'ID utilisateur (pour notifs perso)
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Rejoindre une "room" couple (pour partage en temps réel)
  socket.on('join_couple_room', (pairingCode) => {
    socket.join(pairingCode);
    console.log(`Socket ${socket.id} joined couple room: ${pairingCode}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io`);
});