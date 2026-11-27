import React, { useEffect, useState } from 'react';
import { PetrovichContract } from '../types/game';
import { PETROVICH_LINES } from '../data/gameData';
import { soundEngine } from '../utils/sound';
import { Briefcase, MapPin, PackageCheck, Coins, X, Hammer } from 'lucide-react';

interface PetrovichModalProps {
  money: number;
  stashes: number;
  contract: PetrovichContract;
  hasShare: boolean;
  incomeMultiplier: number;
  onSellStashes: () => void;
  onStartContract: () => void;
  onQuickShiftWork: () => void;
  onClose: () => void;
}

export const PetrovichModal: React.FC<PetrovichModalProps> = ({
  money,
  stashes,
  contract,
  hasShare,
  incomeMultiplier,
  onSellStashes,
  onStartContract,
  onQuickShiftWork,
  onClose,
}) => {
  const [quote, setQuote] = useState<string>(PETROVICH_LINES[0]);
  const [workProgress, setWorkProgress] = useState<number>(0);

  useEffect(() => {
    const line = PETROVICH_LINES[Math.floor(Math.random() * PETROVICH_LINES.length)];
    setQuote(line);
    soundEngine.speakRussian(line, { pitch: 0.72, rate: 0.98, priority: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const stashPrice = Math.round(350 * incomeMultiplier);
  const workReward = Math.round(140 * incomeMultiplier);

  const handlePackCrate = () => {
    soundEngine.playInteract();
    setWorkProgress((prev) => {
      const next = prev + 25;
      if (next >= 100) {
        onQuickShiftWork();
        return 0;
      }
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-[#181C22] text-[#F5F2EB] rounded-2xl border border-emerald-600/50 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-[#12161B] border-b border-[#2A313D] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Briefcase className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Подпольная контора Петровича
              </h2>
              <p className="text-xs text-stone-400">
                Тайники, развозка по точкам и подпольный заработок
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#252B36] hover:bg-[#323A49] text-stone-300 cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#202630] border border-[#2F3746] rounded-xl p-3.5 text-sm text-emerald-200 italic">
            «{quote}» — Петрович
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#202630] rounded-xl p-3 border border-[#2F3746]">
              <div className="text-[11px] text-stone-400">Наличные</div>
              <div className="font-mono-tabular text-lg font-bold text-emerald-400">
                {money.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            <div className="bg-[#202630] rounded-xl p-3 border border-[#2F3746]">
              <div className="text-[11px] text-stone-400">Закладки</div>
              <div className="font-mono-tabular text-lg font-bold text-purple-300">
                {stashes} шт.
              </div>
            </div>
            <div className="bg-[#202630] rounded-xl p-3 border border-[#2F3746]">
              <div className="text-[11px] text-stone-400">Пассив</div>
              <div className="font-mono-tabular text-lg font-bold text-amber-300">
                {hasShare ? '+200 ₽/8с' : 'Нет доли'}
              </div>
            </div>
          </div>

          {/* 1. Sell stashes */}
          <div className="flex items-center justify-between gap-4 bg-[#202630] rounded-xl p-4 border border-[#2F3746]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                <PackageCheck className="w-4 h-4 text-purple-400" />
                Сдать перехваченные закладки
              </div>
              <p className="text-xs text-stone-400">
                Отбирай свёртки у закладчиков во дворах или ищи тайники у кустов. По {stashPrice} ₽ за штуку.
              </p>
            </div>
            <button
              type="button"
              disabled={stashes <= 0}
              onClick={onSellStashes}
              className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              Сдать (+{(stashes * stashPrice).toLocaleString('ru-RU')} ₽)
            </button>
          </div>

          {/* 2. Delivery Run */}
          <div className="flex items-center justify-between gap-4 bg-[#202630] rounded-xl p-4 border border-[#2F3746]">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Развозка товара по 3 точкам
              </div>
              <p className="text-xs text-stone-400">
                {contract.active
                  ? `Активно: доставлено ${contract.delivered} из ${contract.total}. Ищи зелёные лучи в районе!`
                  : `Доставь 3 партии по зелёным маякам (удобнее на угнанной Жигуле!). Награда: ${Math.round(
                      1500 * incomeMultiplier
                    ).toLocaleString('ru-RU')} ₽.`}
              </p>
            </div>
            <button
              type="button"
              disabled={contract.active}
              onClick={() => {
                onStartContract();
                onClose();
              }}
              className="shrink-0 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              {contract.active ? 'В работе' : 'Взять заказ'}
            </button>
          </div>

          {/* 3. Quick warehouse packing */}
          <div className="bg-[#202630] rounded-xl p-4 border border-[#2F3746] space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-display font-bold text-sm text-white">
                  <Hammer className="w-4 h-4 text-amber-400" />
                  Фасовка в подвале Петровича
                </div>
                <p className="text-xs text-stone-400">
                  Упакуй ящик (4 клика) и получи {workReward} ₽ наличными на руки.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePackCrate}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                <Coins className="w-3.5 h-3.5" />
                Упаковать (+{workReward} ₽)
              </button>
            </div>
            <div className="w-full h-2 rounded-full bg-[#12161B] overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${workProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
