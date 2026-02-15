const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode');
const pino = require('pino');

const app = express();
// Menggunakan port 6521 sesuai setup Anda
const port = process.env.PORT || 6521;

app.use(express.json());

let sock;
let qrString = null;
let isConnected = false;

// Fungsi Utama Koneksi WA
async function connectToWhatsApp() {
    // Menggunakan folder auth_info_baileys untuk menyimpan sesi
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Tampilkan QR di terminal juga
        logger: pino({ level: 'fatal' }), // Hanya log error fatal agar terminal bersih
        browser: ["Ubuntu", "Chrome", "22.0.04"], // Menyamar sebagai Linux Desktop
        // Konfigurasi agar koneksi lebih bandel (tidak gampang putus)
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        retryRequestDelayMs: 250
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrString = qr;
            isConnected = false;
            console.log('⚠️ QR Code baru diterima. Silakan scan ulang jika belum terhubung.');
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            
            // Logika Reconnect Pintar
            if (reason === DisconnectReason.badSession) {
                console.log('❌ File Sesi Rusak. Hapus folder auth dan scan ulang.');
                sock.logout();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log('❌ Perangkat dikeluarkan dari HP. Hapus folder auth dan scan ulang.');
                isConnected = false;
                qrString = null;
            } else {
                // Untuk alasan lain (TimeOut, ConnectionLost, dll), sambung ulang otomatis!
                console.log(`⚠️ Koneksi terputus (${reason}). Menyambung ulang otomatis...`);
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Berhasil terhubung ke WhatsApp!');
            qrString = null;
            isConnected = true;
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Jalankan koneksi
connectToWhatsApp();

// ================= API ENDPOINTS =================

// 1. Endpoint QR Code
app.get('/qr', async (req, res) => {
    if (isConnected) return res.send('<h2 style="color:green">WhatsApp Terhubung! ✅</h2>');
    if (!qrString) return res.send('<h2>Menunggu QR Code... (Refresh 3 detik lagi)</h2><meta http-equiv="refresh" content="3">');

    try {
        const qrImage = await QRCode.toDataURL(qrString);
        res.send(`
            <meta http-equiv="refresh" content="20">
            <div style="text-align:center; font-family:sans-serif;">
                <h2>Scan QR Code</h2>
                <img src="${qrImage}" style="border:1px solid #ccc; padding:10px; border-radius:10px;"/>
                <p>Refresh otomatis setiap 20 detik</p>
                <p style="color:red">Jika scan gagal, hapus folder 'auth_info_baileys' dan restart server.</p>
            </div>
        `);
    } catch (err) {
        res.status(500).send('Error Generate QR');
    }
});

// 2. Endpoint Kirim Pesan (VERSI STABIL)
app.post('/send-message', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: 'Parameter number dan message wajib diisi' });
    }

    try {
        // Formatting Nomor HP (08xx -> 628xx)
        let formattedNumber = number.toString().replace(/\D/g, ''); // Hapus karakter non-angka
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '62' + formattedNumber.slice(1);
        }
        if (!formattedNumber.endsWith('@s.whatsapp.net')) {
            formattedNumber += '@s.whatsapp.net';
        }

        // --- PENTING: Langsung kirim tanpa cek nomor ---
        // Menghapus onWhatsApp check mencegah disconnect tiba-tiba
        const sentMsg = await sock.sendMessage(formattedNumber, { text: message });
        
        res.json({ status: true, message: 'Pesan berhasil dikirim', data: sentMsg });

    } catch (error) {
        console.error("Gagal kirim pesan:", error);
        // Cek jika errornya karena socket belum siap
        if (error.message === 'Connection Closed') {
             res.status(500).json({ status: false, message: 'Koneksi WA terputus, server sedang menyambung ulang...' });
        } else {
             res.status(500).json({ status: false, message: 'Gagal mengirim pesan', error: error.message });
        }
    }
});

// 3. Cek Status
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
            <h1>Server Jalan di Port ${port} 🚀</h1>
            <p>Status WA: <b>${isConnected ? '<span style="color:green">TERHUBUNG</span>' : '<span style="color:red">TERPUTUS</span>'}</b></p>
            <a href="/qr" style="background:blue; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Cek QR Code</a>
        </div>
    `);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`WhatsApp API Gateway berjalan di http://0.0.0.0:${port}`);
});