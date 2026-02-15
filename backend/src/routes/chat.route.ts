import { Router } from 'express';
import { chatWithBot } from '../controllers/chat.controller';

const router = Router();

router.post('/', chatWithBot);

export default router;
