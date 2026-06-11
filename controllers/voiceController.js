// controllers/voiceController.js
import axios from 'axios';
import FormData from 'form-data';
import 'dotenv/config';

const SARVAM_KEY = process.env.SARVAM_API_KEY;

// POST /api/voice/transcribe
export const transcribe = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Audio file required.' });
        }

        const language = req.body.language || 'hi-IN';

        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename:    'audio.webm',
            contentType: req.file.mimetype || 'audio/webm',
        });
        form.append('model', 'saaras:v3');        // ✅ latest model
        form.append('mode',  'transcribe');        // transcribe | translate | verbatim
        form.append('language_code', language);

        const response = await axios.post(
            'https://api.sarvam.ai/speech-to-text',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'api-subscription-key': SARVAM_KEY,
                },
            }
        );

        const transcript = response.data?.transcript || '';
        return res.status(200).json({ success: true, transcript });

    } catch (error) {
        console.error('STT Error:', error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error?.response?.data?.error?.message || 'Transcription failed.',
        });
    }
};

// POST /api/voice/speak
export const speak = async (req, res) => {
    try {
        const { text, language = 'hi-IN', speaker = 'anushka' } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, error: 'Text required.' });
        }

        const response = await axios.post(
            'https://api.sarvam.ai/text-to-speech',
            {
                inputs:               [text.slice(0, 500)],
                target_language_code: language,
                speaker,
                model:                'bulbul:v2',
                enable_preprocessing: true,
            },
            {
                headers: {
                    'api-subscription-key': SARVAM_KEY,
                    'Content-Type':         'application/json',
                },
            }
        );

        const audio = response.data?.audios?.[0] || '';
        return res.status(200).json({ success: true, audio });

    } catch (error) {
        console.error('TTS Error:', error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            error: error?.response?.data?.error?.message || 'Speech synthesis failed.',
        });
    }
};