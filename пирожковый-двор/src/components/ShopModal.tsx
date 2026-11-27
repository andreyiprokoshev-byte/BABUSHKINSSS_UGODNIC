import React, { useEffect } from 'react';
import { ShopItemDef, ShopItemId } from '../types/game';
import { SHOP_ITEMS } from '../data/gameData';
import { Check, Cookie, CupSoda, ShoppingBag, X } from 'lucide-react';

interface ShopModalProps {
  money: number;
  gazyava: number;
  kiriki: number;
  ownedItems: Partial<Record<ShopItemId, number>>;
  onBuyItem: (item: ShopItemDef) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  money,
  gazyava,
  kiriki,
  ownedItems,
  onBuyItem,
  onClose,
}) => {
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

  const getTierBadgeStyle = (tier: string) => {
    if (tier === 'Легенда') return 'bg-amber-500/20 text-amber-300 border-amber-400/50';
    if (tier === 'Люкс') return 'bg-purple-500/20 text-purple-300 border-purple-400/50';
    if (tier === 'Дорого') return 'bg-rose-500/20 text-rose-300 border-rose-400/50';
    if (tier === 'Средний класс') return 'bg-sky-500/20 text-sky-300 border-sky-400/50';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl max-h-[88vh] bg-[#181C22] text-[#F5F2EB] rounded-2xl border border-sky-500/50 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 bg-[#12161B] border-b border-[#2A313D] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Магазин 24/7 «Всё для района»
              </h2>
              <p className="text-xs text-stone-400">
                Товары за кирики, газяву и деньги — от мелочи до элитных апгрейдов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="font-mono-tabular font-bold text-emerald-400">
              {money.toLocaleString('ru-RU')} ₽
            </span>
            <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-emerald-300">
              <CupSoda className="w-3.5 h-3.5" /> {gazyava}
            </span>
            <span className="inline-flex items-center gap-1 font-mono-tabular font-bold text-amber-300">
              <Cookie className="w-3.5 h-3.5" /> {kiriki}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#252B36] hover:bg-[#323A49] text-stone-300 cursor-pointer"
              aria-label="Закрыть магазин"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SHOP_ITEMS.map((item) => {
            const count = ownedItems[item.id] ?? 0;
            const maxed = item.repeatable
              ? item.maxStack !== undefined && count >= item.maxStack
              : count >= 1;
            const canAfford =
              money >= item.costMoney &&
              gazyava >= item.costGazyava &&
              kiriki >= item.costKiriki;

            return (
              <div
                key={item.id}
                className="bg-[#202630] border border-[#2F3746] rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTierBadgeStyle(
                        item.tierLabel
                      )}`}
                    >
                      {item.tierLabel}
                    </span>
                    {count > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-300 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {item.repeatable ? `Куплено: ${count}` : 'Куплено'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-sm text-white">{item.name}</h3>
                  <p className="text-xs text-stone-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2D3442]">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular font-bold">
                    {item.costMoney > 0 && (
                      <span className={money >= item.costMoney ? 'text-emerald-400' : 'text-red-400'}>
                        {item.costMoney.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                    {item.costGazyava > 0 && (
                      <span className={gazyava >= item.costGazyava ? 'text-emerald-300' : 'text-red-400'}>
                        {item.costGazyava} Газявы
                      </span>
                    )}
                    {item.costKiriki > 0 && (
                      <span className={kiriki >= item.costKiriki ? 'text-amber-300' : 'text-red-400'}>
                        {item.costKiriki} Кириков
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={maxed || !canAfford}
                    onClick={() => onBuyItem(item)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      maxed
                        ? 'bg-emerald-900/40 text-emerald-300 cursor-default'
                        : canAfford
                        ? 'bg-sky-600 hover:bg-sky-500 text-white'
                        : 'bg-[#2B323F] text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {maxed ? 'Максимум' : 'Купить'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
