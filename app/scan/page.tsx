'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, ExternalLink, Upload } from 'lucide-react';
import Link from 'next/link';
import { BrutalistButton } from '@/components/ui/BrutalistButton';

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
      const siteUrl = window.location.origin;
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
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#0e0e0d] mb-6 font-bold hover:underline"
        >
          <ArrowLeft size={20} />
          Back
        </Link>

        <div className="brutalist-container p-8">
          <div className="flex items-center gap-3 mb-6">
            <Camera size={32} className="text-[#ea34df]" />
            <h1 className="font-[family-name:var(--font-rubik)] text-2xl text-[#0e0e0d] lowercase">Scan a QR Code</h1>
          </div>

          {/* Scanner container */}
          <div
            id="qr-reader"
            ref={containerRef}
            className="w-full rounded-md overflow-hidden mb-4 border-2 border-[#0e0e0d]"
            style={{
              minHeight: scanning ? '300px' : '0',
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
              <BrutalistButton
                onClick={startScanning}
                className="w-full flex items-center justify-center gap-2 bg-[#ea34df] hover:bg-[#d02bc5]"
              >
                <Camera size={20} />
                Start Scanner
              </BrutalistButton>
              <BrutalistButton
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 bg-white text-[#0e0e0d] hover:bg-gray-100"
              >
                <Upload size={20} />
                Upload QR Image
              </BrutalistButton>
            </div>
          )}

          {scanning && (
            <BrutalistButton
              onClick={stopScanning}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 border-red-900"
            >
              Stop Scanner
            </BrutalistButton>
          )}

          {error && (
            <p className="text-[#ffffff] text-sm bg-red-600 font-bold p-3 rounded-md border-2 border-[#0e0e0d] shadow-[4px_4px_0px_#0e0e0d] mt-4">{error}</p>
          )}

          {result && (
            <div className="mt-4 p-4 rounded-md border-2 border-[#0e0e0d] bg-[#f8f9fa] shadow-[4px_4px_0px_#0e0e0d]">
              <p className="text-sm font-bold text-[#0e0e0d] mb-2 uppercase">Decoded:</p>
              <p className="text-[#242525] font-[family-name:var(--font-nanum)] break-all text-xl mb-5">{result}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <BrutalistButton
                  onClick={handleResultAction}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#ea34df] hover:bg-[#d02bc5]"
                >
                  <ExternalLink size={16} />
                  {isOurDomain(result) ? 'Play Game' : 'Open Link'}
                </BrutalistButton>
                <BrutalistButton
                  onClick={() => {
                    setResult(null);
                    startScanning();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-[#0e0e0d] hover:bg-gray-100"
                >
                  Scan Again
                </BrutalistButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
