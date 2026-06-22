import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    // pageNumber: { type: Number, required: true },
    // index: { type: Number, required: true },
});

const chatHistorySchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const pdfDocumentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    chunks: [chunkSchema],
    chatHistory: [chatHistorySchema],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('PdfDocument', pdfDocumentSchema);