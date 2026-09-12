'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import Link from 'next/link';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

export default function CreatePage() {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = /^https?:\/\//i.test(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl) {
      setError('URL must start with http:// or https://');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_url: url, label }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create QR code');
      }

      const { id } = await res.json();
      const siteUrl = window.location.origin;
      setQrUrl(`${siteUrl}/q/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const canvas = document.querySelector('#qr-canvas canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${label || 'code'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#0e0e0d] mb-6 font-bold hover:underline"
        >
          <ArrowLeft size={20} />
          back
        </Link>

        <div className="brutalist-container p-8">
          <div className="flex items-center gap-3 mb-6">
            <QrCode size={32} className="text-[#ea34df]" />
            <h1 className="font-[family-name:var(--font-rubik)] text-2xl text-[#0e0e0d] lowercase">create a game qr</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="destination-url"
                className="block text-sm font-bold text-[#0e0e0d] mb-2 uppercase"
              >
                Destination URL *
              </label>
              <input
                id="destination-url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#0e0e0d] text-[#0e0e0d] placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#ea34df]/50 transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="label"
                className="block text-sm font-bold text-[#0e0e0d] mb-2 uppercase"
              >
                Label (optional)
              </label>
              <input
                id="label"
                type="text"
                placeholder="My awesome link"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-white border-2 border-[#0e0e0d] text-[#0e0e0d] placeholder-gray-400 outline-none focus:ring-4 focus:ring-[#ea34df]/50 transition-shadow"
              />
            </div>

            {error && (
              <p className="text-[#ffffff] text-sm bg-red-600 font-bold p-3 rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d]">{error}</p>
            )}

            <BrutalistButton
              type="submit"
              disabled={!isValidUrl || loading}
              isLoading={loading}
              className="w-full"
            >
              <QrCode size={20} />
              Generate QR Code
            </BrutalistButton>
          </form>
        </div>

        {/* QR Result */}
        {qrUrl && (
          <div className="brutalist-container p-8 mt-8 flex flex-col items-center gap-5 bg-[#f8f9fa] animate-bounce-in">
            <h2 className="font-[family-name:var(--font-rubik)] text-lg text-[#0e0e0d] lowercase text-center">your game qr code</h2>
            <div
              id="qr-canvas"
              className="p-4 bg-white border-2 border-[#0e0e0d] rounded-md"
            >
              <QRCodeCanvas value={qrUrl} size={220} level="M" />
            </div>
            <p className="font-[family-name:var(--font-nanum)] text-xl text-[#242525] text-center break-all max-w-[280px]">
              {qrUrl}
            </p>
            <BrutalistButton
              onClick={handleDownload}
              className="bg-[#ea34df] hover:bg-[#d02bc5]"
            >
              <Download size={18} />
              Download QR
            </BrutalistButton>
          </div>
        )}
      </div>
    </main>
  );
}
