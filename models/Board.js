const { Schema, model } = require('mongoose');

const boardSchema = new Schema({
    name: { type: String, require: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required:true},
    notes: [{ type: Schema.Types.ObjectId, ref: 'Note'}],
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true },
});

module.exports = model('Board', boardSchema);