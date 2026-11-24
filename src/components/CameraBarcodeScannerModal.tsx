'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, ScanLine, FlipHorizontal, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'مسح وقراءة باركود المنتج بالكاميرا'
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

  // Play audio beep feedback
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, []);

  // Stop camera tracks cleanly
  const stopScanning = useCallback(() => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch {
      // ignore
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start ZXing Camera Stream
  const startScanning = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) return;
    setIsLoading(true);
    setErrorMessage(null);
    setScannedCode(null);

    stopScanning();

    try {
      const codeReader = new BrowserMultiFormatReader();
      readerRef.current = codeReader;

      // List available video devices
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        setVideoDevices(devices);
        
        // Prefer back / environment camera if none specified
        if (!deviceId && devices.length > 0) {
          const backCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('خلفية') ||
            d.label.toLowerCase().includes('environment')
          );
          deviceId = backCam ? backCam.deviceId : devices[devices.length - 1].deviceId;
          setSelectedDeviceId(deviceId);
        }
      } catch {
        // Fallback if device listing is blocked
      }

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const rawText = result.getText().trim();
            if (rawText) {
              setScannedCode(rawText);
              playBeep();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try { navigator.vibrate(120); } catch {}
              }

              // Stop scanning immediately and deliver result
              stopScanning();
              setTimeout(() => {
                onScan(rawText);
                onClose();
              }, 400);
            }
          }
        }
      );

      controlsRef.current = controls;
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera Scanner Error:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.message?.includes('denied')) {
        setErrorMessage('تم رفض الإذن بالوصول إلى الكاميرا. يرجى تفعيل إذن الكاميرا من إعدادات المتصفح.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('لم يتم العثور على كاميرا متصلة بالجهاز.');
      } else {
        setErrorMessage(err.message || 'تعذر تشغيل الكاميرا للمسح، يمكنك كتابة الباركود يدوياً.');
      }
    }
  }, [playBeep, stopScanning, onScan, onClose]);

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow modal DOM node to mount
      const timer = setTimeout(() => {
        startScanning(selectedDeviceId);
      }, 150);
      return () => {
        clearTimeout(timer);
        stopScanning();
      };
    } else {
      stopScanning();
    }
  }, [isOpen, selectedDeviceId, startScanning, stopScanning]);

  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startScanning(nextDevice.deviceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-zinc-950 text-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-800 animate-fade-in relative space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E6007E] to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-zinc-100 flex items-center gap-1.5">
                <span>{title}</span>
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">
                توجيه الكاميرا نحو باركود الصنف ليتم ملؤه تلقائياً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopScanning();
              onClose();
            }}
            className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-[4/3] sm:aspect-square w-full bg-black rounded-2xl overflow-hidden border-2 border-zinc-800 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-3 text-zinc-300">
              <RefreshCw className="w-8 h-8 text-[#E6007E] animate-spin" />
              <p className="text-xs font-bold font-sans">جاري فتح الكاميرا وتجهيز الحساس...</p>
            </div>
          )}

          {/* Success Flash */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white animate-fade-in z-20">
              <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-black font-sans">تمت قراءة الباركود بنجاح!</p>
              <span className="font-mono font-bold text-lg bg-black/60 px-3 py-1 rounded-xl border border-emerald-400 text-emerald-300" dir="ltr">
                {scannedCode}
              </span>
            </div>
          )}

          {/* Error View */}
          {errorMessage && (
            <div className="absolute inset-0 bg-zinc-950/95 p-6 flex flex-col items-center justify-center text-center gap-3 text-rose-300 z-20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startScanning(selectedDeviceId)}
                className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          )}

          {/* Scanner Targeting Frame (Viewfinder) */}
          {!isLoading && !errorMessage && !scannedCode && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Dimmed surrounding overlay */}
              <div className="relative w-64 h-40 sm:w-72 sm:h-44 border-2 border-[#E6007E] rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                {/* 4 Framing Corner Highlights */}
                <span className="absolute -top-1 -start-1 w-5 h-5 border-t-4 border-s-4 border-white rounded-tl-lg" />
                <span className="absolute -top-1 -end-1 w-5 h-5 border-t-4 border-e-4 border-white rounded-tr-lg" />
                <span className="absolute -bottom-1 -start-1 w-5 h-5 border-b-4 border-s-4 border-white rounded-bl-lg" />
                <span className="absolute -bottom-1 -end-1 w-5 h-5 border-b-4 border-e-4 border-white rounded-br-lg" />

                {/* Animated Red Laser Scan Line */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent shadow-[0_0_12px_#E6007E] animate-bounce top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls & Instructions */}
        <div className="space-y-3">
          <div className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 text-[11px] text-zinc-300 font-medium leading-relaxed flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-[#E6007E] shrink-0" />
            <span>
              قربي الكاميرا على مسافة 10-15 سم من خطوط الباركود المطبوعة على علبة المنتج حتى تظهر داخل الإطار الأحمر.
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {videoDevices.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="py-2.5 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <FlipHorizontal className="w-4 h-4 text-pink-400" />
                <span>تبديل الكاميرا ({videoDevices.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className="ms-auto py-2.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              إلغاء وإغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
