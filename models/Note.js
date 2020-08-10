const { Schema, model } = require('mongoose');

const noteSchema = new Schema({
    text: { type: String, require: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required:true },
    board: { type: Schema.Types.ObjectId, ref: 'Board', required:true },
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true },
});

module.exports = model('Note', noteSchema);