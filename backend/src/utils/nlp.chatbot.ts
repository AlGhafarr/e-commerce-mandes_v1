import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Types for our data
interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    description: string;
    flavor_profile: string;
}

interface ShopInfo {
    shop_name: string;
    operational_hours: string;
    shipping_policy: {
        couriers: string[];
        processing_time: string;
        free_shipping: string;
    };
    ordering_guide: string;
    faq: { q: string; a: string }[];
}

export class SnackBot {
    private products: Product[] = [];
    private shopInfo: ShopInfo | null = null;
    private ollamaUrl: string;
    private modelName: string;

    constructor(
        ollamaUrl: string = 'http://127.0.0.1:11434',
        modelName: string = 'qwen:14b' // Default to a reasonable size qwen model
    ) {
        this.ollamaUrl = ollamaUrl;
        this.modelName = modelName;
        this.loadData();
    }

    private loadData() {
        try {
            // Adjusted path for src/utils/nlp.chatbot.ts -> src/data/
            const productsPath = path.join(__dirname, '../../data/products.json');
            const shopInfoPath = path.join(__dirname, '../../data/shop_info.json');

            // Fallback for different execution contexts if needed (e.g. dist/)
            // But usually ../../data works if structure is preserved

            if (fs.existsSync(productsPath)) {
                const productsRaw = fs.readFileSync(productsPath, 'utf-8');
                this.products = JSON.parse(productsRaw);
            } else {
                console.error(`Product data not found at ${productsPath}`);
            }

            if (fs.existsSync(shopInfoPath)) {
                const shopInfoRaw = fs.readFileSync(shopInfoPath, 'utf-8');
                this.shopInfo = JSON.parse(shopInfoRaw);
            } else {
                console.error(`Shop info not found at ${shopInfoPath}`);
            }

            console.log('✅ Knowledge base loaded successfully.');
        } catch (error) {
            console.error('❌ Error loading knowledge base:', error);
        }
    }

    private buildSystemPrompt(): string {
        if (!this.shopInfo) return '';

        // Create a compact product list string
        const productList = this.products.map(p =>
            `- ${p.name} (ID: ${p.id}): Rp ${p.price}. Stok: ${p.stock}. Rasa: ${p.flavor_profile}. Deskripsi: ${p.description}`
        ).join('\n');

        // Create a compact FAQ list
        const faqList = this.shopInfo.faq.map(f => `Q: ${f.q} A: ${f.a}`).join('\n');

        return `
You are a friendly and helpful AI customer service assistant for "${this.shopInfo.shop_name}".
Your goal is to assist customers with product inquiries, shipping information, and recommendations.

Here is the context about the shop:

[INVENTORY / PRODUCTS]
${productList}

[OPERATIONAL INFO]
- Hours: ${this.shopInfo.operational_hours}
- Shipping Couriers: ${this.shopInfo.shipping_policy.couriers.join(', ')}
- Processing Time: ${this.shopInfo.shipping_policy.processing_time}
- Free Shipping Rule: ${this.shopInfo.shipping_policy.free_shipping}

[ORDERING GUIDE]
${this.shopInfo.ordering_guide}

[FAQ / KNOWLEDGE BASE]
${faqList}

[INSTRUCTIONS]
1. Answer in Indonesian (Bahasa Indonesia) in a polite and friendly tone.
2. If a customer asks for a recommendation, use the "Rasa" (Flavor Profile) and "Deskripsi" to suggest suitable products.
3. Check stock availability. If stock is 0, say it is out of stock (habis).
4. Do NOT make up products that are not in the list.
5. Be concise but informative.
6. If the user asks about shipping or ordering, refer to the [OPERATIONAL INFO] and [ORDERING GUIDE].
    `.trim();
    }

    public async chat(userMessage: string): Promise<string> {
        const systemPrompt = this.buildSystemPrompt();

        // We use the "generate" endpoint for single-turn or "chat" for multi-turn.
        // Since we are building a simple interface, we'll effectively use a "chat" structure 
        // where we prepend the system prompt as the first message or system instructions.

        // Using the /api/chat endpoint of Ollama
        try {
            const response = await axios.post(`${this.ollamaUrl}/api/chat`, {
                model: this.modelName,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                stream: false // For simplicity in this demo, we disable streaming
            });

            if (response.data && response.data.message && response.data.message.content) {
                return response.data.message.content;
            } else {
                return "Maaf, saya sedang mengalami gangguan. Silakan coba lagi.";
            }

        } catch (error: any) {
            console.error("Error communicating with Ollama:", error.message);
            if (error.code === 'ECONNREFUSED') {
                return "Maaf, saya tidak dapat terhubung ke server AI (Ollama). Pastikan Ollama sudah berjalan.";
            }
            return "Maaf, terjadi kesalahan pada sistem.";
        }
    }
}
