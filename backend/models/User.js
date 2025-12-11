const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Note: On a retiré DailyLogSchema d'ici car c'est maintenant un modèle séparé

// Schéma Utilisatrice Principal
const UserSchema = new mongoose.Schema({
  // Identité
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true }, 
  password: { type: String }, 
  age: Number,
  partnerName: String,
  
  // Paramètres Application & Profil étendu
  settings: {
    mode: { type: String, enum: ['CYCLE', 'PREGNANCY'], default: 'CYCLE' },
    lastPeriodDate: Date,
    cycleLength: { type: Number, default: 28 },
    pregnancyDueDate: Date,
    
    // Suivi Fertilité
    isTryingToConceive: Boolean,
    tryingDuration: String, 
    
    // Vie privée & Famille
    relationshipStatus: { type: String, enum: ['single', 'couple', 'married'] },
    hasChildren: Boolean,
    
    // Contraception
    usesContraception: Boolean,
    
    // Fonctionnalités App
    pairingCode: String,
    isConnectedToPartner: { type: Boolean, default: false },
    hasCompletedOnboarding: { type: Boolean, default: false },
    
    // Sécurité & Préférences
    pinCode: String,
    enableNotifications: { type: Boolean, default: true }
  },

  // Données Médicales (Restent ici car peu volumineuses et uniques)
  medicalData: {
    betaHCG: Number,
    lastHCGDate: Date,
    nextEchoDate: String,
    folicAcidTaken: Boolean
  },

  // Méta-données système
  createdAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now }
});

// Hachage du mot de passe
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
  }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtuals
UserSchema.virtual('status').get(function() {
  if (this.settings.mode === 'PREGNANCY') return 'active';
  
  const today = new Date();
  const lastPeriod = new Date(this.settings.lastPeriodDate);
  const diffTime = Math.abs(today - lastPeriod);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > (this.settings.cycleLength + 5)) {
      return 'alert';
  }
  
  const inactiveDays = Math.ceil(Math.abs(today - this.lastActiveAt) / (1000 * 60 * 60 * 24));
  if (inactiveDays > 30) return 'inactive';

  return 'active';
});

module.exports = mongoose.model('User', UserSchema);