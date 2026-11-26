import { BabushkaProfile, FillingInfo, FillingType } from '../types/game';
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
