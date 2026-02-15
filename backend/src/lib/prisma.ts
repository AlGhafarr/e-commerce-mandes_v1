import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Fungsi helper untuk menulis log
const writeLog = (model: string, action: string, data: any) => {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Pastikan folder logs ada (di dalam container)
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const fileName = `data_changes.jsonl`; // .jsonl (JSON Lines) lebih efisien untuk log
  const filePath = path.join(logDir, fileName);

  const logEntry = {
    timestamp: new Date().toISOString(),
    model,
    action,
    data,
  };

  // Append (tambahkan) baris baru ke file log
  fs.appendFile(filePath, JSON.stringify(logEntry) + '\n', (err) => {
    if (err) console.error('Gagal menulis log:', err);
  });
};

const prismaClient = new PrismaClient();

// --- EXTENSION UNTUK LOGGING REALTIME ---
const prisma = prismaClient.$extends({
  query: {
    $allModels: {
      async create({ model, args, query }) {
        const result = await query(args);
        writeLog(model, 'CREATE', result); // Log setelah sukses
        return result;
      },
      async update({ model, args, query }) {
        const result = await query(args);
        writeLog(model, 'UPDATE', result);
        return result;
      },
      async delete({ model, args, query }) {
        const result = await query(args);
        writeLog(model, 'DELETE', result);
        return result;
      },
      async upsert({ model, args, query }) {
        const result = await query(args);
        writeLog(model, 'UPSERT', result);
        return result;
      },
    },
  },
});

export default prisma; // Export instance yang sudah di-extend