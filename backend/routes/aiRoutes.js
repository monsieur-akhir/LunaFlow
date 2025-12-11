const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const DailyLog = require('../models/DailyLog');
const { protect } = require('../middleware/auth');
const { getCycleDay, getDelayDays, getFertilityStatus, getPregnancyWeek } = require('../utils/businessLogic');

// Initialisation Gemini Server-Side
// Assurez-vous que process.env.GEMINI_API_KEY est défini dans votre fichier .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET /api/ai/insight
// Génère un conseil personnalisé basé sur les données en base
router.get('/insight', protect, async (req, res) => {
    try {
        const user = req.user;
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Récupérer le log du jour s'il existe
        const todayLog = await DailyLog.findOne({ user: user._id, date: todayStr });

        // Préparation du contexte pour l'IA
        let context = "";
        const symptoms = todayLog ? todayLog.symptoms : [];
        const mood = todayLog ? todayLog.mood : "";
        const sexualActivity = todayLog ? todayLog.sexualActivity : false;
        
        // --- LOGIQUE MÉTIER APPLIQUÉE ---
        if (user.settings.mode === 'CYCLE') {
            const cycleDay = getCycleDay(user.settings.lastPeriodDate);
            const daysLate = getDelayDays(user.settings.lastPeriodDate, user.settings.cycleLength);
            const fertility = getFertilityStatus(user.settings.lastPeriodDate, user.settings.cycleLength);

            if (daysLate > 0) {
                context = `ALERT: L'utilisatrice a un RETARD de règles de ${daysLate} jours (Jour du cycle ${cycleDay}). `;
                if (daysLate > 5) context += "Le retard est significatif. Suggère un test de grossesse avec douceur. ";
            } else {
                context = `L'utilisatrice est au jour ${cycleDay} de son cycle. Statut fertilité: ${fertility.label}.`;
            }

            if (user.settings.isTryingToConceive) {
                context += " Elle essaie de concevoir. ";
                if (user.medicalData.folicAcidTaken) context += "Elle a pris son acide folique. ";
            } else if (user.settings.usesContraception) {
                // Logique simplifiée ici, on pourrait ajouter la prise du jour si dispo
                context += ` Elle utilise une contraception. `;
            }

        } else if (user.settings.mode === 'PREGNANCY') {
            const week = getPregnancyWeek(user.settings.pregnancyDueDate);
            context = `L'utilisatrice est enceinte de ${week} semaines.`;
            if (user.medicalData.betaHCG) {
                context += ` Dernier taux Beta HCG connu: ${user.medicalData.betaHCG}. `;
            }
        }

        const symptomStr = symptoms.length > 0 ? `Symptômes du jour: ${symptoms.join(", ")}.` : "Aucun symptôme noté.";
        const moodStr = mood ? `Humeur: ${mood}.` : "";
        
        // --- PROMPT ENGINEERING ---
        const prompt = `
            Agis comme une gynécologue bienveillante et rassurante pour l'application LunaFlow.
            
            DONNÉES UTILISATRICE:
            Prénom: ${user.name}
            Contexte Clinique: ${context}
            État du jour: ${symptomStr} ${moodStr} ${sexualActivity ? "Rapport sexuel aujourd'hui." : ""}
            
            TACHE: Génère un conseil court et personnalisé en JSON.
            
            Directives:
            1. Ton empathique et pro.
            2. Si retard > 5 jours: Suggère test grossesse.
            3. Si symptômes SPM: Conseils confort.
            4. Si enceinte: Focus développement bébé ou santé maman.
            
            FORMAT DE REPONSE ATTENDU (JSON pur):
            {
                "title": "Titre court (max 5 mots)",
                "content": "Conseil (max 40 mots)"
            }
        `;

        // Appel Gemini
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        // Extraction et nettoyage
        const text = response.text;
        // Par sécurité, on essaie de parser, sinon fallback
        try {
            const jsonInsight = JSON.parse(text);
            res.json(jsonInsight);
        } catch (e) {
            console.error("AI Parse Error", text);
            res.json({
                title: `Bonjour ${user.name}`,
                content: "Prenez soin de vous aujourd'hui. Écoutez votre corps."
            });
        }

    } catch (err) {
        console.error("AI Route Error:", err);
        // Fallback gracieux en cas de panne IA
        res.json({
            title: "Conseil du jour",
            content: "L'analyse est momentanément indisponible, mais n'oubliez pas de vous hydrater !"
        });
    }
});

module.exports = router;