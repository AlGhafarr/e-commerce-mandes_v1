'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { authEvents } from '@/utils/event';

interface ProtectedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const ProtectedLink: React.FC<ProtectedLinkProps> = ({ href, children, className }) => {
  const { user } = useAuth(); // Ambil status user dari Context
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Matikan navigasi default

    if (user) {
      // Jika User Sudah Login -> Lanjut Navigasi
      router.push(href);
    } else {
      // Jika Belum Login -> Munculkan Modal
      console.log("Access Denied: User not logged in");
      authEvents.triggerLoginModal();
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default ProtectedLink;