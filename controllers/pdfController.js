import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// console.log('pdfParseLib:', pdfParseLib);           // 👈 see what it returns
// console.log('type:', typeof pdfParseLib);           // 👈 object or function?
// console.log('keys:', Object.keys(pdfParseLib));     // 👈 see available keys


import PdfDocument from '../models/PdfDocument.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const splitIntochunks = (text, chunkSize = 1000) => {
    const sentences = text.split(/[.!?]+/);
    const chunks = [];
    let current = '';
    let index = 0;

    for (const sentence of sentences) {
        if ((current + sentence).length > chunkSize) {
            if (current.trim()) {
                chunks.push({ text: current.trim(), index: index++ });

            }
            current = sentence;
        } else {
            current += ' ' + sentence;
        }
    }
    if (current.trim()) {
        chunks.push({ text: current.trim(), index: index++ });
    }
    return chunks;
}

// helper : find relevent chunks

const findRelevantChunks = (chunks, question, topK = 5) => {
    const questionWords = question.toLowerCase().split(' ')
        .filter(word => word.length > 1);

    const scored = chunks.map(chunk => {
        const chunkLower = chunk.text.toLowerCase();
        const score = questionWords.reduce((acc, word) => {
            return acc + (chunkLower.includes(word) ? 1 : 0);
        }, 0);
        return { ...chunk, score };
    });
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(chunk => chunk.score > 0);
};

// ── POST /api/pdf/upload 

export const uploadPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }
        // const data = await pdfParse(req.file.buffer);
        // const text = data.text;
        const parsed = await pdfParse(req.file.buffer);
const text = parsed.text;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Uploaded PDF is empty or unreadable.' });
        }
        const chunks = splitIntochunks(text);

        await PdfDocument.deleteMany({ userId: req.user.id });

        const doc = await PdfDocument.create({
            userId: req.user.id,
            filename: req.file.originalname,
            chunks,
        });
        return res.status(201).json({
            success: true,
            document: doc,
            filename: req.file.originalname,
            chunks: chunks.length,
            docId: doc._id,
        });

    } catch (error) {
        console.error('PDF Upload Error:', error);
        return res.status(500).json({ success: false, error: 'Failed to process PDF' });
    }
};

// ── POST /api/pdf/chat 
export const chatWithPdf = async (req, res) => {
    try {
        const { question, docId } = req.body;
        if (!question || !docId) {
            return res.status(400).json({ success: false, error: 'Question and document ID are required.' });
        }
        const query = docId
            ? { _id: docId, userId: req.user.id }
            : { userId: req.user.id };

        const doc = await PdfDocument.findOne(query).sort({ createdAt: -1 });

        if (!doc) {
            return res.status(404).json({ success: false, error: 'No PDF document found for this user.' });
        }

        const allChunks = doc.chunks.map(c => c.toObject());

        const relevantChunks = findRelevantChunks(allChunks, question);
        // if (releventChunks.length === 0) {
        //     return res.status(200).json({
        //         success: true,
        //         answer: 'I could not find relevant information in the PDF for your question.',
        //         chunks: [],
        //     });
        // }
        // Fallback: if no chunks matched, use ALL chunks
const chunksToUse = relevantChunks.length > 0 ? relevantChunks : allChunks;

//  👇 ADD THESE DEBUG LINES
console.log('Total chunks:', doc.chunks.length);
console.log('Question:', question);
console.log('Relevant chunks found:', relevantChunks.length);
console.log('First chunk text:', doc.chunks[0]?.text?.substring(0, 200));

        const context = chunksToUse.map(c => c.text).join('\n\n');

        console.log('First relevantChunk:', JSON.stringify(relevantChunks[0]));
console.log('First doc.chunk:', JSON.stringify(doc.chunks[0]));         // debug

        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',  // Fast, free Groq model
            messages: [
                {
                    role: 'system',
                    content: `You are a helpful assistant. 
                                       Answer questions based ONLY on the following PDF content:

                     ${context}

                    If the answer is not in the content, say "I cannot find this information in the PDF."`
                },
                {
                    role: 'user',
                    content: question
                }
            ]
        });

        const answer = response.choices?.[0]?.message?.content || 'No answer found';

        return res.json({
            success: true,
            answer,
            filename: doc.filename,
            chunks: chunksToUse.map(c => c.text),
        });

    } catch (error) {
        console.error('PDF chat error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to process PDF chat' });

    }
};

// ── GET /api/pdf/list ─

export const listPdfs = async (req, res) => {
    try {
        const docs = await PdfDocument.find({ userId: req.user.id }).select('filename createdAt chunks').sort({ createdAt: -1 });

        return res.json({
            success: true,
            docs: docs.map(d => ({
                id: d._id,
                filename: d.filename,
                chunks: d.chunks.length,
                uploadedAt: d.createdAt,
            }))
        });
    } catch (error) {
        console.error('PDF list error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to fetch PDF documents' });
    }
};

// ── DELETE /api/pdf/:id ──────────────────────────────────────
export const deletePdf = async (req, res) => {
    try {
        await PdfDocument.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        })
        return res.json({
            success: true,
            message: 'PDF document deleted successfully.'
        })
    } catch (error) {
        console.error('PDF delete error:', error.message);
        return res.status(500).json({ success: false, error: 'Failed to delete PDF document' });
    }
};