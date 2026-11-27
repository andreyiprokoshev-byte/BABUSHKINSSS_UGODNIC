import React, { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Tv, Volume1 } from 'lucide-react';

export const SOUNDTRACK_VIDEO_ID = 'lFj-UxmFQlM';
export const SOUNDTRACK_TITLE = 'DJ Бутылыч — ГАЗЯВА';
export const SOUNDTRACK_URL = `https://www.youtube.com/watch?v=${SOUNDTRACK_VIDEO_ID}`;

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      height?: string | number;
      width?: string | number;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
        onError?: (event: { data: number }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState?: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeIframeAPI(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('No window'));
  }
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }

  ytApiPromise = new Promise<YTNamespace>((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      if (window.YT) resolve(window.YT);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

interface YouTubeSoundtrackProps {
  muted: boolean;
  startSignal: number;
}

export const YouTubeSoundtrack: React.FC<YouTubeSoundtrackProps> = ({
  muted,
  startSignal,
}) => {
  const playerMountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const readyRef = useRef<boolean>(false);
  const desiredPlayingRef = useRef<boolean>(false);
  const volumeRef = useRef<number>(45);
  const mutedRef = useRef<boolean>(muted);
  mutedRef.current = muted;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(45);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [embedError, setEmbedError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled || !playerMountRef.current) return;

        playerRef.current = new YT.Player(playerMountRef.current, {
          width: '220',
          height: '124',
          videoId: SOUNDTRACK_VIDEO_ID,
          playerVars: {
            autoplay: 0,
            controls: 1,
            loop: 1,
            playlist: SOUNDTRACK_VIDEO_ID,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return;
              readyRef.current = true;
              e.target.setVolume(volumeRef.current);
              if (mutedRef.current) e.target.mute();
              else e.target.unMute();

              if (desiredPlayingRef.current) {
                try {
                  e.target.playVideo();
                } catch {
                  // Browser autoplay restriction until user clicks play
                }
              }
            },
            onStateChange: (e) => {
              if (cancelled) return;
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (e.data === 1) {
                setIsPlaying(true);
              } else if (e.data === 2) {
                setIsPlaying(false);
              } else if (e.data === 0) {
                e.target.seekTo(0, true);
                e.target.playVideo();
              }
            },
            onError: () => {
              if (cancelled) return;
              setEmbedError(true);
              setIsPlaying(false);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) setEmbedError(true);
      });

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Auto-start soundtrack when player enters the game via user click
  useEffect(() => {
    if (startSignal <= 0) return;
    desiredPlayingRef.current = true;
    if (readyRef.current && playerRef.current) {
      try {
        if (!mutedRef.current) playerRef.current.unMute();
        playerRef.current.setVolume(volumeRef.current);
        playerRef.current.playVideo();
      } catch {
        // Fallback to manual toggle
      }
    }
  }, [startSignal]);

  // Sync mute state
  useEffect(() => {
    if (!readyRef.current || !playerRef.current) return;
    if (muted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
      playerRef.current.setVolume(volumeRef.current);
    }
  }, [muted]);

  const togglePlay = () => {
    if (embedError) return;
    const next = !isPlaying;
    desiredPlayingRef.current = next;
    if (!readyRef.current || !playerRef.current) return;

    if (next) {
      if (!mutedRef.current) playerRef.current.unMute();
      playerRef.current.setVolume(volumeRef.current);
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  };

  const handleVolumeChange = (val: number) => {
    volumeRef.current = val;
    setVolume(val);
    if (readyRef.current && playerRef.current) {
      playerRef.current.setVolume(val);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 bg-[#252A34] border border-[#323946] rounded-lg px-2 py-1">
        {embedError ? (
          <a
            href={SOUNDTRACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 whitespace-nowrap px-1"
            title="Открыть трек на YouTube"
          >
            <Music className="w-3.5 h-3.5 shrink-0" />
            <span>{SOUNDTRACK_TITLE}</span>
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={togglePlay}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isPlaying
                  ? 'bg-emerald-600/25 text-emerald-300 hover:bg-emerald-600/35'
                  : 'text-stone-200 hover:bg-[#313845]'
              }`}
              title={isPlaying ? 'Пауза саундтрека' : 'Включить саундтрек'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              )}
              <span className="hidden lg:inline">{SOUNDTRACK_TITLE}</span>
              <span className="lg:hidden">ГАЗЯВА</span>
            </button>

            <div className="hidden md:flex items-center gap-1 pl-1 border-l border-[#374151]">
              <Volume1 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-14 accent-amber-500 cursor-pointer"
                aria-label="Громкость саундтрека"
                title={`Громкость музыки: ${volume}%`}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowVideo((v) => !v)}
              className={`p-1 rounded transition-colors cursor-pointer ${
                showVideo
                  ? 'bg-amber-500/25 text-amber-300'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-[#313845]'
              }`}
              title={showVideo ? 'Скрыть видео YouTube' : 'Показать мини-плеер YouTube'}
              aria-label="Показать или скрыть мини-плеер YouTube"
            >
              <Tv className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Persistent in-viewport container so YouTube playback stays active */}
      <div
        className={
          showVideo
            ? 'fixed top-16 right-4 z-40 rounded-xl overflow-hidden border border-[#3B4252] bg-[#111318] shadow-2xl'
            : 'fixed bottom-2 right-2 z-0 w-[220px] h-[124px] opacity-[0.01] pointer-events-none overflow-hidden'
        }
      >
        {showVideo && (
          <div className="flex items-center justify-between px-2.5 py-1 bg-[#1B1F26] border-b border-[#2F3540] text-[11px] font-semibold text-stone-200">
            <span className="truncate">{SOUNDTRACK_TITLE}</span>
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              className="text-stone-400 hover:text-white cursor-pointer ml-2"
            >
              Свернуть
            </button>
          </div>
        )}
        <div ref={playerMountRef} className="w-[220px] h-[124px]" />
      </div>
    </>
  );
};
