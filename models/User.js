const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    boards: [{type:Schema.Types.ObjectId, ref:'Board'}],
    notes: [{ type: Schema.Types.ObjectId, ref: 'Notes'}],
    created_at: { type: String, required: true },
    updated_at: { type: String, required: true },
});

module.exports = model('User', userSchema);