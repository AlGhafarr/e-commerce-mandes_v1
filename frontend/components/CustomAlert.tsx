'use client';
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDanger?: boolean;
}

export default function CustomAlert({ isOpen, onClose, onConfirm, title, message, isDanger = false }: CustomAlertProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-full ${isDanger ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-[#F87B1B]'}`}>
            <AlertTriangle size={24} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-[#F87B1B] hover:bg-orange-600 shadow-orange-200'}`}
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}