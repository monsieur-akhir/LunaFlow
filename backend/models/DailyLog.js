const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { 
    type: String, 
    required: true 
  }, // Format YYYY-MM-DD
  symptoms: [String],
  mood: String,
  flow: { type: String, enum: ['light', 'medium', 'heavy', null] },
  sexualActivity: { type: Boolean, default: false },
  contraceptiveTaken: { type: Boolean, default: false },
  libido: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  createdAt: { type: Date, default: Date.now }
});

// Index composé : Un utilisateur ne peut avoir qu'un seul log par date unique
DailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);