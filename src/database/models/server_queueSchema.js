const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
    songs: []
});

module.exports = new mongoose.model('SQueue', serverSchema, 'server_queue');