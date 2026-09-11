'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, ExternalLink, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;
    setError(null);
    setResult(null);

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setResult(decodedText);
          scanner.stop().catch(() => {});
          setScanning(false);
        },
        () => {
          // QR code parse error — ignore, keep scanning
        }
      );

      setScanning(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera. Please grant camera permissions.'
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);
    
    if (scanning && scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        // ignore
      }
      setScanning(false);
    }

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      const decodedText = await html5QrCode.scanFile(file, true);
      setResult(decodedText);
    } catch (err) {
      setError('Could not decode QR code from the uploaded image.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      setScanning(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const isOurDomain = (url: string) => {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      return url.startsWith(siteUrl);
    } catch {
      return false;
    }
  };

  const handleResultAction = () => {
    if (!result) return;
    if (isOurDomain(result)) {
      // Navigate in-app
      const path = new URL(result).pathname;
      window.location.href = path;
    } else {
      window.open(result, '_blank');
    }
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
            <Camera size={32} className="text-[#4ecdc4]" />
            <h1 className="text-2xl font-bold text-[#5c4a3a]">Scan a QR Code</h1>
          </div>

          {/* Scanner container */}
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full rounded-2xl overflow-hidden mb-4"
            style={{
              minHeight: scanning ? '300px' : '0',
              boxShadow: scanning
                ? 'inset 4px 4px 8px rgba(163,177,198,0.6), inset -4px -4px 8px rgba(255,255,255,0.8)'
                : 'none',
            }}
          />

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          {!scanning && !result && (
            <div className="flex flex-col gap-3">
              <button
                onClick={startScanning}
                className="clay-btn w-full py-4 rounded-2xl text-lg font-bold text-[#5c4a3a] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Camera size={20} />
                Start Scanner
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="clay-btn w-full py-4 rounded-2xl text-lg font-bold text-[#5c4a3a] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                Upload QR Image
              </button>
            </div>
          )}

          {scanning && (
            <button
              onClick={stopScanning}
              className="clay-btn w-full py-4 rounded-2xl text-lg font-bold text-red-500 active:scale-[0.98] transition-transform"
            >
              Stop Scanner
            </button>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl mt-4">{error}</p>
          )}

          {result && (
            <div className="mt-4 p-4 rounded-2xl" style={{
              background: '#e8e0d4',
              boxShadow: 'inset 3px 3px 6px rgba(163,177,198,0.4), inset -3px -3px 6px rgba(255,255,255,0.6)',
            }}>
              <p className="text-sm text-[#8b7d6b] mb-2 font-semibold">Decoded:</p>
              <p className="text-[#5c4a3a] break-all text-sm mb-3">{result}</p>

              <div className="flex gap-3">
                <button
                  onClick={handleResultAction}
                  className="clay-btn flex-1 py-3 rounded-2xl font-semibold text-[#5c4a3a] flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <ExternalLink size={16} />
                  {isOurDomain(result) ? 'Play Game' : 'Open Link'}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    startScanning();
                  }}
                  className="clay-btn py-3 px-5 rounded-2xl font-semibold text-[#5c4a3a] active:scale-95 transition-transform"
                >
                  Scan Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
