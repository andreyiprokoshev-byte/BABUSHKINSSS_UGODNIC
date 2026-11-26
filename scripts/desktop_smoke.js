(() => {
  if (window.top !== window) return;

  async function waitFor(label, predicate) {
    const deadline = performance.now() + 15000;
    while (performance.now() < deadline) {
      const value = predicate();
      if (value) return value;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(label);
  }

  const button = (text) => [...document.querySelectorAll('button')]
    .find((element) => element.textContent.trim() === text);
  const toggleSound = (label) => document.querySelector(`button[aria-label="${label}"]`);
  const key = (code) => window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  const dialog = () => document.querySelector('[role="dialog"]');

  const drawCounts = new WeakMap();
  const webgl = window.WebGL2RenderingContext?.prototype;
  if (webgl) {
    for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const draw = webgl[method];
      webgl[method] = function (...args) {
        draw.apply(this, args);
        drawCounts.set(this.canvas, (drawCounts.get(this.canvas) ?? 0) + 1);
      };
    }
  }

  async function run() {
    await waitFor('title menu', () => button('Войти в открытый мир'));
    await waitFor('four local title images', () => {
      const images = [...document.querySelectorAll('main img')];
      return images.length === 4 && images.every((image) => image.complete && image.naturalWidth > 0);
    });
    toggleSound('Выключить звук').click();
    await waitFor('mute control', () => toggleSound('Включить звук'));

    button('Свободный мир').click();
    // The mode selection and launch are two separate React events.
    await waitFor('endless mode selected', () => button('Свободный мир')?.classList.contains('bg-white'));
    button('Войти в открытый мир').click();
    await waitFor('endless mode HUD', () => button('Завершить'));
    const canvas = await waitFor('world canvas', () => document.querySelector('main canvas'));
    const initialDraws = await waitFor('WebGL 2 scene draws', () => drawCounts.get(canvas));
    key('KeyW');
    await waitFor('continued rendering', () => drawCounts.get(canvas) > initialDraws);
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));

    key('KeyP');
    await waitFor('pause dialog', () => dialog()?.textContent.includes('Пауза'));
    key('KeyP');
    await waitFor('resume', () => !dialog() && button('Завершить'));
    button('Завершить').click();
    await waitFor('endless mode summary', () => dialog()?.textContent.includes('Итоги смены'));
    button('Меню').click();
    await waitFor('return to menu', () => button('Смена (90 сек)'));
    button('Смена (90 сек)').click();
    await waitFor('shift selected', () => button('Смена (90 сек)')?.classList.contains('bg-white'));
    button('Войти в открытый мир').click();
    await waitFor('shift clock', () => /01:\d\d/.test(document.querySelector('header')?.textContent));
  }

  run().then(
    () => { document.title = 'desktop-smoke: PASS'; },
    (error) => { document.title = `desktop-smoke: FAIL: ${error.message}`; },
  );
})();
