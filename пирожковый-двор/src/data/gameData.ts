import { BabushkaProfile, FillingInfo, FillingType, ShopItemDef } from '../types/game';
import zinaImg from '../assets/images/babushka_meme_zina_1795730784996.jpg';
import lyudaImg from '../assets/images/babushka_meme_lyuda_1795730787114.jpg';
import tomaImg from '../assets/images/babushka_meme_toma_1795730786812.jpg';
import valyaImg from '../assets/images/babushka_meme_valya_1795730787206.jpg';

export const MEME_REF_BABUSHKA_IMAGE =
  '/assets/aistudio/_876C17BF-3656-4F74-A4D2-9087136520EA__a25d3393.png';

export const MEME_GALLERY_IMAGES = [
  zinaImg,
  lyudaImg,
  tomaImg,
  valyaImg,
  MEME_REF_BABUSHKA_IMAGE,
];

export const ARENA_HALF_SIZE = 58;

export const FILLINGS: Record<FillingType, FillingInfo> = {
  cabbage: {
    id: 'cabbage',
    label: 'С капустой',
    shortLabel: 'Капуста',
    crustColor: '#D98A2B',
    fillingColor: '#76A647',
    steamTint: 'rgba(255, 248, 225, 0.75)',
  },
  potato: {
    id: 'potato',
    label: 'С картошкой',
    shortLabel: 'Картошка',
    crustColor: '#E09638',
    fillingColor: '#F3D26B',
    steamTint: 'rgba(255, 245, 214, 0.75)',
  },
  cherry: {
    id: 'cherry',
    label: 'С вишней',
    shortLabel: 'Вишня',
    crustColor: '#C97B2E',
    fillingColor: '#B82543',
    steamTint: 'rgba(255, 224, 230, 0.75)',
  },
  meat: {
    id: 'meat',
    label: 'С мясом',
    shortLabel: 'Мясо',
    crustColor: '#C67422',
    fillingColor: '#8B3F2B',
    steamTint: 'rgba(255, 238, 212, 0.75)',
  },
};

export const FILLING_ORDER: FillingType[] = ['cabbage', 'potato', 'cherry', 'meat'];

