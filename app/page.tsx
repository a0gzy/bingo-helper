'use client';

import Link from 'next/link';
import { Grid3X3, Beaker, ArrowRight, Sparkles, Coins, Github } from 'lucide-react';
import { useLanguage } from '../components/providers/LanguageProvider';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center pt-20 pb-16 px-6 bg-zinc-950">
      {/* Hero Section */}
      <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-10 mt-12 mb-20">

        {/* Glow behind title */}
        <div className="absolute top-40 w-72 h-72 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Big Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-8xl font-black tracking-tighter text-white leading-[1.1] md:leading-none select-none">
          {t('landing.title1')}
          <span className="block italic text-transparent bg-clip-text bg-linear-to-r from-blue-400 via-emerald-400 to-amber-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.3)]">
            {t('landing.title2') || "Slime Castle"}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-2xl text-zinc-400 max-w-2xl leading-relaxed font-medium">
          {t('landing.subtitle')}
        </p>

        {/* CTA Button - Scroll Down */}
        <button
          onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-white text-zinc-950 font-black rounded-full hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] overflow-hidden"
        >
          <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-blue-500 to-emerald-500 opacity-50"></div>
          {t('landing.primaryBtn')}
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Social Proof Section */}
      <div className="w-full overflow-hidden opacity-40 py-12 border-y border-zinc-900/50 bg-zinc-900/20">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8 text-center">
          {t('landing.trusted')}
        </p>

        <div className="relative flex overflow-x-hidden">
          <div className="animate-marquee t-25 whitespace-nowrap flex items-center gap-16 py-2">
            {(() => {
              const names = [
                "TRS", "SCA", "ZOO", "WTF", "RoKings", "Авангард", "SF", "Rimuru City", " ",
                "MrPug", "BadWinner", "EnricoN", "ANRISE", "ArchBishop", "Sion", "Swan", "Sugar", "Andrey", "a0g <3", " "
              ];
              return [...names, ...names].map((name, i) => (
                <span key={i} className="text-zinc-700 font-black text-3xl italic tracking-tighter">{name}</span>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-32 relative">

        {/* Abstract Background Elements */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Card 1: Bingo */}
        <Link href="/bingo" className="group relative flex flex-col p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] hover:bg-zinc-900/60 transition-all duration-500 hover:border-blue-500/30 hover:-translate-y-2 backdrop-blur-xl overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
          <div className="h-16 w-16 bg-linear-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 text-blue-400 rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-blue-500/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Grid3X3 className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{t('landing.bingoTitle')}</h3>
          <p className="text-zinc-400 leading-relaxed font-medium">
            {t('landing.bingoDesc')}
          </p>
          <div className="mt-auto pt-8 flex items-center gap-2 text-blue-400/50 group-hover:text-blue-400 font-bold text-xs uppercase tracking-widest transition-colors">
            {t('landing.explore')} <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 2: Runes */}
        <Link href="/runes" className="group relative flex flex-col p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] hover:bg-zinc-900/60 transition-all duration-500 hover:border-emerald-500/30 hover:-translate-y-2 backdrop-blur-xl overflow-hidden">
          <div className="h-16 w-16 bg-linear-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-emerald-500/5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
            <Beaker className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{t('landing.runesTitle')}</h3>
          <p className="text-zinc-400 leading-relaxed font-medium">
            {t('landing.runesDesc')}
          </p>
          <div className="mt-auto pt-8 flex items-center gap-2 text-emerald-400/50 group-hover:text-emerald-400 font-bold text-xs uppercase tracking-widest transition-colors">
            {t('landing.manage')} <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 3: Monopoly */}
        <Link href="/monopoly" className="group relative flex flex-col p-8 bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] hover:bg-zinc-900/60 transition-all duration-500 hover:border-amber-500/30 hover:-translate-y-2 backdrop-blur-xl overflow-hidden">
          <div className="h-16 w-16 bg-linear-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 text-amber-500 rounded-3xl flex items-center justify-center mb-10 shadow-lg shadow-amber-500/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
            <Coins className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-black text-white mb-4 group-hover:text-amber-400 transition-colors uppercase tracking-tight">{t('landing.monopolyTitle')}</h3>
          <p className="text-zinc-400 leading-relaxed font-medium">
            {t('landing.monopolyDesc')}
          </p>
          <div className="mt-auto pt-8 flex items-center gap-2 text-amber-400/50 group-hover:text-amber-400 font-bold text-xs uppercase tracking-widest transition-colors">
            {t('landing.track')} <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Wiki card is hidden for now — will return when guides are ready (see PLAN.md) */}

      </div>

      {/* Footer */}
      <footer className="w-full max-w-7xl mt-32 pt-12 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-6 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-zinc-800 to-zinc-950 border border-zinc-800 flex items-center justify-center text-xs font-black italic">a0g</div>
          <span className="text-zinc-500 font-medium text-sm">{t('landing.author')}</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="https://github.com/a0gzy/slime-castle" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors" title="GitHub">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://t.me/a0gzy" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#26A5E4] transition-colors" title="Telegram">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42l10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.703l-.331 4.956c.485 0 .7-.223.972-.485l2.335-2.27l4.857 3.589c.895.493 1.538.24 1.761-.83l3.204-15.085c.325-1.303-.497-1.894-1.353-1.494z" /></svg>
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[#5865F2] transition-colors" title="Discord: @a0g">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419s2.175 1.086 2.175 2.419c0 1.334-.954 2.419-2.175 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419s2.175 1.086 2.175 2.419c0 1.334-.946 2.419-2.175 2.419z" /></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
