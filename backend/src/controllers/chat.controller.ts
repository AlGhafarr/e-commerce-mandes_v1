import { Request, Response } from 'express';
import { SnackBot } from '../utils/nlp.chatbot';

const bot = new SnackBot(
    process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
    process.env.OLLAMA_MODEL || 'qwen:14b'
);

export const chatWithBot = async (req: Request, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log(`[Chat] User asks: ${message}`);
        const response = await bot.chat(message);
        console.log(`[Chat] Bot replies: ${response}`);

        return res.status(200).json({ response });
    } catch (error) {
        console.error("Chat Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
