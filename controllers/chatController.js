// controllers/chatController.js
import axios from 'axios';
import Chat from '../models/Chat.js';
import Groq from 'groq-sdk';  

const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = (language) => ({
    role: 'system',
    content: `You are a helpful assistant for an Indian user authentication platform.
Help users with account issues, OTP problems, profile updates, and general queries.
Respond in the same language the user writes in.
Be concise and friendly. Language preference: ${language}.`,
});

//  ── Sarvam AI call ────────────────────────────────────────────
const callSarvam = async (messages) => {
    const response = await axios.post(
        SARVAM_API_URL,
        {
            model:            'sarvam-30b',
            messages,
            max_tokens:       300,
            temperature:      0.2,
            reasoning_effort: null,
        },
        {
            headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type':         'application/json',
            },
        }
    );
    const msg = response.data.choices[0].message;
    return msg.content || msg.reasoning_content || 'Hello! How can I help you?';
};
 
// ── Groq AI call ──────────────────────────────────────────────
const callGroq = async (messages) => {
    const response = await groq.chat.completions.create({
        model:       'llama3-8b-8192', // fast & free
        messages,
        max_tokens:  500,
        temperature: 0.7,
    });
    return response.choices[0]?.message?.content || 'Hello! How can I help you?';
};
// POST /api/chat
// Body: { message, language, chatId? }
export const sendMessage = async (req, res) => {
    try {
        const { message, language = 'en-IN', chatId } = req.body;
        const userId = req.user.id;
 
        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, error: 'Message is required.' });
        }
 
        // Load existing chat or create new one
        let chatDoc;
        if (chatId) {
            chatDoc = await Chat.findOne({ _id: chatId, userId });
            if (!chatDoc) return res.status(404).json({ success: false, error: 'Chat not found.' });
        } else {
            chatDoc = new Chat({ userId, title: 'New Chat', messages: [] });
        }
 
        const newUserMsg = { role: 'user', content: message };
        chatDoc.messages.push(newUserMsg);
 
        // Auto-generate title from first user message (max 40 chars)
        if (chatDoc.messages.filter(m => m.role === 'user').length === 1) {
            chatDoc.title = message.length > 40 ? message.slice(0, 40) + '…' : message;
        }
 
        const messagesForAPI = [
            systemPrompt(language),
            ...chatDoc.messages.slice(-20),
        ];

        let reply;
        let modelUsed;

        if(aiModel === 'groq') {
            reply = await callGroq(messagesForAPI);
            modelUsed = 'Groq (llama3-8b)';
        } else {
            reply = await callSarvam(messagesForAPI);
            modelUsed = 'Sarvam (sarvam-30b)';
        }
        chatDoc.messages.push({ role: 'assistant', content: reply });
 
        // Keep last 100 messages per chat
        if(chatDoc.messages.length > 100) {
            chatDoc.messages = chatDoc.messages.slice(-100);
        }
        await chatDoc.save();

        return res.status(200).json({
            success: true,
            reply,
        chatId: chatDoc._id,
        title:  chatDoc.title,
        history: chatDoc.messages,
        model: modelUsed,
        });
 
        
 
    } catch (error) {
        console.error('Chat Error:', {
            message: error.message,
            status: error?.response?.status,
            data: error?.response?.data,
        });
        return res.status(500).json({
            success: false,
            error: error?.response?.data?.error?.message || error.message || 'Chat service unavailable.',
        });
    }
};
 

// // GET /api/chat/sessions — list all chat sessions for user
export const getSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await Chat.find({ userId })
            .select('_id title createdAt updatedAt messages aiModel')
            .sort({ updatedAt: -1 });
 
        // Return sessions with preview of last message
        const result = sessions.map((s) => ({
            _id:       s._id,
            title:     s.title,
            preview:   s.messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '',
            msgCount:  s.messages.length,
            aiModel:   s.aiModel || 'Sarvam (sarvam-30b)',
            updatedAt: s.updatedAt,
            createdAt: s.createdAt,
        }));
 
        return res.status(200).json({ success: true, sessions: result });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/chat/:chatId — load a specific chat session
export const getSession = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        const chatDoc = await Chat.findOne({ _id: chatId, userId });
        if (!chatDoc) 
            return res.status(404).json({ success: false, error: 'Chat not found.' });

        return res.status(200).json({ success: true, chat: chatDoc });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
 
// DELETE /api/chat/:chatId — delete a specific chat session
export const deleteSession = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user.id;
        await Chat.findOneAndDelete({ _id: chatId, userId });
        return res.status(200).json({ success: true, message: 'Chat deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
 
// DELETE /api/chat/clear/all — delete all chats for user
export const clearAll = async (req, res) => {
    try {
        const userId = req.user.id;
        await Chat.deleteMany({ userId });
        return res.status(200).json({ success: true, message: 'All chats cleared.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};