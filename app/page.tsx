import Link from 'next/link';
import { QrCode, Camera, Gamepad2, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[--clay-bg] flex flex-col items-center justify-center px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="text-6xl mb-4 animate-bounce-slow">🎮</div>
        <h1 className="text-4xl font-extrabold text-[#5c4a3a] mb-3 tracking-tight">
          QR Quest
        </h1>
        <p className="text-lg text-[#8b7d6b] max-w-md mx-auto leading-relaxed">
          Generate QR codes that <span className="font-bold text-[#ff6b6b]">challenge</span>{' '}
          scanners with a mini-game before revealing the destination.
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        <Link href="/create" className="flex-1 group">
          <div className="clay p-8 text-center transition-transform group-hover:scale-[1.03] group-active:scale-[0.98]">
            <QrCode size={40} className="text-[#ff6b6b] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#5c4a3a] mb-2">Create QR</h2>
            <p className="text-sm text-[#8b7d6b]">
              Generate a game-gated QR code for any URL
            </p>
          </div>
        </Link>

        <Link href="/scan" className="flex-1 group">
          <div className="clay p-8 text-center transition-transform group-hover:scale-[1.03] group-active:scale-[0.98]">
            <Camera size={40} className="text-[#4ecdc4] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#5c4a3a] mb-2">Scan QR</h2>
            <p className="text-sm text-[#8b7d6b]">
              Use your camera to scan and play
            </p>
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="clay p-8 mt-10 w-full max-w-lg">
        <h2 className="text-xl font-bold text-[#5c4a3a] mb-5 flex items-center gap-2">
          <Sparkles size={22} className="text-[#f5c542]" />
          How it works
        </h2>
        <div className="space-y-4">
          {[
            {
              icon: <QrCode size={24} className="text-[#ff6b6b]" />,
              title: 'Generate',
              desc: 'Paste any URL and get a special QR code',
            },
            {
              icon: <Camera size={24} className="text-[#4ecdc4]" />,
              title: 'Scan',
              desc: 'Anyone scans it with their phone camera',
            },
            {
              icon: <Gamepad2 size={24} className="text-[#f5c542]" />,
              title: 'Play',
              desc: 'A random mini-game appears — maze, chase, or puzzle',
            },
            {
              icon: <Sparkles size={24} className="text-[#a8e6a3]" />,
              title: 'Unlock',
              desc: 'Win the game and get redirected to the real destination!',
            },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: 'var(--clay-bg)',
                  boxShadow:
                    '4px 4px 8px var(--clay-shadow-dark), -4px -4px 8px var(--clay-shadow-light)',
                }}
              >
                {step.icon}
              </div>
              <div>
                <h3 className="font-bold text-[#5c4a3a]">{step.title}</h3>
                <p className="text-sm text-[#8b7d6b]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-[#b0a090]">
        Made with 💖 for TinkerHub Useless Projects
      </p>
    </main>
  );
}
