import { UserSettings, MedicalData } from "../types";

// Note: Les arguments sont conservés pour compatibilité avec l'appelant dans App.tsx
// mais la plupart ne sont plus utilisés ici car le backend les récupère directement de la BDD.
// Seul le JWT (via localStorage ou contexte) est nécessaire pour l'authentification.

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
    // Récupération du token (Stocké dans localStorage lors du login)
    // Assurez-vous que votre App.tsx stocke bien le token sous 'lunaflow_token' ou dans l'objet user
    const savedData = localStorage.getItem('lunaflow_user_data_v1');
    let token = "";
    
    // Fallback: Si on est en mode "Full Stack", le token devrait être géré par un AuthContext.
    // Pour cet exemple hybride, on suppose que vous avez stocké le token quelque part.
    // Si l'app est purement frontend pour l'instant, cette méthode échouera sans backend qui tourne.
    
    // Simulation pour l'instant si pas de token réel :
    // Dans une vraie implémentation, récupérez le token depuis votre AuthContext
    const tokenFromStorage = localStorage.getItem('token'); 
    if (tokenFromStorage) token = tokenFromStorage;

    const response = await fetch('http://localhost:5000/api/ai/insight', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!response.ok) {
        // Si le backend n'est pas dispo ou erreur 401, fallback local
        throw new Error("Backend AI unreachable");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.warn("Switching to offline/fallback mode for Insight:", error);
    
    // Fallback Local basique (si pas internet ou pas de backend)
    return {
      title: "Bienvenue sur LunaFlow",
      content: "Impossible de joindre l'assistant pour le moment, mais je suis là pour suivre votre cycle."
    };
  }
};