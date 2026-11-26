import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  BabushkaProfile,
  BabushkaRuntime,
  BowlingHudState,
  FillingType,
  GameMode,
  GameState,
  PirozhokInventory,
  RewardResult,
  TargetPrompt,
} from './types/game';
import {
  BABUSHKAS,
  FILLINGS,
  FILLING_ORDER,
  MEME_GALLERY_IMAGES,
} from './data/gameData';
import { Village3DView } from './components/Village3DView';
import { LipBrushMinigame } from './components/LipBrushMinigame';
import { soundEngine } from './utils/sound';
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  CupSoda,
  Cookie,
  Flame,
  Flag,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Target,
} from 'lucide-react';

const SHIFT_DURATION = 90;

const INITIAL_INVENTORY: PirozhokInventory = {
  cabbage: 3,
  potato: 3,
  cherry: 3,
  meat: 3,
};

function createInitialBabushkaStates(): Record<string, BabushkaRuntime> {
  const states: Record<string, BabushkaRuntime> = {};
  BABUSHKAS.forEach((b) => {
    states[b.id] = {
      id: b.id,
      craving: b.defaultCraving,
      cooldownRemaining: 0,
      fedCount: 0,
    };
  });
  return states;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [gameMode, setGameMode] = useState<GameMode>('SHIFT');
  const [timeLeft, setTimeLeft] = useState<number>(SHIFT_DURATION);
  const [muted, setMuted] = useState<boolean>(false);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const [inventory, setInventory] = useState<PirozhokInventory>({ ...INITIAL_INVENTORY });
  const [gazyava, setGazyava] = useState<number>(0);
  const [kiriki, setKiriki] = useState<number>(0);
  const [totalEarnedGazyava, setTotalEarnedGazyava] = useState<number>(0);
  const [totalEarnedKiriki, setTotalEarnedKiriki] = useState<number>(0);
  const [babushkasFed, setBabushkasFed] = useState<number>(0);

  const [babushkaStates, setBabushkaStates] = useState<Record<string, BabushkaRuntime>>(
    createInitialBabushkaStates
  );
  const [activeBabushka, setActiveBabushka] = useState<BabushkaProfile | null>(null);
  const [targetPrompt, setTargetPrompt] = useState<TargetPrompt | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    tone: 'emerald' | 'amber' | 'red';
  } | null>(null);

  const [bowlingHud, setBowlingHud] = useState<BowlingHudState>({
    aimAngle: 0,
    power: 1,
    phase: 'AIMING',
    pinsKnocked: 0,
    totalPins: 6,
    throwsLeft: 3,
    lastRewardGazyava: 0,
    lastRewardKiriki: 0,
  });

  const [gazyavaBoostTimer, setGazyavaBoostTimer] = useState<number>(0);
  const [kirikiBuffTimer, setKirikiBuffTimer] = useState<number>(0);

  const virtualInputRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const interactTriggerRef = useRef<(() => void) | null>(null);
  const bowlLaunchRef = useRef<(() => void) | null>(null);
  const toastTimeoutRef = useRef<number>(0);

  const showToast = useCallback((text: string, tone: 'emerald' | 'amber' | 'red' = 'amber') => {
    clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, tone });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  }, []);

  const startGame = useCallback(
    (selectedMode: GameMode = gameMode) => {
      soundEngine.unlock();
      soundEngine.playInteract();
      setGameMode(selectedMode);
      setTimeLeft(SHIFT_DURATION);
      setInventory({ ...INITIAL_INVENTORY });
      setGazyava(0);
      setKiriki(0);
      setTotalEarnedGazyava(0);
      setTotalEarnedKiriki(0);
      setBabushkasFed(0);
      setBabushkaStates(createInitialBabushkaStates());
      setActiveBabushka(null);
      setTargetPrompt(null);
      setToastMessage(null);
      setGazyavaBoostTimer(0);
      setKirikiBuffTimer(0);
      setGameState('PLAYING');
    },
    [gameMode]
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleUseGazyavaBoost = useCallback(() => {
    if (gameState !== 'PLAYING' || gazyava <= 0) return;
    soundEngine.playSodaFizz();
    setGazyava((g) => Math.max(0, g - 1));
    setGazyavaBoostTimer(8);
    showToast('Турбо-бег от Газявы активирован на 8с!', 'emerald');
  }, [gameState, gazyava, showToast]);

  const handleUseKirikiBuff = useCallback(() => {
    if (gameState !== 'PLAYING' || kiriki <= 0) return;
    soundEngine.playCrunch();
    setKiriki((k) => Math.max(0, k - 1));
    setKirikiBuffTimer(12);
    showToast('Хруст Кириков: +2 к каждой награде на 12с!', 'amber');
  }, [gameState, kiriki, showToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'PLAYING') {
        if (e.code === 'KeyP') {
          e.preventDefault();
          setGameState('PAUSED');
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          setDockCollapsed((c) => !c);
        } else if (e.code === 'Digit1') {
          e.preventDefault();
          handleUseGazyavaBoost();
        } else if (e.code === 'Digit2') {
          e.preventDefault();
          handleUseKirikiBuff();
        }
      } else if (gameState === 'PAUSED') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleUseGazyavaBoost, handleUseKirikiBuff]);

  const handleStepTimer = useCallback(
    (dt: number) => {
      if (gameMode === 'SHIFT') {
        setTimeLeft((prev) => {
          const next = prev - dt;
          if (next <= 0) {
            setGameState('GAME_OVER');
            return 0;
          }
          return next;
        });
      }

      setGazyavaBoostTimer((t) => (t > 0 ? Math.max(0, t - dt) : 0));
      setKirikiBuffTimer((t) => (t > 0 ? Math.max(0, t - dt) : 0));

      setBabushkaStates((prev) => {
        let changed = false;
        const next: Record<string, BabushkaRuntime> = {};
        for (const key of Object.keys(prev)) {
          const b = prev[key];
          if (b.cooldownRemaining > 0) {
            changed = true;
            next[key] = {
              ...b,
              cooldownRemaining: Math.max(0, b.cooldownRemaining - dt),
            };
          } else {
            next[key] = b;
          }
        }
        return changed ? next : prev;
      });
    },
    [gameMode]
  );

  const handleInteractBakery = useCallback(() => {
    soundEngine.playBakeRestock();
    setInventory({
      cabbage: 3,
      potato: 3,
      cherry: 3,
      meat: 3,
    });
    showToast('Поднос полон горячих пирожков!', 'amber');
  }, [showToast]);

  const handleInteractBabushka = useCallback((babushka: BabushkaProfile) => {
    soundEngine.playInteract();
    setActiveBabushka(babushka);
    setGameState('MINIGAME');
  }, []);

  const handleEnterBowling = useCallback(() => {
    soundEngine.playInteract();
    soundEngine.speakRussian('Садись рядом, щас запустим бабушек в страйк!', {
      pitch: 1.28,
      priority: true,
    });
    setGameState('BOWLING');
  }, []);

  const handleExitBowling = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleBowlingResult = useCallback(
    (pinsKnocked: number, isStrike: boolean) => {
      if (pinsKnocked > 0 || isStrike) {
        soundEngine.playReward();
      }
      const bonus = isStrike ? 4 : 0;
      const earnedG = pinsKnocked + bonus;
      const earnedK = pinsKnocked + bonus;
      if (earnedG > 0) {
        setGazyava((g) => g + earnedG);
        setKiriki((k) => k + earnedK);
        setTotalEarnedGazyava((g) => g + earnedG);
        setTotalEarnedKiriki((k) => k + earnedK);
      }
      if (isStrike) {
        soundEngine.speakRussian('СТРАЙК! ВОТ ЭТО БРОСОК!', {
          pitch: 1.35,
          priority: true,
        });
        showToast(`СТРАЙК! +${earnedG} Газявы и +${earnedK} Кириков!`, 'emerald');
      } else if (pinsKnocked > 0) {
        showToast(
          `Сбито ${pinsKnocked}! +${earnedG} Газявы и +${earnedK} Кириков`,
          'emerald'
        );
      } else {
        showToast('Мимо банок! Попробуй ещё раз!', 'amber');
      }
    },
    [showToast]
  );

  const handleMinigameComplete = useCallback(
    (result: RewardResult) => {
      if (!activeBabushka) return;

      setInventory((prev) => ({
        ...prev,
        [result.fillingUsed]: Math.max(0, prev[result.fillingUsed] - 1),
      }));

      setGazyava((g) => g + result.gazyava);
      setKiriki((k) => k + result.kiriki);
      setTotalEarnedGazyava((g) => g + result.gazyava);
      setTotalEarnedKiriki((k) => k + result.kiriki);
      setBabushkasFed((c) => c + 1);

      const nextCraving: FillingType =
        FILLING_ORDER[Math.floor(Math.random() * FILLING_ORDER.length)];
      setBabushkaStates((prev) => ({
        ...prev,
        [activeBabushka.id]: {
          ...prev[activeBabushka.id],
          craving: nextCraving,
          cooldownRemaining: 6,
          fedCount: prev[activeBabushka.id].fedCount + 1,
        },
      }));

      showToast(
        `${activeBabushka.name}: +${result.gazyava} Газява, +${result.kiriki} Кирики!`,
        'emerald'
      );

      setActiveBabushka(null);
      setGameState('PLAYING');
    },
    [activeBabushka, showToast]
  );

  const handleMinigameCancel = useCallback(() => {
    setActiveBabushka(null);
    setGameState('PLAYING');
  }, []);

  const handlePitbikerAlert = useCallback(
    (msg: string) => {
      showToast(msg, 'red');
    },
    [showToast]
  );

  const totalPirozhki =
    inventory.cabbage + inventory.potato + inventory.cherry + inventory.meat;

  const formatTime = (sec: number) => {
    const s = Math.ceil(sec);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const setVirtualDir = (dx: number, dy: number) => {
    virtualInputRef.current = { dx, dy };
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#16191D] text-[#F5F2EB] flex flex-col">
      {/* Top Bar HUD */}
      <header className="w-full shrink-0 border-b border-[#272C35] bg-[#1B1F26] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-display text-lg font-bold tracking-tight text-[#FAF7F2] whitespace-nowrap">
              Пирожковый Двор 3D
            </span>
          </div>

          {gameState !== 'TITLE_MENU' && (
            <div className="flex items-center gap-4 sm:gap-6 text-sm overflow-x-auto">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-stone-400 text-xs">Пирожки:</span>
                <span className="font-mono-tabular font-bold text-amber-400">
                  {totalPirozhki}
                </span>
              </div>

              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <CupSoda className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-stone-400 text-xs">Газява:</span>
                <span className="font-mono-tabular font-bold text-emerald-300">
                  {gazyava}
                </span>
              </div>

              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Cookie className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-stone-400 text-xs">Кирики:</span>
                <span className="font-mono-tabular font-bold text-amber-300">
                  {kiriki}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-stone-400 text-xs">Время:</span>
                <span
                  className={`font-mono-tabular font-bold ${
                    gameMode === 'SHIFT' && timeLeft <= 15
                      ? 'text-red-400'
                      : 'text-[#FAF7F2]'
                  }`}
                >
                  {gameMode === 'SHIFT' ? formatTime(timeLeft) : 'Свободно'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-lg bg-[#252A34] hover:bg-[#313845] text-stone-200 transition-colors cursor-pointer"
              aria-label={muted ? 'Включить звук' : 'Выключить звук'}
              title={muted ? 'Включить звук' : 'Выключить звук'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {(gameState === 'PLAYING' || gameState === 'BOWLING') && (
              <>
                {gameMode === 'ENDLESS' && (
                  <button
                    type="button"
                    onClick={() => setGameState('GAME_OVER')}
                    className="px-3 py-1.5 rounded-lg bg-[#252A34] hover:bg-[#313845] text-xs font-semibold text-stone-200 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Завершить
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setGameState('PAUSED')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252A34] hover:bg-[#313845] text-xs font-semibold text-stone-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Пауза (P)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main 3D Stage */}
      <main className="relative flex-1 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {gameState === 'TITLE_MENU' ? (
          <section className="w-full max-w-5xl bg-[#FAF7F2] text-[#1E2229] rounded-2xl shadow-2xl border border-[#E2D9C8] p-6 sm:p-8 overflow-y-auto max-h-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-[#8A5A19] tracking-wide mb-1.5">
                    Открытый мир от первого лица · Озвучка · Боулинг
                  </p>
                  <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#1E2229] tracking-tight text-balance">
                    Пирожковый Двор 3D
                  </h1>
                  <p className="mt-2.5 text-sm sm:text-base text-[#4A443D] leading-relaxed">
                    Солнечный закатный район с мокрым асфальтом, пятиэтажками и жигулями! По
                    проспекту носятся разные мемные бабушки с озвучкой и слюнками, а за ними
                    гоняет <strong className="text-[#B91C1C]">бешеный питбайкер с Балтикой 0</strong>.
                    Угощай бабушек пирожками по губам на <strong>E</strong> или запускай
                    бабушек с лавочки в <strong>боулинг</strong>!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2D9C8]">
                  <div className="bg-[#F2ECE1] rounded-xl p-3.5">
                    <div className="font-mono-tabular text-xs font-bold text-[#8A5A19] mb-1">
                      W · A · S · D + МЫШЬ
                    </div>
                    <div className="text-sm font-semibold text-[#1E2229]">
                      Открытый 3D-район
                    </div>
                    <p className="text-xs text-[#645C52] mt-1">
                      Изучай проспект, уворачивайся от питбайка и заглядывай в пекарню.
                    </p>
                  </div>

                  <div className="bg-[#F2ECE1] rounded-xl p-3.5">
                    <div className="font-mono-tabular text-xs font-bold text-[#0F766E] mb-1">
                      КЛАВИША E
                    </div>
                    <div className="text-sm font-semibold text-[#1E2229]">
                      Водить пирожком
                    </div>
                    <p className="text-xs text-[#645C52] mt-1">
                      Разные мемные бабушки с озвучкой фраз дарят газяву и кирики.
                    </p>
                  </div>

                  <div className="bg-[#F2ECE1] rounded-xl p-3.5">
                    <div className="font-mono-tabular text-xs font-bold text-[#1D4ED8] mb-1">
                      ЛАВКА БОУЛИНГА
                    </div>
                    <div className="text-sm font-semibold text-[#1E2229]">
                      Бабушко-боулинг
                    </div>
                    <p className="text-xs text-[#645C52] mt-1">
                      Подойди к лавочке слева на аллее, нажми E и сбивай банки Балтики 0!
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E2D9C8]">
                  <div className="flex items-center gap-1 p-1 bg-[#EAE2D3] rounded-lg self-start">
                    <button
                      type="button"
                      onClick={() => setGameMode('SHIFT')}
                      className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        gameMode === 'SHIFT'
                          ? 'bg-white text-[#1E2229] shadow-xs'
                          : 'text-[#574F45] hover:text-[#1E2229]'
                      }`}
                    >
                      Смена (90 сек)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGameMode('ENDLESS')}
                      className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        gameMode === 'ENDLESS'
                          ? 'bg-white text-[#1E2229] shadow-xs'
                          : 'text-[#574F45] hover:text-[#1E2229]'
                      }`}
                    >
                      Свободный мир
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => startGame(gameMode)}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-display font-bold text-base transition-colors cursor-pointer whitespace-nowrap shadow-md"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Войти в открытый мир
                  </button>
                </div>
              </div>

              {/* 4 Distinct Meme Babushkas Gallery */}
              <div className="lg:col-span-5">
                <div className="grid grid-cols-2 gap-2.5">
                  {MEME_GALLERY_IMAGES.slice(0, 4).map((src, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl overflow-hidden border border-[#D8CEBE] shadow-md bg-[#E5DCCF] aspect-square"
                    >
                      <img
                        src={src}
                        alt={`Мемная бабушка ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover block"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#645C52] mt-2 text-center">
                  У каждой бабушки свой мемный образ и живая озвучка
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div className="relative w-full h-full">
            <Village3DView
              isPlaying={gameState === 'PLAYING'}
              isBowling={gameState === 'BOWLING'}
              babushkaStates={babushkaStates}
              inventory={inventory}
              gazyavaBoostActive={gazyavaBoostTimer > 0}
              onInteractBabushka={handleInteractBabushka}
              onInteractBakery={handleInteractBakery}
              onEnterBowling={handleEnterBowling}
              onExitBowling={handleExitBowling}
              onBowlingResult={handleBowlingResult}
              onBowlingHudUpdate={setBowlingHud}
              onStepTimer={handleStepTimer}
              onTargetChange={setTargetPrompt}
              onPitbikerAlert={handlePitbikerAlert}
              virtualInputRef={virtualInputRef}
              interactTriggerRef={interactTriggerRef}
              bowlLaunchRef={bowlLaunchRef}
            />

            {/* Floating Event Toast */}
            {toastMessage && (gameState === 'PLAYING' || gameState === 'BOWLING') && (
              <div
                className={`pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-xs font-bold shadow-lg border whitespace-nowrap z-20 ${
                  toastMessage.tone === 'emerald'
                    ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60'
                    : toastMessage.tone === 'red'
                    ? 'bg-red-950/95 text-red-200 border-red-500/60'
                    : 'bg-[#1B1F26]/95 text-amber-200 border-amber-500/60'
                }`}
              >
                {toastMessage.text}
              </div>
            )}

            {/* Bowling Mode HUD Overlay */}
            {gameState === 'BOWLING' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                <div className="bg-[#1B1F26]/95 border border-sky-500/60 rounded-xl px-5 py-3 shadow-2xl flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <span className="font-display font-bold text-sm text-white">
                      Бабушко-боулинг на лавочке
                    </span>
                  </div>
                  <div className="text-stone-300">
                    Сбито:{' '}
                    <strong className="font-mono-tabular text-sky-300">
                      {bowlingHud.pinsKnocked}/{bowlingHud.totalPins}
                    </strong>
                  </div>
                  <div className="text-stone-300">
                    Броски:{' '}
                    <strong className="font-mono-tabular text-amber-300">
                      {bowlingHud.throwsLeft}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleExitBowling}
                    className="px-3 py-1.5 rounded-lg bg-[#2A303C] hover:bg-[#3A4252] text-white font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Встать с лавки (Esc)
                  </button>
                </div>

                {bowlingHud.phase === 'AIMING' && (
                  <button
                    type="button"
                    onClick={() => bowlLaunchRef.current?.()}
                    className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-[#0F172A] font-display font-bold text-sm shadow-lg cursor-pointer whitespace-nowrap"
                  >
                    Запустить бабушку! (Space / Клик / E · Прицел: Мышка или A / D)
                  </button>
                )}
              </div>
            )}

            {/* Center [E] Interaction Prompt */}
            {targetPrompt && gameState === 'PLAYING' && (
              <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
                <div
                  className={`px-4 py-2 rounded-lg text-sm font-bold shadow-xl border whitespace-nowrap ${
                    targetPrompt.canInteract
                      ? 'bg-[#16191D]/95 text-[#FAF7F2] border-emerald-400'
                      : 'bg-[#16191D]/90 text-stone-300 border-stone-500'
                  }`}
                >
                  {targetPrompt.label}
                </div>
              </div>
            )}

            {/* Collapsible Unified Bottom Control Dock */}
            {gameState !== 'BOWLING' && (
              <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 transition-transform duration-200 ${
                  dockCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
                }`}
                style={{ maxWidth: 'min(920px, 94vw)', width: '100%' }}
              >
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setDockCollapsed((c) => !c)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-t-lg bg-[#1B1F26]/95 border border-b-0 border-[#2F3540] text-[11px] font-semibold text-stone-300 hover:text-white cursor-pointer"
                  >
                    {dockCollapsed ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Показать панель (H)
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Скрыть панель (H)
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-[#1B1F26]/95 border border-[#2F3540] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="text-stone-400 font-semibold">На подносе:</span>
                    {FILLING_ORDER.map((fId) => {
                      const info = FILLINGS[fId];
                      return (
                        <span
                          key={fId}
                          className="inline-flex items-center gap-1.5 text-stone-200 whitespace-nowrap"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-xs inline-block"
                            style={{ backgroundColor: info.fillingColor }}
                            aria-hidden="true"
                          />
                          <span>{info.shortLabel}:</span>
                          <strong className="font-mono-tabular text-amber-300">
                            {inventory[fId]}
                          </strong>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={gazyava <= 0 || gameState !== 'PLAYING'}
                      onClick={handleUseGazyavaBoost}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-xs font-semibold text-emerald-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      {gazyavaBoostTimer > 0
                        ? `Турбо-бег: ${Math.ceil(gazyavaBoostTimer)}с`
                        : '[1] Выпить Газяву (-1)'}
                    </button>

                    <button
                      type="button"
                      disabled={kiriki <= 0 || gameState !== 'PLAYING'}
                      onClick={handleUseKirikiBuff}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-700/60 text-xs font-semibold text-amber-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      <Cookie className="w-3.5 h-3.5 text-amber-400" />
                      {kirikiBuffTimer > 0
                        ? `Бонус к награде: ${Math.ceil(kirikiBuffTimer)}с`
                        : '[2] Хрустнуть Кириками (-1)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Touch Controls */}
            {gameState === 'PLAYING' && (
              <div className="sm:hidden absolute bottom-20 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto grid grid-cols-3 gap-1 w-32 bg-[#1B1F26]/90 p-1.5 rounded-xl border border-[#2F3540]">
                  <div />
                  <button
                    type="button"
                    onPointerDown={() => setVirtualDir(0, -1)}
                    onPointerUp={() => setVirtualDir(0, 0)}
                    onPointerLeave={() => setVirtualDir(0, 0)}
                    className="h-9 rounded-lg bg-[#252A34] active:bg-amber-500 active:text-black flex items-center justify-center"
                    aria-label="Вперёд"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div />
                  <button
                    type="button"
                    onPointerDown={() => setVirtualDir(-1, 0)}
                    onPointerUp={() => setVirtualDir(0, 0)}
                    onPointerLeave={() => setVirtualDir(0, 0)}
                    className="h-9 rounded-lg bg-[#252A34] active:bg-amber-500 active:text-black flex items-center justify-center"
                    aria-label="Влево"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setVirtualDir(0, 1)}
                    onPointerUp={() => setVirtualDir(0, 0)}
                    onPointerLeave={() => setVirtualDir(0, 0)}
                    className="h-9 rounded-lg bg-[#252A34] active:bg-amber-500 active:text-black flex items-center justify-center"
                    aria-label="Назад"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onPointerDown={() => setVirtualDir(1, 0)}
                    onPointerUp={() => setVirtualDir(0, 0)}
                    onPointerLeave={() => setVirtualDir(0, 0)}
                    className="h-9 rounded-lg bg-[#252A34] active:bg-amber-500 active:text-black flex items-center justify-center"
                    aria-label="Вправо"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => interactTriggerRef.current?.()}
                  className="pointer-events-auto h-12 px-4 rounded-xl bg-emerald-600 active:bg-emerald-500 text-white font-display font-bold text-sm shadow-lg whitespace-nowrap"
                >
                  Действие (E)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Interactive Lip-Brushing Minigame Modal */}
      {gameState === 'MINIGAME' && activeBabushka && (
        <LipBrushMinigame
          babushka={activeBabushka}
          craving={babushkaStates[activeBabushka.id]?.craving || 'cabbage'}
          inventory={inventory}
          kirikiBuffActive={kirikiBuffTimer > 0}
          onComplete={handleMinigameComplete}
          onCancel={handleMinigameCancel}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[#FAF7F2] text-[#1E2229] rounded-2xl p-6 shadow-2xl border border-[#E2D9C8] text-center space-y-5">
            <h2 className="font-display text-2xl font-bold">Пауза</h2>
            <p className="text-sm text-[#574F45]">
              Питбайкер с Балтикой 0 поставлен на ручник, а бабушки ждут пирожков.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setGameState('PLAYING')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Продолжить
              </button>
              <button
                type="button"
                onClick={() => startGame(gameMode)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EAE2D3] hover:bg-[#DDD3C1] text-[#1E2229] font-semibold text-sm transition-colors cursor-pointer"
              >
                Начать заново
              </button>
              <button
                type="button"
                onClick={() => setGameState('TITLE_MENU')}
                className="w-full py-2 px-4 text-xs font-semibold text-[#645C52] hover:text-[#1E2229] transition-colors cursor-pointer"
              >
                В главное меню
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Shift Summary Modal */}
      {gameState === 'GAME_OVER' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[#FAF7F2] text-[#1E2229] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#E2D9C8] text-center space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8A5A19] mb-1">
                <Flag className="w-3.5 h-3.5" />
                Итоги смены на районе
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                Ой Володя, вот это улов!
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F2ECE1] rounded-xl p-3.5">
                <div className="text-xs text-[#645C52] mb-1">Угощений</div>
                <div className="font-mono-tabular text-2xl font-bold text-[#1E2229]">
                  {babushkasFed}
                </div>
              </div>
              <div className="bg-[#ECFDF5] rounded-xl p-3.5 border border-emerald-200">
                <div className="text-xs text-emerald-800 mb-1">Газява</div>
                <div className="font-mono-tabular text-2xl font-bold text-emerald-700">
                  {totalEarnedGazyava}
                </div>
              </div>
              <div className="bg-[#FFFBEB] rounded-xl p-3.5 border border-amber-200">
                <div className="text-xs text-amber-800 mb-1">Кирики</div>
                <div className="font-mono-tabular text-2xl font-bold text-amber-700">
                  {totalEarnedKiriki}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => startGame(gameMode)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Играть снова
              </button>
              <button
                type="button"
                onClick={() => setGameState('TITLE_MENU')}
                className="py-3 px-5 rounded-xl bg-[#EAE2D3] hover:bg-[#DDD3C1] text-[#1E2229] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                Меню
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