export const BABUSHKAS: BabushkaProfile[] = [
  {
    id: 'zina',
    name: 'Баба Зина',
    memeTag: 'ОЙ ВОЛОДЯ!',
    role: 'Легенда мемного района',
    imageUrl: zinaImg,
    voicePitch: 1.35,
    voiceRate: 1.08,
    startX: -12,
    startZ: -8,
    scarfColor: '#9E3224',
    coatColor: '#5B21B6',
    defaultCraving: 'cabbage',
    greetingLines: [
      'Ой Володя! Слюнки уже до асфальта текут — неси пирожок!',
      'Там питбайкер с нулёвкой гоняет, а я пирожок хочу!',
    ],
    brushingLines: [
      'Ой Володя, вот это корочка!',
      'Слюнки аж ручьём пошли, не останавливайся!',
      'Ещё по губкам поводи, родненький!',
    ],
    rewardLines: [
      'Ой Володя, уважил! Забирай газяву и кирики!',
      'Золотые руки! Держи лимонад с сухариками!',
    ],
    panicLines: [
      'Ай, питбайкер окаянный, с дороги!',
      'Ой Володя, держи этого гонщика с нулёвкой!',
    ],
  },
  {
    id: 'lyuda',
    name: 'Баба Люда',
    memeTag: 'НУ ЧТО ЗА КРАСОТА!',
    role: 'Модница в очках и бусах',
    imageUrl: lyudaImg,
    voicePitch: 1.22,
    voiceRate: 1.05,
    startX: 14,
    startZ: -10,
    scarfColor: '#7C2D66',
    coatColor: '#4338CA',
    defaultCraving: 'cherry',
    greetingLines: [
      'Ах, я чувствую вишнёвый аромат! Погладь мне губки пирожком!',
      'Слюнка уже капает, милок — угощай скорее!',
    ],
    brushingLines: [
      'Ммм, бальзам для души и губ!',
      'Води-води по краешку, сладенький!',
      'Ох, ну прямо как в лучших мемах!',
    ],
    rewardLines: [
      'Благодарствую, золотце! Вот тебе газява и хрустящие кирики!',
      'Уважил даму! Забирай шипучку и сухари!',
    ],
    panicLines: [
      'Очки слетят от этого питбайкера!',
      'Куда прёшь по тротуару, ирод с Балтикой!',
    ],
  },
  {
    id: 'toma',
    name: 'Баба Тома',
    memeTag: 'ГДЕ КАРТОШЕЧКА?',
    role: 'Королева бигудей',
    imageUrl: tomaImg,
    voicePitch: 1.42,
    voiceRate: 1.12,
    startX: -14,
    startZ: 14,
    scarfColor: '#2B6E5B',
    coatColor: '#374151',
    defaultCraving: 'potato',
    greetingLines: [
      'Я только бигуди накрутила, а слюнки уже бегут! Давай картошечку!',
      'Тащи тёпленький скорее к губам, пока гонщик не спугнул!',
    ],
    brushingLines: [
      'Ух ты, тёпленький! Губы аж пляшут!',
      'Туда-сюда, туда-сюда — вот это сервис!',
      'Аромат на весь проспект!',
    ],
    rewardLines: [
      'Красота! Лови газяву и пачку кириков!',
      'Молодец! На тебе полные карманы шипучки!',
    ],
    panicLines: [
      'Мои бигуди! Уберите этого питбайкера!',
      'Ой, сейчас наедет со своей нулёвкой!',
    ],
  },
  {
    id: 'valya',
    name: 'Баба Валя',
    memeTag: 'ДАВАЙ МЯСНОЙ!',
    role: 'Смотрящая за проспектом',
    imageUrl: valyaImg,
    voicePitch: 1.08,
    voiceRate: 1.02,
    startX: 16,
    startZ: 15,
    scarfColor: '#B45309',
    coatColor: '#7F1D1D',
    defaultCraving: 'meat',
    greetingLines: [
      'Очки приспустила — вижу твой пирожок! Давай сюда по губам!',
      'Слюна течёт, а время идёт — неси мясной!',
    ],
    brushingLines: [
      'О да, масляный бочок прямо по губам скользит!',
      'Не спеши, дай распробовать!',
      'Высший сорт, внучок!',
    ],
    rewardLines: [
      'Блестяще, внучок! Забирай лучшую газяву и свежие кирики!',
      'Настоящий мастер! Вот твои сокровища!',
    ],
    panicLines: [
      'Я те щас покажу, кто тут главный на районе!',
      'Шумахер деревенский, тормози!',
    ],
  },
];

export const BOWLING_BABUSHKA_IMAGES = [
  MEME_REF_BABUSHKA_IMAGE,
  zinaImg,
  tomaImg,
];

export const PITBIKER_SHOUTS = [
  'БРАААП! С ДОРОГИ, БАБКИ!',
  'БАЛТИКА НУЛЁВКА — ТОПЛИВО РАЙОНА!',
  'ЩАС КАК ПРОГАЗУЮ ПО ПРОСПЕКТУ!',
  'ВОЛОДЯ, НЕ ПУТАЙСЯ ПОД КОЛЁСАМИ!',
];

export const ZAKLADCHIK_LINES = [
  'Тихо-тихо, под кустик положил...',
  'Главное — чтобы бабки с лавки не спалили!',
  'Петрович сказал: закладка должна лежать ровно!',
  'Опа, кто-то палит, сваливаем дворами!',
];

export const PETROVICH_LINES = [
  'Здорово, Володя! Есть дело на районе — развезёшь товар по точкам?',
  'Видишь этих суетливых в капюшонах? Тащи их свёртки сюда — оплачу кэшем!',
  'Угоняй Жигуль и гони по точкам, тогда и бабки при деньгах будут!',
];

