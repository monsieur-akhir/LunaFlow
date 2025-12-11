const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const { protect } = require('../middleware/auth');

// POST /api/partner/pair
router.post('/pair', protect, async (req, res) => {
    try {
        const { code } = req.body;
        
        const partner = await User.findOne({ 'settings.pairingCode': code });
        
        if (!partner) {
            return res.status(404).json({ success: false, message: "Code partenaire invalide." });
        }
        
        if (partner._id.equals(req.user._id)) {
             return res.status(400).json({ success: false, message: "Vous ne pouvez pas vous lier à vous-même." });
        }

        req.user.partnerName = partner.name;
        req.user.settings.isConnectedToPartner = true;
        
        partner.partnerName = req.user.name;
        partner.settings.isConnectedToPartner = true;

        await req.user.save();
        await partner.save();

        req.io.to(partner.settings.pairingCode).emit('partner_connected', {
            partnerName: req.user.name
        });

        res.json({ 
            success: true, 
            message: `Félicitations ! Connecté avec ${partner.name}`,
            partnerName: partner.name 
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/partner/notify
router.post('/notify', protect, async (req, res) => {
    const { type, message } = req.body;
    
    const partner = await User.findOne({ name: req.user.partnerName });
    
    if (partner) {
        req.io.to(partner.settings.pairingCode).emit('notification', {
            from: req.user.name,
            type,
            message
        });
        console.log(`[SOCKET] Sent to ${partner.name} (Room: ${partner.settings.pairingCode})`);
    }

    res.json({ success: true, message: "Notification envoyée" });
});

// GET /api/partner/status
router.get('/status', protect, async (req, res) => {
    try {
        if (!req.user.settings.isConnectedToPartner || !req.user.partnerName) {
            return res.status(400).json({ message: "Pas de partenaire connecté" });
        }

        const partner = await User.findOne({ name: req.user.partnerName });

        if (!partner) return res.status(404).json({ message: "Partenaire introuvable" });

        // MODIFICATION ICI : On cherche le dernier log dans la collection DailyLog
        const lastLog = await DailyLog.findOne({ user: partner._id }).sort({ date: -1 });
        
        res.json({
            name: partner.name,
            mood: lastLog ? lastLog.mood : null,
            libido: lastLog ? lastLog.libido : null,
            lastActive: partner.lastActiveAt
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;