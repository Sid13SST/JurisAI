import { Router } from 'express';
import {
  indexContract,
  sendMessage,
  listSessions,
  listMessages,
  deleteSession
} from '../controllers/chatController';

const router = Router();

router.post('/index/:contractId', indexContract);
router.post('/message', sendMessage);
router.get('/sessions/:contractId', listSessions);
router.get('/messages/:sessionId', listMessages);
router.delete('/sessions/:sessionId', deleteSession);

export default router;
