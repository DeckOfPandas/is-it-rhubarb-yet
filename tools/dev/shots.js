// The design-review screenshot set: full-page shots of the kitchen sink,
// home in each search state, a food page for every verdict and kind, Now
// for this week and next, the calendar, the wheel, About and the 404, at
// 390, 820 and 1280 wide, light and dark, with the clock frozen on one day.
//
// USAGE:
//   node tools/dev/shots.js [--base <url>] [--date YYYY-MM-DD] [--out <dir>] [--full yes]
//
//   --base  the running site, baseurl included (default
//           http://localhost:9000/is-it-rhubarb-yet/)
//   --date  the day the browser believes it is (default 2026-10-25), at
//           noon; the pages recompute their verdicts for it
//   --out   where the PNGs go (default screenshots/, which is gitignored)
//   --full  yes takes every shot at both widths in both themes; without it
//           the kitchen sink is taken at 1280 only, and only the shots
//           marked both below are taken light as well as dark
//
// Shots are named <page>-<state>-<width>-<theme>.png, as
// home-search-never-390-dark.png. The food pages are picked for the date
// from the site's own foods.json and assets/verdict.js: the first food in
// data order that is YES, NO, JUST and NEARLY (not rhubarb), the first
// never-food, rhubarb itself, the first food with a buy note and the first
// whose source is general. Motion is reduced, so the wheel's hand and the
// hero's caret hold still.
//
// Needs WITH_PLAYWRIGHT=1 in kit.env and a site being served.
const fs = require('fs');
const path = require('path');
const V = require('../../assets/verdict.js');

const WIDTHS = [390, 820, 1280];
const THEMES = ['light', 'dark'];

function parse(argv) {
  const opts = { base: 'http://localhost:9000/is-it-rhubarb-yet/', date: '2026-10-25', out: 'screenshots', full: 'no' };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    if (!(key in opts) || argv[i + 1] === undefined) usage(`unknown or empty option '${argv[i]}'`);
    opts[key] = argv[++i];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.date)) usage(`--date is YYYY-MM-DD, not '${opts.date}'`);
  if (!['yes', 'no'].includes(opts.full)) usage(`--full is yes or no, not '${opts.full}'`);
  opts.full = opts.full === 'yes';
  if (!opts.base.endsWith('/')) opts.base += '/';
  return opts;
}
function usage(message) {
  console.error(`shots.js: ${message}\nusage: node tools/dev/shots.js [--base <url>] [--date YYYY-MM-DD] [--out <dir>]`);
  process.exit(2);
}

// The food pages to photograph, chosen for the day.
async function pickFoods(base, day) {
  const foods = await (await fetch(base + 'foods.json')).json();
  const search = await (await fetch(base + 'search.json')).json();
  const week = V.weekOf(day);
  const first = (test) => foods.find((f) => f.slug !== 'rhubarb' && test(f));
  const picks = [];
  for (const verdict of ['YES', 'NO', 'JUST', 'NEARLY']) {
    const f = first((x) => V.foodVerdict(x, week).verdict === verdict);
    if (f) picks.push([`food-${verdict.toLowerCase()}-${f.slug}`, f.slug, true]);
  }
  const never = search.find((i) => i.never);
  if (never) picks.push([`food-never-${never.slug}`, never.slug, true]);
  picks.push(['food-varieties-rhubarb', 'rhubarb', true]);
  const buy = first((f) => f.buy);
  if (buy) picks.push([`food-buy-${buy.slug}`, buy.slug, false]);
  const general = first((f) => f.source === 'general');
  if (general) picks.push([`food-general-${general.slug}`, general.slug, false]);
  return picks;
}

(async () => {
  const opts = parse(process.argv.slice(2));
  const day = new Date(`${opts.date}T12:00:00`);
  const foodPages = await pickFoods(opts.base, day);
  const { chromium } = require('playwright');
  fs.mkdirSync(opts.out, { recursive: true });
  const browser = await chromium.launch();
  let failed = false, count = 0;

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
      await context.clock.install({ time: day });
      const page = await context.newPage();
      // both: taken light as well as dark. wide: taken at 1280 only.
      async function shot(name, url, { both = false, wide = false, act } = {}) {
        if (!opts.full && ((theme === 'light' && !both) || (wide && width !== 1280))) return;
        const file = path.join(opts.out, `${name}-${width}-${theme}.png`);
        try {
          await page.goto(opts.base + url, { waitUntil: 'networkidle' });
          if (act) await act();
          await page.waitForTimeout(400);
          await page.screenshot({ path: file, fullPage: true });
          count++;
        } catch (e) {
          failed = true;
          console.log(`${file} ERROR ${e.message.split('\n')[0]}`);
        }
      }
      const type = (text) => async () => {
        await page.fill('#hook-input', text);
        await page.waitForLoadState('networkidle');
      };

      await shot('kitchen-sink', 'kitchen-sink/', { both: true, wide: true });
      await shot('home-empty', '', { both: true });
      await shot('home-search-ghost', '', { act: type('avoc') });
      await shot('home-search-card', '', { both: true, act: type('basil') });
      await shot('home-search-also', '', { act: type('apples') });
      await shot('home-search-several', '', { act: type('app') });
      await shot('home-search-never', '', { both: true, act: type('banana') });
      await shot('home-search-unknown', '', { act: type('zzz') });
      for (const [name, slug, both] of foodPages) await shot(name, `${slug}/`, { both });
      await shot('now-this-week', 'now/', { both: true });
      await shot('now-next-week', 'now/', { both: true, act: async () => {
        await page.click('#next-week');
        await page.waitForLoadState('networkidle');
      } });
      await shot('calendar', 'calendar/', { both: true });
      await shot('wheel', 'wheel/');
      await shot('about', 'about/');
      await shot('404', 'not-a-food-at-all/');
      await context.close();
    }
  }
  await browser.close();
  console.log(`${count} shots for ${opts.date} in ${opts.out}/`);
  process.exit(failed ? 1 : 0);
})();
