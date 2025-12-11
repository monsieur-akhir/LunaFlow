const express = require('express');
const router = express.Router();
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');

// GET /api/admin/stats
// Récupère les KPIs globaux calculés sur la base de données réelle
router.get('/stats', async (req, res) => {
    try {
        // 1. Compteurs basiques
        const totalUsers = await User.countDocuments();
        const activePregnancies = await User.countDocuments({ 'settings.mode': 'PREGNANCY' });
        const tryingToConceive = await User.countDocuments({ 'settings.isTryingToConceive': true });
        
        // 2. Calcul des Alertes (Retards > 7 jours)
        // Note: Pour une grande échelle, utiliser une agrégation MongoDB serait plus performant.
        // Ici, on itère sur les utilisateurs en mode CYCLE pour la précision.
        const today = new Date();
        const cycleUsers = await User.find({ 'settings.mode': 'CYCLE' })
                                     .select('settings.lastPeriodDate settings.cycleLength');
        
        let alertsTriggered = 0;
        cycleUsers.forEach(u => {
            if (u.settings.lastPeriodDate) {
                const diffTime = Math.abs(today - new Date(u.settings.lastPeriodDate));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Si on dépasse la durée du cycle + 7 jours de marge
                if (diffDays > (u.settings.cycleLength + 7)) {
                    alertsTriggered++;
                }
            }
        });

        // 3. Répartition des Symptômes (Sur les 30 derniers jours)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 30);
        const dateStr = dateLimit.toISOString().split('T')[0];

        const symptomStats = await DailyLog.aggregate([
            { $match: { date: { $gte: dateStr } } }, // Filtre date
            { $unwind: "$symptoms" }, // Découpe le tableau de symptômes
            { $group: { _id: "$symptoms", count: { $sum: 1 } } }, // Compte par symptôme
            { $sort: { count: -1 } }, // Trie par fréquence
            { $limit: 5 } // Top 5
        ]);

        const symptomDistribution = {};
        symptomStats.forEach(stat => {
            symptomDistribution[stat._id] = stat.count;
        });

        res.json({
            totalUsers,
            activePregnancies,
            tryingToConceive,
            alertsTriggered,
            symptomDistribution
        });
    } catch (err) {
        console.error("Admin Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users
// Liste dynamique des utilisatrices avec calcul d'état
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('name age settings lastActiveAt')
            .limit(50)
            .sort({ lastActiveAt: -1 });

        const formattedUsers = users.map(u => {
            let cycleDayOrWeek = 0;
            let status = 'active';
            const now = new Date();

            // Calcul du jour de cycle ou semaine de grossesse
            if (u.settings.mode === 'CYCLE' && u.settings.lastPeriodDate) {
                const lp = new Date(u.settings.lastPeriodDate);
                const diff = now.getTime() - lp.getTime();
                cycleDayOrWeek = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;

                if (cycleDayOrWeek > (u.settings.cycleLength + 5)) status = 'alert';
            } else if (u.settings.mode === 'PREGNANCY' && u.settings.pregnancyDueDate) {
                const due = new Date(u.settings.pregnancyDueDate);
                const conception = new Date(due);
                conception.setDate(conception.getDate() - 280); // -40 semaines
                const diff = now.getTime() - conception.getTime();
                cycleDayOrWeek = Math.floor(diff / (1000 * 60 * 60 * 24) / 7);
            }

            // Détection Inactivité (> 30 jours)
            const inactiveLimit = 30 * 24 * 60 * 60 * 1000;
            if ((now.getTime() - new Date(u.lastActiveAt).getTime()) > inactiveLimit) {
                status = 'inactive';
            }

            return {
                id: u._id,
                name: u.name,
                age: u.age,
                mode: u.settings.mode,
                status: status,
                lastActive: new Date(u.lastActiveAt).toLocaleDateString(),
                cycleDayOrWeek: cycleDayOrWeek,
                symptomCountLastWeek: 0 // Non affiché dans le tableau Frontend, on laisse à 0 pour perf
            };
        });

        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;