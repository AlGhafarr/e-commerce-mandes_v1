'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Maximize2, Minimize2, ChevronLeft, Headphones, Bot, User, LogIn, Zap, ExternalLink } from 'lucide-react';

// Tipe Data Pesan
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system'; // 'system' untuk notifikasi status tiket
  timestamp: Date;
}

// Tipe View (Halaman aktif dalam chat)
type ChatView = 'menu' | 'bot_chat' | 'ticket_chat' | 'login_request';

export default function Chatbot() {
  // --- STATE UI ---
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [view, setView] = useState<ChatView>('menu');

  // --- STATE DATA ---
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Simulasi User Session (Nantinya ambil dari Global Context / Auth Anda)
  // Ubah ke null untuk simulasi belum login
  const [userSession, setUserSession] = useState<{name: string, phone: string} | null>(null); 

  // --- STATE PESAN (Pisahkan history Bot dan Tiket) ---
  const [botMessages, setBotMessages] = useState<Message[]>([
    { id: '1', text: 'Halo! 👋 Ada yang bisa saya bantu? Silakan tanya seputar produk atau cara pesan.', sender: 'bot', timestamp: new Date() }
  ]);
  const [ticketMessages, setTicketMessages] = useState<Message[]>([
    { id: '1', text: 'Selamat datang di Layanan Support Premium. Pesan Anda akan terhubung langsung ke Admin.', sender: 'system', timestamp: new Date() }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AUTO SCROLL ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [botMessages, ticketMessages, view, isTyping]);

  // ==========================================
  // 1. LOGIC BOT (NLP SEDERHANA)
  // ==========================================
  
  // Fungsi Levenshtein Distance (Fuzzy Logic untuk Typo)
  const levenshtein = (a: string, b: string): number => {
    const matrix = [];
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const isMatch = (userInput: string, keywords: string[]): boolean => {
    const userWords = userInput.toLowerCase().split(/\s+/);
    for (const word of userWords) {
      for (const key of keywords) {
        if (word.includes(key)) return true;
        const distance = levenshtein(word, key);
        const maxLength = Math.max(word.length, key.length);
        if (maxLength > 4 && distance <= 2) return true; 
        if (maxLength <= 4 && distance <= 1) return true;
      }
    }
    return false;
  };

  const getBotResponse = (text: string): string => {
    const lower = text.toLowerCase();
    
    if (isMatch(lower, ['harga', 'promo', 'murah', 'diskon'])) return 'Harga produk mulai Rp 10.000. Sedang ada promo beli 5 gratis 1 kak! 🎉';
    if (isMatch(lower, ['kirim', 'ongkir', 'kurir', 'antar'])) return 'Kami kirim pakai JNE/JNT/SiCepat. Ongkir dihitung otomatis pas checkout ya 🚚';
    if (isMatch(lower, ['cara', 'pesan', 'beli', 'order'])) return 'Gampang kak! Klik produk -> Masukkan Keranjang -> Checkout -> Bayar. 😉';
    if (isMatch(lower, ['lokasi', 'alamat', 'toko', 'mana'])) return 'Toko kami online berbasis di Jakarta Selatan. Melayani kirim ke seluruh Indonesia! 🇮🇩';
    
    return 'Maaf saya hanya bot. Untuk bantuan mendalam, silakan kembali ke menu dan pilih "Ticketing Support" ya.';
  };

  const handleSendBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user', timestamp: new Date() };
    setBotMessages(prev => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotResponse(newMsg.text);
      setBotMessages(prev => [...prev, { id: (Date.now()+1).toString(), text: reply, sender: 'bot', timestamp: new Date() }]);
      setIsTyping(false);
    }, 800);
  };

  // ==========================================
  // 2. LOGIC TICKETING (CHAT MODE)
  // ==========================================
  
  // Fungsi Cek Login sebelum masuk Ticketing
  const handleEnterTicketing = () => {
    if (userSession) {
      setView('ticket_chat');
    } else {
      setView('login_request');
    }
  };

  // Simulasi Login (Nantinya ini diganti fungsi login beneran)
  const handleSimulateLogin = () => {
    // Anggap user sukses login
    setUserSession({ name: 'Budi Santoso', phone: '08123456789' });
    setView('ticket_chat');
    // Tambahkan pesan sistem bahwa user teridentifikasi
    setTicketMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Halo Budi Santoso! Anda terhubung ke layanan Ticketing. Silakan tulis pesan, Admin WA & Telegram kami akan segera merespon.`,
        sender: 'system',
        timestamp: new Date()
    }]);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // 1. Tampilkan pesan user di UI
    const newMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user', timestamp: new Date() };
    setTicketMessages(prev => [...prev, newMsg]);
    setInputText("");
    
    // 2. Simulasi Kirim ke Backend (WA/Telegram API)
    setIsTyping(true); // Indikator "Sending..."
    
    setTimeout(() => {
      setIsTyping(false);
      // Disini backend seharusnya mengirim notifikasi ke WA/Telegram Admin
      // Feedback UI kecil (misal centang dua) bisa ditambahkan nanti
    }, 1000);
  };

  // ==========================================
  // UI RENDERERS
  // ==========================================

  // A. MENU UTAMA
  const renderMenu = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-orange-50 p-4 space-y-4 justify-center">
      <div className="text-center mb-2">
        <h3 className="font-bold text-gray-800 text-lg">Mandes Support</h3>
        <p className="text-xs text-gray-500">Pilih layanan bantuan</p>
      </div>

      <button onClick={() => setView('bot_chat')} className="flex items-center gap-4 p-4 bg-white border border-blue-100 rounded-2xl shadow-sm hover:shadow-md transition text-left group hover:border-blue-400">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition flex-shrink-0"><Bot size={24}/></div>
        <div><h4 className="font-bold text-gray-800 text-sm">Bot Assistant</h4><p className="text-[10px] text-gray-500">Tanya jawab otomatis (Cepat)</p></div>
      </button>

      <button onClick={handleEnterTicketing} className="flex items-center gap-4 p-4 bg-white border border-purple-100 rounded-2xl shadow-sm hover:shadow-md transition text-left group hover:border-purple-400">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition flex-shrink-0"><Headphones size={24}/></div>
        <div><h4 className="font-bold text-gray-800 text-sm">Ticketing Support</h4><p className="text-[10px] text-gray-500">Terintegrasi WA & Telegram</p></div>
      </button>

      <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-2 text-gray-400 text-[10px] uppercase font-bold">Atau Urgent?</span>
          <div className="flex-grow border-t border-gray-200"></div>
      </div>

      {/* DIRECT WA LINK (PERSONAL ADMIN) */}
      <a 
        href="https://wa.me/628123456789?text=Halo%20Admin,%20saya%20ingin%20tanya%20langsung%20(Urgent)." 
        target="_blank" 
        rel="noreferrer"
        className="flex items-center gap-4 p-4 bg-[#F87B1B] text-white rounded-2xl shadow-lg hover:bg-orange-600 transition text-left group border border-orange-400"
      >
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition flex-shrink-0">
            <Zap size={24} fill="currentColor"/>
        </div>
        <div><h4 className="font-bold text-sm">Chat Admin Langsung</h4><p className="text-[10px] text-orange-100">Tanpa antre (WA Personal)</p></div>
        <ExternalLink size={16} className="ml-auto opacity-70"/>
      </a>
    </div>
  );

  // B. HALAMAN MINTA LOGIN (JIKA BELUM LOGIN)
  const renderLoginRequest = () => (
    <div className="flex flex-col h-full items-center justify-center p-6 text-center bg-white">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 text-purple-600 animate-pulse">
        <User size={32} />
      </div>
      <h3 className="font-bold text-gray-800 text-lg">Identitas Diperlukan</h3>
      <p className="text-xs text-gray-500 mt-2 mb-6 leading-relaxed px-4">
        Agar Admin dapat menghubungi Anda kembali via WA/Telegram, mohon login terlebih dahulu untuk verifikasi identitas.
      </p>
      <button onClick={handleSimulateLogin} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
        <LogIn size={16}/> Login & Lanjutkan
      </button>
      <button onClick={() => setView('menu')} className="mt-4 text-xs text-gray-400 hover:text-gray-600 font-medium">Kembali ke Menu</button>
    </div>
  );

  // C. CORE CHAT UI (REUSABLE UNTUK BOT & TICKET)
  const renderChatInterface = (
    mode: 'bot' | 'ticket', 
    msgs: Message[], 
    sendHandler: (e: React.FormEvent) => void
  ) => (
    <>
      {/* Messages Area */}
      <div className="flex-1 bg-[#fffdf5] p-4 overflow-y-auto space-y-3 scrollbar-thin">
        <div className="text-center text-[10px] text-gray-400 my-2">
            {mode === 'bot' ? 'Bot Assistant' : 'Tiket #8829 (Open)'}
        </div>
        
        {msgs.map((msg) => {
            // Style beda untuk System Message
            if (msg.sender === 'system') {
                return (
                    <div key={msg.id} className="flex justify-center my-4">
                        <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[10px] px-3 py-1 rounded-full font-medium text-center max-w-[90%] leading-relaxed">{msg.text}</span>
                    </div>
                )
            }
            return (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 max-w-[85%] text-xs lg:text-sm shadow-sm relative whitespace-pre-line ${msg.sender === 'user' ? (mode === 'bot' ? 'bg-[#F87B1B]' : 'bg-purple-600') + ' text-white rounded-2xl rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-none'}`}>
                        {msg.text}
                        <span className={`text-[9px] block text-right mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                            {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                </div>
            );
        })}
        
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 w-16">
               <div className="flex gap-1 justify-center">
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
             {mode === 'ticket' && <span className="text-[10px] text-gray-400 self-center ml-2 animate-pulse">Mengirim ke Admin...</span>}
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendHandler} className="p-3 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            value={inputText} 
            onChange={(e) => setInputText(e.target.value)} 
            placeholder={mode === 'bot' ? "Tanya bot..." : "Tulis pesan ke admin..."} 
            className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs lg:text-sm focus:outline-none focus:ring-1 transition-all ${mode==='bot' ? 'focus:border-[#F87B1B] focus:ring-orange-100' : 'focus:border-purple-600 focus:ring-purple-100'}`} 
          />
          <button type="submit" disabled={!inputText.trim()} className={`p-3 rounded-xl text-white disabled:opacity-50 transition shadow-md active:scale-95 ${mode==='bot' ? 'bg-[#F87B1B] hover:bg-orange-600' : 'bg-purple-600 hover:bg-purple-700'}`}>
            <Send size={18}/>
          </button>
        </div>
      </form>
    </>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[90] p-3.5 lg:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white ${isOpen ? 'bg-red-500 rotate-90' : 'bg-[#F87B1B] animate-bounce-slow'}`}
      >
        {isOpen ? <X size={24} color="white"/> : <MessageCircle size={28} color="white"/>}
      </button>

      <div className={`fixed z-[90] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right right-4 bottom-24 left-4 ${isExpanded ? 'h-[80vh]' : 'h-[500px]'} lg:left-auto lg:right-6 lg:bottom-24 lg:w-[380px] lg:h-[500px] ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none translate-y-10'}`}>
        
        {/* HEADER */}
        <div className={`p-4 flex items-center justify-between shadow-sm relative z-10 text-white transition-colors duration-300 ${view === 'ticket_chat' || view === 'login_request' ? 'bg-purple-600' : 'bg-[#F87B1B]'}`}>
          <div className="flex items-center gap-3">
            {view !== 'menu' ? (
              <button onClick={() => setView('menu')} className="p-1 hover:bg-white/20 rounded-full transition"><ChevronLeft size={24}/></button>
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg border border-white/30">🤖</div>
            )}
            <div>
              <h4 className="font-bold text-sm leading-tight">
                {view === 'menu' ? 'Pusat Bantuan' : view === 'bot_chat' ? 'Bot Assistant' : 'Ticketing Support'}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span> 
                <span className="text-[10px] text-white/80 font-medium">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsExpanded(!isExpanded)} className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition">
              {isExpanded ? <Minimize2 size={18}/> : <Maximize2 size={18}/>}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"><X size={20}/></button>
          </div>
        </div>

        {/* CONTENT SWITCHER */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white">
            {view === 'menu' && renderMenu()}
            {view === 'login_request' && renderLoginRequest()}
            {view === 'bot_chat' && renderChatInterface('bot', botMessages, handleSendBot)}
            {view === 'ticket_chat' && renderChatInterface('ticket', ticketMessages, handleSendTicket)}
        </div>

      </div>
    </>
  );
}