export const CAR_RIDE_LINES = [
  'Ой Володя! Жми на газ, ветер в платочке свистит!',
  'Вот это карета! Лучше всякого питбайка!',
  'Держи на бензин, сынок, прокати ещё кружок по проспекту!',
  'Смотри, как закладчики от нас разбегаются!',
];

export const SHOP_ITEMS: ShopItemDef[] = [
  {
    id: 'spare_pies',
    name: 'Пакет горячих пирожков',
    tierLabel: 'Мелочь',
    description: '+2 пирожка каждого вида прямо на поднос, чтобы не бегать в пекарню.',
    costMoney: 0,
    costGazyava: 3,
    costKiriki: 0,
    repeatable: true,
  },
  {
    id: 'seeds',
    name: 'Кулёк семечек от сглаза',
    tierLabel: 'Мелочь',
    description: '+15% к скорости бега навсегда (можно купить до 3 раз).',
    costMoney: 0,
    costGazyava: 0,
    costKiriki: 5,
    repeatable: true,
    maxStack: 3,
  },
  {
    id: 'energy_drink',
    name: 'Энергетик «Балтика Турбо»',
    tierLabel: 'Дёшево',
    description: 'Включает Турбо-бег на 20 секунд и защищает от столкновений на районе!',
    costMoney: 250,
    costGazyava: 0,
    costKiriki: 0,
    repeatable: true,
  },
  {
    id: 'rolling_pin',
    name: 'Золотая скалка тёти Любы',
    tierLabel: 'Средний класс',
    description: 'Навсегда ускоряет угощение бабушек пирожками по губам в 2 раза.',
    costMoney: 0,
    costGazyava: 10,
    costKiriki: 15,
    repeatable: false,
  },
  {
    id: 'fake_license',
    name: 'Липовые права категории Б',
    tierLabel: 'Средний класс',
    description: 'Угнанные Жигули едут на 40% быстрее и приносят больше денег за катание бабушек.',
    costMoney: 1200,
    costGazyava: 0,
    costKiriki: 0,
    repeatable: false,
  },
  {
    id: 'loot_magnet',
    name: 'Магнит для закладок и лута',
    tierLabel: 'Средний класс',
    description: 'Радиус подбора денег, закладок, газявы и кириков увеличен в 2.5 раза.',
    costMoney: 800,
    costGazyava: 18,
    costKiriki: 0,
    repeatable: false,
  },
  {
    id: 'golden_launcher',
    name: 'Золотой пирожкомёт',
    tierLabel: 'Дорого',
    description: 'Бросок пирожка на [Q / ПКМ] больше не тратит пирожки с подноса!',
    costMoney: 3500,
    costGazyava: 25,
    costKiriki: 0,
    repeatable: false,
  },
  {
    id: 'petrovich_share',
    name: 'Доля в фирме Петровича',
    tierLabel: 'Дорого',
    description: 'Пассивный доход +200 ₽ каждые 8 секунд прямо в карман.',
    costMoney: 4500,
    costGazyava: 0,
    costKiriki: 25,
    repeatable: false,
  },
  {
    id: 'diamond_fur_coat',
    name: 'Норковая шуба для всех бабушек',
    tierLabel: 'Люкс',
    description: 'Все бабушки в восторге: награда за угощение и поездки увеличена в 3 раза!',
    costMoney: 12000,
    costGazyava: 45,
    costKiriki: 45,
    repeatable: false,
  },
  {
    id: 'district_crown',
    name: 'Золотая корона «Король Района»',
    tierLabel: 'Легенда',
    description: 'Абсолютный статус легенды: 5× множитель на все доходы и вечное уважение.',
    costMoney: 25000,
    costGazyava: 75,
    costKiriki: 75,
    repeatable: false,
  },
];
