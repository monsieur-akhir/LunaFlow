const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'luna_secret_key_123', {
    expiresIn: '30d',
  });
};

// POST /api/user/register
router.post('/register', async (req, res) => {
    try {
        const { name, age, password, settings } = req.body;
        
        const pairingCode = name.substring(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
        
        const user = await User.create({
            name,
            age,
            password, 
            settings: { ...settings, pairingCode },
            medicalData: {}
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                pairingCode: user.settings.pairingCode,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
    const { name, password } = req.body; 

    try {
        const user = await User.findOne({ name });

        if (user && (await user.matchPassword(password))) {
            // Récupérer les logs séparément maintenant
            const logs = await DailyLog.find({ user: user._id }).sort({ date: -1 });

            res.json({
                _id: user._id,
                name: user.name,
                settings: user.settings,
                logs: logs, // On injecte les logs ici pour que le frontend n'y voit que du feu
                medicalData: user.medicalData,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Nom ou mot de passe incorrect' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user/me
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

// PUT /api/user/settings
router.put('/settings', protect, async (req, res) => {
    try {
        const updates = req.body;
        
        Object.keys(updates).forEach(key => {
            req.user.settings[key] = updates[key];
        });
        
        req.user.lastActiveAt = new Date();
        await req.user.save();
        
        res.json({ success: true, settings: req.user.settings });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// PUT /api/user/medical
router.put('/medical', protect, async (req, res) => {
    try {
        req.user.medicalData = { ...req.user.medicalData, ...req.body };
        await req.user.save();
        res.json({ success: true, medicalData: req.user.medicalData });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;