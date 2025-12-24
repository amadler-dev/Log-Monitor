const mongoose = require('mongoose');

const LogEntrySchema = new mongoose.Schema({
    type: { type: String, required: false },
    timestamp: { type: Date, default: Date.now },
    userAgent: { type: String },
    url: { type: String },
    elementId: { type: String },
    elementText: { type: String },
    duration: { type: Number },
    page: { type: String },
    event: { type: String },
    screenResolution: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed } // Catch-all for other fields
}, { strict: false }); // Allow flexible schema

module.exports = mongoose.model('LogEntry', LogEntrySchema);
