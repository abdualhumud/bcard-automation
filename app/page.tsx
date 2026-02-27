'use client';

import { useRef, useState, useCallback } from 'react';
import {
  Camera, Loader2, Clock, Sparkles, CloudUpload,
  CheckCircle2, RotateCcw, ExternalLink, Zap,
} from 'lucide-react';

import { Button }        from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge }         from '@/components/ui/badge';
import { ThemeToggle }   from '@/components/ThemeToggle';
import CardDataTable     from '@/components/CardDataTable';
import StatusToast, { ToastMessage, ToastType } from '@/components/StatusToast';
import ModelFallbackModal from '@/components/ModelFallbackModal';
import { CardData, EMPTY_CARD } from '@/types/card';
import { cn } from '@/lib/utils';
import type { GeminiModel } from '@/lib/gemini';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] ?? file.type;
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let toastCounter = 0;
function makeToast(type: ToastType, text: string, duration?: number): ToastMessage {
  return { id: ++toastCounter, type, text, duration };
}

type AppState = 'idle' | 'scanning' | 'review' | 'syncing' | 'done';

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [appState,          setAppState]          = useState<AppState>('idle');
  const [cardData,          setCardData]           = useState<CardData>(EMPTY_CARD);
  const [imagePreview,      setImagePreview]       = useState<string | null>(null);
  const [imageBase64,       setImageBase64]        = useState('');
  const [imageMime,         setImageMime]          = useState('');
  const [cooldownSec,       setCooldownSec]        = useState(0);
  const [toasts,            setToasts]             = useState<ToastMessage[]>([]);

  // ── Model fallback state ───────────────────────────────────────────────────
  const [activeModel,       setActiveModel]        = useState<GeminiModel>('gemini-2.0-flash');
  const [showFallbackModal, setShowFallbackModal]  = useState(false);
  const [pendingBase64,     setPendingBase64]      = useState('');
  const [pendingMime,       setPendingMime]        = useState('');

  const addToast = useCallback((type: ToastType, text: string, duration = 4500) => {
    setToasts(p => [...p, makeToast(type, text, duration)]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  function startCooldown(sec: number) {
    setCooldownSec(sec);
    const iv = setInterval(() => {
      setCooldownSec(s => { if (s <= 1) { clearInterval(iv); return 0; } return s - 1; });
    }, 1000);
  }

  // ── Core scan logic (accepts explicit model) ───────────────────────────────
  async function scanWithModel(base64: string, mime: string, model: GeminiModel) {
    setAppState('scanning');

    const modelLabel = model === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : 'Gemini 2.0 Flash‑Lite';
    const lid = ++toastCounter;
    setToasts(p => [...p, { id: lid, type: 'loading', text: `${modelLabel} is extracting card data\u2026` }]);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime, model }),
      });
      setToasts(p => p.filter(t => t.id !== lid));
      const json = await res.json();

      if (!res.ok) {
        // Quota exhausted — offer Flash fallback
        if (json.code === 'QUOTA_EXCEEDED') {
          setPendingBase64(base64);
          setPendingMime(mime);
          setShowFallbackModal(true);
          setAppState('idle');
          return;
        }
        // Normal rate-limit cooldown
        if (res.status === 429) startCooldown(json.waitSec ?? 30);
        addToast('error', json.error ?? 'Extraction failed.');
        setAppState('idle');
        return;
      }

      setCardData({ ...json.data, imageLink: '' });
      setAppState('review');
      addToast('success', 'Card extracted \u2014 review and edit before syncing.', 5000);
      startCooldown(30);
    } catch {
      setToasts(p => p.filter(t => t.id !== lid));
      addToast('error', 'Unexpected error during scan.');
      setAppState('idle');
    }
  }

  async function handleFileSelected(file: File) {
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please select a valid image file.'); return;
    }
    try {
      const { base64, mimeType } = await fileToBase64(file);
      setImageBase64(base64);
      setImageMime(mimeType);
      setImagePreview(URL.createObjectURL(file));
      setCardData(EMPTY_CARD);
      await scanWithModel(base64, mimeType, activeModel);
    } catch {
      addToast('error', 'Unexpected error during scan.');
      setAppState('idle');
    }
  }

  // ── Fallback modal handlers ────────────────────────────────────────────────
  function handleContinueWithFlash() {
    setShowFallbackModal(false);
    setActiveModel('gemini-2.0-flash-lite');
    scanWithModel(pendingBase64, pendingMime, 'gemini-2.0-flash-lite');
  }

  function handleWaitForTomorrow() {
    setShowFallbackModal(false);
    addToast('info', 'Pro resets daily. Come back tomorrow for full-precision analysis!', 6000);
  }

  async function handleSync() {
    if (!imageBase64) return;
    setAppState('syncing');

    const lid = ++toastCounter;
    setToasts(p => [...p, { id: lid, type: 'loading', text: 'Uploading to Drive \u0026 syncing to Sheets\u2026' }]);

    try {
      const res  = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: cardData, imageBase64, mimeType: imageMime }),
      });
      setToasts(p => p.filter(t => t.id !== lid));
      const json = await res.json();

      if (!res.ok) {
        addToast('error', json.error ?? 'Sync failed.');
        setAppState('review'); return;
      }
      setCardData(prev => ({ ...prev, imageLink: json.imageLink }));
      setAppState('done');
      const label = json.action === 'updated' ? `Row ${json.row} updated` : 'New row appended';
      addToast('success', `${label} in Google Sheets.`, 6000);
    } catch {
      addToast('error', 'Unexpected error during sync.');
      setAppState('review');
    }
  }

  function handleReset() {
    setAppState('idle');
    setCardData(EMPTY_CARD);
    setImagePreview(null);
    setImageBase64('');
    setImageMime('');
    // Keep activeModel as-is so Flash persists across scans if chosen
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const isScanning = appState === 'scanning';
  const isSyncing  = appState === 'syncing';
  const isReview   = appState === 'review' || appState === 'done';
  const isBusy     = isScanning || isSyncing;
  const scanLocked = isBusy || cooldownSec > 0;
  const isFlash    = activeModel === 'gemini-2.0-flash-lite';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] transition-colors duration-300">

      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/8 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-500/4 dark:bg-purple-500/6 blur-3xl animate-pulse-glow delay-300" />
      </div>

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 glass transition-all duration-300">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Left: Logo + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-[#020817]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">
                CardScan <span className="text-shimmer">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-1 leading-none truncate">
                {isFlash ? 'Gemini 2.0 Flash‑Lite' : 'Gemini 2.0 Flash'}
              </p>
            </div>
          </div>

          {/* Right: badges + controls */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Model indicator badge */}
            <Badge
              variant={isFlash ? 'warning' : 'primary'}
              className="hidden xs:inline-flex"
            >
              {isFlash
                ? <><Zap      className="w-3 h-3" />Flash</>
                : <><Sparkles className="w-3 h-3" />Pro</>
              }
            </Badge>

            {/* Cooldown badge */}
            {cooldownSec > 0 && (
              <Badge variant="warning" className="tabular-nums">
                <Clock className="w-3 h-3" />{cooldownSec}s
              </Badge>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="relative max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelected(f); }}
        />

        {/* ── Glassmorphism upload hero ──────────────────────────────────── */}
        <section className="animate-fade-in">
          <div
            className={cn('relative rounded-3xl overflow-hidden transition-all duration-300', !scanLocked && 'cursor-pointer group')}
            onClick={() => !scanLocked && fileInputRef.current?.click()}
          >
            {/* Gradient border glow layer */}
            <div className={cn(
              'absolute -inset-[1px] rounded-3xl z-0',
              isFlash
                ? 'bg-gradient-to-br from-amber-400/50 via-orange-400/25 to-amber-400/50'
                : 'bg-gradient-to-br from-indigo-400/50 via-purple-400/25 to-indigo-400/50',
              'opacity-0 transition-opacity duration-500',
              !scanLocked && 'group-hover:opacity-100',
              isScanning && 'opacity-50 animate-pulse',
            )} />

            {/* Surface */}
            <div className={cn(
              'relative z-10 rounded-3xl p-8 overflow-hidden',
              'bg-white/75 dark:bg-slate-900/55',
              'backdrop-blur-2xl',
              'border border-slate-200/90 dark:border-slate-700/50',
              'shadow-xl shadow-slate-200/50 dark:shadow-black/30',
              'transition-all duration-300',
              !scanLocked && (isFlash
                ? 'group-hover:border-amber-300/70 dark:group-hover:border-amber-600/40 group-hover:shadow-2xl group-hover:shadow-amber-100/50 dark:group-hover:shadow-amber-900/20'
                : 'group-hover:border-indigo-300/70 dark:group-hover:border-indigo-600/40 group-hover:shadow-2xl group-hover:shadow-indigo-100/50 dark:group-hover:shadow-indigo-900/20'
              ),
            )}>
              {/* Dot-grid texture */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.035]"
                style={{
                  backgroundImage: `radial-gradient(circle, ${isFlash ? '#f59e0b' : '#6366f1'} 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative flex flex-col items-center gap-5 text-center">
                {/* Icon */}
                <div className="relative">
                  <div className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center',
                    isFlash
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50/80 dark:from-amber-500/12 dark:to-orange-500/8 border border-amber-100 dark:border-amber-800/40'
                      : 'bg-gradient-to-br from-indigo-50 to-purple-50/80 dark:from-indigo-500/12 dark:to-purple-500/8 border border-indigo-100 dark:border-indigo-800/40',
                    'transition-transform duration-300',
                    !scanLocked && 'group-hover:scale-[1.06]',
                  )}>
                    {isScanning
                      ? <Loader2 className={cn('w-9 h-9 animate-spin', isFlash ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400')} />
                      : <Camera  className={cn('w-9 h-9', isFlash ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-500 dark:text-indigo-400')} />
                    }
                  </div>
                  <div className={cn(
                    'absolute inset-0 rounded-2xl blur-2xl scale-110 -z-10',
                    isFlash ? 'bg-amber-400/15' : 'bg-indigo-400/15',
                  )} />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                    {isScanning ? 'Analyzing\u2026' : 'Scan a Business Card'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    {isScanning
                      ? `Running two-pass AI extraction with ${isFlash ? 'Flash‑Lite' : 'Flash'}`
                      : 'Take a photo or choose from your library'}
                  </p>
                </div>

                {/* Flash mode notice banner */}
                {isFlash && !isScanning && (
                  <div className={cn(
                    'w-full max-w-xs rounded-2xl px-3 py-2',
                    'bg-amber-50/80 dark:bg-amber-950/30',
                    'border border-amber-200/70 dark:border-amber-800/40',
                    'flex items-center gap-2',
                  )}>
                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      Flash mode active — faster, slightly lower precision
                    </span>
                  </div>
                )}

                {/* Workflow badges (idle only) */}
                {appState === 'idle' && !isFlash && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { icon: <Camera      className="w-3 h-3" />, label: 'Capture'   },
                      { icon: <Zap         className="w-3 h-3" />, label: 'Extract'   },
                      { icon: <Sparkles    className="w-3 h-3" />, label: 'Verify'    },
                      { icon: <CloudUpload className="w-3 h-3" />, label: 'Sync'      },
                    ].map(({ icon, label }, i) => (
                      <span key={label} className={cn(
                        'animate-fade-in inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        'bg-slate-100/80 dark:bg-slate-800/60',
                        'text-slate-500 dark:text-slate-400',
                        'border border-slate-200/80 dark:border-slate-700/60',
                        i === 0 && 'delay-75',
                        i === 1 && 'delay-150',
                        i === 2 && 'delay-300',
                      )}>
                        {icon}{label}
                      </span>
                    ))}
                  </div>
                )}

                <Button
                  onClick={e => { e.stopPropagation(); if (!scanLocked) fileInputRef.current?.click(); }}
                  disabled={scanLocked}
                  variant={scanLocked ? 'outline' : isFlash ? 'outline' : 'primary'}
                  size="xl"
                  className={cn(
                    'w-full max-w-xs',
                    !scanLocked && isFlash && 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40',
                  )}
                >
                  {isScanning   ? <><Loader2 className="w-5 h-5 animate-spin" />Analyzing&hellip;</>
                  : cooldownSec > 0 ? <><Clock className="w-5 h-5" />Ready in {cooldownSec}s</>
                  : isFlash     ? <><Zap    className="w-5 h-5" />Scan with Flash</>
                  :               <><Camera className="w-5 h-5" />Scan Business Card</>}
                </Button>

                <p className="text-xs text-slate-400 dark:text-slate-600">
                  Mobile: opens camera &nbsp;&bull;&nbsp; Desktop: choose file
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preview ─────────────────────────────────────────────────────── */}
        {imagePreview && (
          <Card className="animate-scale-in overflow-hidden shadow-md p-0">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Scanned card preview"
                className="w-full object-contain max-h-56 bg-slate-100 dark:bg-slate-800/60"
              />
              <div className="absolute top-2 right-2">
                <Badge variant={isFlash ? 'warning' : 'primary'} className="shadow-sm">
                  <Camera className="w-3 h-3" />Preview
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* ── Extracted data ───────────────────────────────────────────────── */}
        {isReview && (
          <section className="animate-slide-up flex flex-col gap-4">
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 py-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-[15px]">Extracted Data</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">
                      <Sparkles className="w-3 h-3" />AI Verified
                    </Badge>
                    <Badge variant={isFlash ? 'warning' : 'primary'}>
                      {isFlash
                        ? <><Zap      className="w-3 h-3" />Flash</>
                        : <><Sparkles className="w-3 h-3" />Pro</>
                      }
                    </Badge>
                    <span className="text-xs text-slate-400 dark:text-slate-600">Tap to edit</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <CardDataTable
                  data={cardData}
                  onChange={(f, v) => setCardData(p => ({ ...p, [f]: v }))}
                  disabled={isSyncing}
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              {appState !== 'done' && (
                <Button
                  onClick={handleSync}
                  disabled={isSyncing}
                  variant={isSyncing ? 'outline' : 'success'}
                  size="xl"
                  className="flex-1"
                >
                  {isSyncing
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Syncing&hellip;</>
                    : <><CloudUpload className="w-5 h-5" />Sync to Google Sheets</>}
                </Button>
              )}
              <Button
                onClick={handleReset}
                disabled={isBusy}
                variant="ghost"
                size={appState === 'done' ? 'xl' : 'icon'}
                className={cn(appState === 'done' && 'flex-1')}
              >
                {appState === 'done'
                  ? <><RotateCcw className="w-4 h-4" />Scan Another Card</>
                  : <RotateCcw className="w-4 h-4" />}
              </Button>
            </div>
          </section>
        )}

        {/* ── Success banner ───────────────────────────────────────────────── */}
        {appState === 'done' && (
          <div className={cn(
            'animate-scale-in rounded-2xl px-4 py-4',
            'bg-gradient-to-r from-emerald-50 to-teal-50/60',
            'dark:from-emerald-950/25 dark:to-teal-950/20',
            'border border-emerald-200 dark:border-emerald-800/40',
          )}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Saved successfully
                </p>
                <p className="text-xs text-emerald-700/70 dark:text-emerald-600 mt-0.5">
                  Image archived in Google Drive &bull; Row synced to Google Sheets
                </p>
                {cardData.imageLink && (
                  <a
                    href={cardData.imageLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />View image in Drive
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {appState === 'idle' && (
          <div className="animate-fade-in delay-150 py-6 flex flex-col items-center gap-3">
            <div className="flex flex-col gap-2 w-full opacity-50">
              {[80, 60, 70, 50].map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-800 dark:to-transparent" style={{ width: `${w}%` }} />
              ))}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-600 text-center max-w-[200px] leading-relaxed">
              Point your camera at a business card to begin
            </p>
          </div>
        )}

      </main>

      <StatusToast messages={toasts} onDismiss={dismissToast} />

      {/* ── Model fallback modal ─────────────────────────────────────────── */}
      {showFallbackModal && (
        <ModelFallbackModal
          onContinueWithFlash={handleContinueWithFlash}
          onWait={handleWaitForTomorrow}
        />
      )}

    </div>
  );
}
