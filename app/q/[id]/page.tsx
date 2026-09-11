'use client';

import { useEffect, useState, useCallback, use } from 'react';
import dynamic from 'next/dynamic';
import confetti from 'canvas-confetti';

// Dynamic imports to avoid SSR issues with canvas
const MazeGame = dynamic(() => import('@/components/games/MazeGame'), { ssr: false });
const ChaseGame = dynamic(() => import('@/components/games/ChaseGame'), { ssr: false });
const SmasherGame = dynamic(() => import('@/components/games/SmasherGame'), { ssr: false });
const ImposterGame = dynamic(() => import('@/components/games/ImposterGame'), { ssr: false });

type GameType = 'maze' | 'chase' | 'smasher' | 'imposter';

interface QrData {
  id: string;
  destination_url: string;
  label: string | null;
  completed_count: number;
}

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [game, setGame] = useState<GameType | null>(null);
  const [won, setWon] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/qr/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setQrData(data);

        // Pick random game
        const games: GameType[] = ['maze', 'chase', 'smasher', 'imposter'];
        const chosen = games[Math.floor(Math.random() * games.length)];
        setGame(chosen);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleWin = useCallback(() => {
    if (won) return;
    setWon(true);

    // Fire confetti
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ea34df', '#4ecdc4', '#f5c542', '#a8e6a3', '#0e0e0d'],
    });

    // Increment count and redirect
    fetch(`/api/qr/${id}`, { method: 'PATCH' }).catch(() => {});

    setTimeout(() => {
      if (qrData) {
        window.location.href = qrData.destination_url;
      }
    }, 2000);
  }, [id, qrData, won]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="brutalist-container p-8 text-center max-w-sm w-full">
          <div className="text-4xl mb-4 animate-bounce">🎮</div>
          <p className="text-[#0e0e0d] font-[family-name:var(--font-rubik)] text-lg lowercase">loading your challenge...</p>
        </div>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="brutalist-container p-8 text-center max-w-sm w-full">
          <div className="text-6xl mb-4">🕳️</div>
          <h1 className="font-[family-name:var(--font-rubik)] text-2xl text-[#0e0e0d] mb-2 lowercase">
            code leads nowhere
          </h1>
          <p className="text-[#242525] font-bold">
            The QR code you scanned doesn&apos;t exist. Maybe it was a dream?
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-6 relative">
      {/* Win overlay */}
      {won && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#ffffff]/80 backdrop-blur-sm">
          <div className="brutalist-container p-10 text-center animate-bounce-in max-w-sm w-full mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-[family-name:var(--font-rubik)] text-3xl text-[#ea34df] mb-2 lowercase">unlocked!</h2>
            <p className="font-[family-name:var(--font-nanum)] text-2xl text-[#0e0e0d]">redirecting you now...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <p className="font-[family-name:var(--font-rubik)] text-sm text-[#0e0e0d] uppercase">
          🔒 Complete the challenge to unlock your link
        </p>
        {qrData?.label && (
          <p className="font-[family-name:var(--font-nanum)] text-xl text-[#ea34df] mt-2">
            destination: {qrData.label}
          </p>
        )}
      </div>

      {/* Game container */}
      <div className="brutalist-container p-4 sm:p-6 w-full max-w-lg">
        {game === 'maze' && <MazeGame onWin={handleWin} qrUrl={`${window.location.origin}/q/${id}`} />}
        {game === 'chase' && <ChaseGame onWin={handleWin} qrUrl={`${window.location.origin}/q/${id}`} />}
        {game === 'smasher' && <SmasherGame onWin={handleWin} qrUrl={`${window.location.origin}/q/${id}`} />}
        {game === 'imposter' && <ImposterGame onWin={handleWin} qrUrl={`${window.location.origin}/q/${id}`} />}
      </div>
    </main>
  );
}
