const { launch, newProfile, root } = require('./harness.cjs');
const path = require('node:path');
(async () => {
  const { application, page } = await launch(await newProfile());
  try {
    await page.setViewportSize({ width: 640, height: 427 });
    await new Promise(resolve => setTimeout(resolve, 1200));
    console.log(JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio, scale: getComputedStyle(document.documentElement).getPropertyValue('--pc-menu-scale'), controls: ['.char-scene-container', '#confirm-hero-btn', '#char-language-btn', '#open-bestiary-btn', '#open-talents-btn', '#char-dossier-wing'].map(selector => { const el = document.querySelector(selector); const r = el?.getBoundingClientRect(); return { selector, rect: r?.toJSON(), zoom: el && getComputedStyle(el).zoom, width: el && getComputedStyle(el).width }; }) })), null, 2));
    await page.screenshot({ path: path.join(root, 'test-results', 'layout-diagnostic.png') });
  } finally { await application.close(); }
})();
