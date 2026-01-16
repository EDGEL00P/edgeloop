import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-[#2C2F33]/80 backdrop-blur-2xl py-5 px-6 border-b border-white/5 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="hidden md:block">
              <div className="text-xs font-bold text-[#CC0000] uppercase tracking-widest">ESPN</div>
              <div className="text-xl font-black text-[#F0F0F0] uppercase tracking-tight">
                EDGELOOP
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Dashboard</Link>
            <Link href="/picks" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Picks</Link>
            <Link href="/predictions-and-analysis" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Predictions</Link>
            <Link href="/stats" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Stats</Link>
            <Link href="/props" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Props</Link>
            <Link href="/schedule" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Schedule</Link>
            <Link href="/standings" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Standings</Link>
            <Link href="/live" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Live</Link>
            <Link href="/backtest" className="text-[#F0F0F0]/80 hover:text-[#00F5FF] transition-colors uppercase tracking-wider">Backtest</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/account-management" className="px-4 py-2 rounded-lg bg-[#FF4D00] text-[#080808] font-bold uppercase tracking-widest text-xs hover:bg-[#FF6B1A] transition-colors">
            Account
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
