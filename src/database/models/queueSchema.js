const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
    song: [],
});

module.exports = new mongoose.model('Queue', queueSchema, 'queues');