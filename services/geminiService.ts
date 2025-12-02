import { GoogleGenAI } from "@google/genai";
import { AppMode, UserSettings, MedicalData } from "../types";
import { getCycleDay, getPregnancyWeek, getFertilityStatus } from "../utils/dateUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDailyInsight = async (
  settings: UserSettings,
  symptoms: string[],
  mood: string,
  sexualActivity: boolean,
  libido: string,
  contraceptiveTaken: boolean,
  medicalData: MedicalData
): Promise<{ title: string; content: string }> => {
  try {
    let context = "";
    
    // --- CONTEXTE CYCLE / GROSSESSE ---
    if (settings.mode === AppMode.CYCLE) {
      const cycleDay = getCycleDay(settings.lastPeriodDate);
      const fertility = getFertilityStatus(settings.lastPeriodDate, settings.cycleLength);
      
      context = `L'utilisatrice est au jour ${cycleDay} de son cycle. Statut fertilité: ${fertility.label}.`;
      
      if (settings.isTryingToConceive) {
        context += " Elle essaie de concevoir. ";
        if (medicalData.folicAcidTaken) context += "Elle a bien pris son acide folique (très important). ";
        else context += "Rappelle-lui l'importance de l'acide folique pour la conception. ";
      } else if (settings.usesContraception) {
        context += ` Elle utilise une contraception. ${contraceptiveTaken ? "Prise OK." : "Non prise aujourd'hui (attention)."} `;
      }
    } else {
      const week = settings.pregnancyDueDate ? getPregnancyWeek(settings.pregnancyDueDate) : 0;
      context = `L'utilisatrice est enceinte de ${week} semaines.`;
      
      // Analyse basique HCG
      if (medicalData.betaHCG) {
        context += ` Dernier taux Beta HCG: ${medicalData.betaHCG} mIU/mL. Si c'est cohérent avec la semaine ${week}, rassure-la. `;
      }
      
      if (medicalData.folicAcidTaken) {
        context += "Acide folique pris (Bon point). ";
      } else {
        context += "Rappel doux: Acide folique important au premier trimestre. ";
      }

      if (medicalData.nextEchoDate) {
        context += `Prochaine échographie prévue le ${medicalData.nextEchoDate}. Dis-lui que c'est une rencontre magique. `;
      }
    }

    const symptomStr = symptoms.length > 0 ? `Symptômes: ${symptoms.join(", ")}.` : "Aucun symptôme physique.";
    const moodStr = mood ? `Humeur: ${mood}.` : "";
    const sexStr = sexualActivity ? "Rapport sexuel: Oui." : "";
    const libidoStr = `Libido: ${libido}.`;
    const partnerStr = settings.partnerName ? `Partenaire: ${settings.partnerName} (${settings.isConnectedToPartner ? 'Compte lié' : 'Non lié'}).` : "";

    const prompt = `
      Agis comme une coach experte en périnatalité, gynécologie et vie de couple. Ton ton est chaleureux, rassurant et court.
      
      CONTEXTE MEDICAL & UTILISATEUR:
      ${context}
      ${symptomStr} ${moodStr} ${sexStr} ${libidoStr}
      ${partnerStr}

      Tâche: Génère un titre court (max 5 mots) et un conseil (max 40 mots).
      
      Directives Spécifiques:
      1. Si un taux HCG est mentionné, explique brièvement ce qu'il signifie (doublement toutes les 48h au début) sans faire de diagnostic.
      2. Si Acide Folique non pris (et essai bébé ou grossesse < 12 SA), rappelle son importance pour le tube neural.
      3. Si compte lié avec partenaire, suggère une interaction (partager l'écho, parler du prénom).
      4. Si fertilité haute, encourage l'amour.

      Réponds UNIQUEMENT en JSON:
      {
        "title": "Titre ici",
        "content": "Conseil ici"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "Bienvenue sur LunaFlow",
      content: "Prenez un moment pour mettre à jour vos données de santé pour des conseils personnalisés."
    };
  }
};