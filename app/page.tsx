import Link from 'next/link';
import { QrCode, Camera, Gamepad2, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      
      {/* Handwriting Subtitle top */}
      <p className="font-[family-name:var(--font-nanum)] text-[#100f0f] text-2xl mb-4 text-center">
        turn your ordinary links into playable mini-games &lt;3
      </p>

      {/* Hero */}
      <div className="text-center mb-10 relative">
        <div className="text-6xl mb-4 animate-float-slow absolute -top-12 -left-12 opacity-80 rotate-12">👾</div>
        <div className="text-6xl mb-4 animate-float-slow absolute -top-10 -right-10 opacity-80 -rotate-12" style={{ animationDelay: '1s' }}>⭐</div>
        
        <h1 className="font-[family-name:var(--font-rubik)] text-6xl text-[#0e0e0d] mb-3 tracking-tighter lowercase animate-bounce-in">
          qr <span className="underline decoration-wavy decoration-[#ea34df]">quest</span>
        </h1>
        <p className="font-sans text-xl text-[#242525] max-w-md mx-auto leading-relaxed mt-6">
          Generate QR codes that challenge scanners with a mini-game before revealing the destination.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Link href="/create" className="flex-1 group">
          <div className="brutalist-container p-8 text-center transition-transform group-hover:-translate-y-2 group-active:translate-y-1">
            <QrCode size={48} className="text-[#0e0e0d] mx-auto mb-4" />
            <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] mb-2 lowercase">Create QR</h2>
            <p className="text-sm text-[#242525] font-bold">
              Generate a game-gated QR code for any URL
            </p>
          </div>
        </Link>

        <Link href="/scan" className="flex-1 group">
          <div className="brutalist-container p-8 text-center transition-transform group-hover:-translate-y-2 group-active:translate-y-1">
            <Camera size={48} className="text-[#0e0e0d] mx-auto mb-4" />
            <h2 className="font-[family-name:var(--font-rubik)] text-xl text-[#0e0e0d] mb-2 lowercase">Scan QR</h2>
            <p className="text-sm text-[#242525] font-bold">
              Use your camera to scan and play
            </p>
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="brutalist-container p-8 mt-12 w-full max-w-lg bg-[#f8f9fa]">
        <h2 className="font-[family-name:var(--font-rubik)] text-2xl text-[#0e0e0d] mb-6 flex items-center gap-2 lowercase">
          <Sparkles size={28} className="text-[#ea34df]" />
          how it works?
        </h2>
        <div className="space-y-6">
          {[
            {
              icon: <QrCode size={24} className="text-[#ffffff]" />,
              title: 'generate',
              desc: 'Paste any URL and get a special QR code',
              color: 'bg-[#0e0e0d]'
            },
            {
              icon: <Camera size={24} className="text-[#ffffff]" />,
              title: 'scan',
              desc: 'Anyone scans it with their phone camera',
              color: 'bg-[#ea34df]'
            },
            {
              icon: <Gamepad2 size={24} className="text-[#0e0e0d]" />,
              title: 'play',
              desc: 'A random mini-game appears — maze, chase, or puzzle',
              color: 'bg-[#4ecdc4]'
            },
            {
              icon: <Sparkles size={24} className="text-[#0e0e0d]" />,
              title: 'unlock',
              desc: 'Win the game and get redirected to the real destination!',
              color: 'bg-[#f5c542]'
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d] ${step.color}`}
              >
                {step.icon}
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-rubik)] text-lg text-[#0e0e0d] lowercase">{step.title}</h3>
                <p className="text-sm font-bold text-[#242525]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 font-[family-name:var(--font-nanum)] text-xl text-[#242525]">
        Made with ❤️ at TinkerHub Useless Projects
      </p>
    </main>
  );
}
