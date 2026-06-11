// models/Chat.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    role:    { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
}, { _id: false });

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            // unique: true,   // one chat doc per user
        },
       title:    { type: String, default: 'New Chat' },  // auto-generated from first message
        messages: [messageSchema],
        active:   { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);