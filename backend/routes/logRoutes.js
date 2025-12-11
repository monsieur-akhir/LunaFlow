const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const { protect } = require('../middleware/auth');

// GET /api/logs
// Récupère tous les logs de l'utilisateur connecté
router.get('/', protect, async (req, res) => {
    try {
        const logs = await DailyLog.find({ user: req.user._id }).sort({ date: -1 });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/logs
// Créer ou Mettre à jour un log pour une date donnée (Upsert)
router.post('/', protect, async (req, res) => {
    try {
        const { date, symptoms, mood, flow, sexualActivity, contraceptiveTaken, libido } = req.body;
        
        // Recherche si un log existe déjà pour ce jour et cet user
        let log = await DailyLog.findOne({ user: req.user._id, date: date });

        if (log) {
            // Update
            log.symptoms = symptoms;
            log.mood = mood;
            log.flow = flow;
            log.sexualActivity = sexualActivity;
            log.contraceptiveTaken = contraceptiveTaken;
            log.libido = libido;
            await log.save();
        } else {
            // Create
            log = await DailyLog.create({
                user: req.user._id,
                date,
                symptoms,
                mood,
                flow,
                sexualActivity,
                contraceptiveTaken,
                libido
            });
        }

        // Mise à jour logique métier (Dernières règles) dans le User
        if (flow) {
            const logDate = new Date(date);
            const currentLastPeriod = new Date(req.user.settings.lastPeriodDate);
            if (logDate > currentLastPeriod) {
                req.user.settings.lastPeriodDate = logDate;
            }
        }

        req.user.lastActiveAt = new Date();
        await req.user.save();

        // SOCKET: Notifier le partenaire
        if (req.user.settings.isConnectedToPartner && req.user.partnerName) {
            const partner = await User.findOne({ name: req.user.partnerName });
            if (partner) {
                req.io.to(partner.settings.pairingCode).emit('partner_update', {
                    mood,
                    libido,
                    lastActive: new Date()
                });
            }
        }
        
        // Pour maintenir la compatibilité frontend, on renvoie la liste mise à jour
        // Note: Dans une app très chargée, on ne renverrait que le log modifié
        const allLogs = await DailyLog.find({ user: req.user._id }).sort({ date: -1 });
        res.json({ success: true, logs: allLogs });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

// DELETE /api/logs/:date
router.delete('/:date', protect, async (req, res) => {
    try {
        await DailyLog.findOneAndDelete({ user: req.user._id, date: req.params.date });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

module.exports = router;