// routes/chatRoutes.js
import express from 'express';
import {
    sendMessage,
    getSessions,
    getSession,
    deleteSession,
    clearAll,
} from '../controllers/chatController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/',                sendMessage);    // send message (chatId optional in body)
router.get('/sessions',         getSessions);   // list all sessions
router.get('/:chatId',          getSession);    // load a session
router.delete('/clear/all',     clearAll);      // delete all sessions
router.delete('/:chatId',       deleteSession); // delete one session

export default router;