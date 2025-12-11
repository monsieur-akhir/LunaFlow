/**
 * API SERVICE CLIENT
 * Ce fichier est destiné à remplacer les appels directs ou mocks 
 * une fois le backend (dossier /backend) lancé.
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Helper pour les headers avec (simulation) Auth
const getHeaders = (userId: string) => ({
    'Content-Type': 'application/json',
    'x-user-id': userId // Dans un vrai cas : 'Authorization': `Bearer ${token}`
});

// --- USER ---

export const fetchUserProfile = async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/user/me`, {
        headers: getHeaders(userId)
    });
    return res.json();
};

export const updateUserSettings = async (userId: string, settings: any) => {
    const res = await fetch(`${API_BASE_URL}/user/settings`, {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(settings)
    });
    return res.json();
};

export const updateUserMedical = async (userId: string, medicalData: any) => {
    const res = await fetch(`${API_BASE_URL}/user/medical`, {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(medicalData)
    });
    return res.json();
};

// --- LOGS ---

export const fetchLogs = async (userId: string) => {
    const res = await fetch(`${API_BASE_URL}/logs`, {
        headers: getHeaders(userId)
    });
    return res.json();
};

export const saveLog = async (userId: string, logData: any) => {
    const res = await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(logData)
    });
    return res.json();
};

// --- PARTNER ---

export const pairWithPartner = async (userId: string, code: string) => {
    const res = await fetch(`${API_BASE_URL}/partner/pair`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ code })
    });
    return res.json();
};

export const sendPartnerNotification = async (userId: string, type: string, message: string) => {
    const res = await fetch(`${API_BASE_URL}/partner/notify`, {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ type, message })
    });
    return res.json();
};