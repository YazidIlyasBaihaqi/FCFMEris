const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userID: String,
    punishment: { type: Number, default: 0} 
});

module.exports = new mongoose.model('Player', playerSchema, 'informations');
