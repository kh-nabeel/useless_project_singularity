'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowLeft, Download, QrCode, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
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
    <main className="min-h-screen bg-[--clay-bg] flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#5c4a3a] mb-6 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <div className="clay p-8">
          <div className="flex items-center gap-3 mb-6">
            <QrCode size={32} className="text-[#ff6b6b]" />
            <h1 className="text-2xl font-bold text-[#5c4a3a]">Create a Game QR</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="destination-url"
                className="block text-sm font-semibold text-[#8b7d6b] mb-2"
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
                className="w-full px-4 py-3 rounded-2xl bg-[#e8e0d4] text-[#5c4a3a] placeholder-[#b0a090] outline-none transition-shadow focus:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]"
                style={{
                  boxShadow:
                    'inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.6)',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="label"
                className="block text-sm font-semibold text-[#8b7d6b] mb-2"
              >
                Label (optional)
              </label>
              <input
                id="label"
                type="text"
                placeholder="My awesome link"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#e8e0d4] text-[#5c4a3a] placeholder-[#b0a090] outline-none transition-shadow focus:shadow-[inset_4px_4px_8px_rgba(163,177,198,0.6),inset_-4px_-4px_8px_rgba(255,255,255,0.8)]"
                style={{
                  boxShadow:
                    'inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.6)',
                }}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>
            )}

            <button
              type="submit"
              disabled={!isValidUrl || loading}
              className="clay-btn w-full py-4 rounded-2xl text-lg font-bold text-[#5c4a3a] disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <QrCode size={20} />
                  Generate QR Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* QR Result */}
        {qrUrl && (
          <div className="clay p-8 mt-6 flex flex-col items-center gap-5">
            <h2 className="text-lg font-bold text-[#5c4a3a]">Your Game QR Code</h2>
            <div
              id="qr-canvas"
              className="p-4 bg-white rounded-2xl"
              style={{
                boxShadow:
                  'inset 3px 3px 6px rgba(163,177,198,0.3), inset -3px -3px 6px rgba(255,255,255,0.5)',
              }}
            >
              <QRCodeCanvas value={qrUrl} size={220} level="M" />
            </div>
            <p className="text-xs text-[#8b7d6b] text-center break-all max-w-[280px]">
              {qrUrl}
            </p>
            <button
              onClick={handleDownload}
              className="clay-btn px-6 py-3 rounded-2xl font-semibold text-[#5c4a3a] flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Download size={18} />
              Download QR
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
