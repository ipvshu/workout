// Telegram workout bot — Cloudflare Worker + Durable Object (one per chat).
// Secret needed: BOT_TOKEN. After deploy open https://<worker>/setup once.

const TZ = 'Europe/Berlin';
const MW = s => 'https://musclewiki.com/exercise/' + s;

const W = {
  w1: { t: 'Т1 · Грудь, плечи, квадрицепс', ex: [
    ['🔥 Разминка: дорожка 5 мин (уклон 8%, 5 км/ч), суставная, 2 разминочных подхода к первому упражнению', 1, '8 мин', '—', 0, null],
    ['Гоблет-присед', 4, '10', '32–36', 120, 'dumbbell-goblet-squat'],
    ['Разгибание ног в тренажёре', 3, '12', '35', 75, 'machine-leg-extension'],
    ['Жим гантелей на наклонной 30°', 4, '8–10', '2×24–28', 120, 'dumbbell-incline-bench-press'],
    ['Сведение в тренажёре (бабочка)', 3, '12', '27,5', 75, 'machine-pec-fly'],
    ['Плие-присед с гантелью', 3, '12', '34', 90, 'dumbbell-sumo-squat'],
    ['6a Махи в стороны стоя (суперсет)', 3, '12–15', '2×10–12', 0, 'dumbbell-lateral-raise'],
    ['6b Разгибание на блоке (канат)', 3, '12', 'подбор', 75, 'cable-rope-pushdown'],
    ['Прогулка фермера', 3, '30 м', '2×28–32', 60, 'kettlebell-farmers-carry'],
    ['Планка на локтях', 3, '40 с', '—', 45, 'forearm-plank']],
    cardio: 'Дорожка 10 мин: 5 × (1 мин в горку 10–12%, 6 км/ч + 1 мин спокойно).' },
  w2: { t: 'Т2 · Спина и задняя поверхность', ex: [
    ['🔥 Разминка: дорожка 5 мин (уклон 8%, 5 км/ч), суставная, 2 разминочных подхода к первому упражнению', 1, '8 мин', '—', 0, null],
    ['Тяга верхнего блока широким хватом', 4, '8–10', '60', 120, 'machine-pulldown'],
    ['Румынская тяга с гантелями', 4, '10', '2×28 → 2×32', 120, 'dumbbell-romanian-deadlift'],
    ['Рычажная тяга сидя', 4, '10', '87,5–90', 120, 'machine-plate-loaded-row'],
    ['Сгибание ног сидя', 3, '12', '42,5', 75, 'machine-seated-leg-curl'],
    ['Обратная бабочка', 3, '15', '10', 60, 'machine-reverse-fly'],
    ['Бицепс с гантелями стоя', 3, '10–12', '2×12–14', 75, 'dumbbell-curl'],
    ['Махи гирей', 3, '15', '20–24', 60, 'kettlebell-swing'],
    ['Жим Паллофа на блоке', 3, '10 / сторона', 'подбор', 45, 'band-pallof-press']],
    cardio: 'Гребля 12 мин: 8 × (30 с интенсивно + 60 с легко).' },
  w3: { t: 'Т3 · Ноги, ягодицы, плечи', ex: [
    ['🔥 Разминка: дорожка 5 мин (уклон 8%, 5 км/ч), суставная, 2 разминочных подхода к первому упражнению', 1, '8 мин', '—', 0, null],
    ['Присед с гантелями в опущенных руках', 4, '10', '2×36–40', 120, 'dumbbell-goblet-squat'],
    ['Ягодичный мост со штангой', 4, '10–12', 'старт 60', 120, 'barbell-hip-thrust'],
    ['Жим гантелей сидя над головой', 4, '8–10', '2×20–24', 120, 'dumbbell-seated-overhead-press'],
    ['Жим одной ногой', 3, '10 / нога', '65', 90, 'machine-single-leg-leg-press'],
    ['Отведение ног в тренажёре', 3, '15', '47,5', 60, 'machine-hip-abduction'],
    ['Тяга штанги к подбородку', 3, '12', '32,5', 75, 'barbell-upright-row'],
    ['Выпады с гантелями в ходьбе', 2, '10 шагов / нога', '2×16–20', 90, 'lunge-walking'],
    ['«Мёртвый жук»', 3, '10 / сторона', '—', 45, 'dead-bug']],
    cardio: 'Велотренажёр 12 мин ровно, пульс 120–135.' },
  w4: { t: 'Т4 · Верх тела', ex: [
    ['🔥 Разминка: дорожка 5 мин (уклон 8%, 5 км/ч), суставная, 2 разминочных подхода к первому упражнению', 1, '8 мин', '—', 0, null],
    ['Гравитрон, нейтральный хват', 4, '6–8', '−5 кг противовеса', 120, 'machine-assisted-pull-up'],
    ['Жим гантелей лёжа', 4, '8–10', '2×28–32', 120, 'dumbbell-bench-press'],
    ['Тяга нижнего блока узким хватом', 3, '12', '55', 90, 'machine-seated-cable-row'],
    ['Разводка на наклонной 45°', 3, '12', '2×20–22', 75, 'dumbbell-incline-chest-fly'],
    ['5a Махи в наклоне (суперсет)', 3, '12–15', '2×20', 0, 'dumbbell-rear-delt-fly'],
    ['5b Махи в стороны', 3, '12–15', '2×10', 75, 'dumbbell-lateral-raise'],
    ['6a Бицепс на нижнем блоке (суперсет)', 3, '12', 'подбор', 0, 'cable-bar-curl'],
    ['6b Трицепс канатом из-за головы', 3, '12', 'подбор', 75, 'cable-rope-overhead-tricep-extension'],
    ['Броски медбола', 3, '10', '6–8', 60, 'slam'],
    ['Переноска гантели в одной руке', 2, '30 м / рука', '28–32', 60, 'kettlebell-farmers-carry']],
    cardio: 'Дорожка в горку 10 мин: уклон 10%, 5 км/ч.' },
  w5: { t: 'Т5 · Финал: сила + круг', ex: [
    ['🔥 Разминка: дорожка 5 мин (уклон 8%, 5 км/ч), суставная, 2 разминочных подхода к первому упражнению', 1, '8 мин', '—', 0, null],
    ['Гоблет-присед (тяжёлый)', 4, '8', '36–40', 150, 'dumbbell-goblet-squat'],
    ['Жим гантелей на наклонной 30°', 4, '6–8', '+2 кг к Т1', 150, 'dumbbell-incline-bench-press'],
    ['Тяга верхнего блока обратным хватом', 4, '8', '60', 120, 'underhand-pulldown'],
    ['Румынская тяга с гантелями', 3, '8', '+2 кг к Т2', 120, 'dumbbell-romanian-deadlift'],
    ['Рычажная тяга сидя', 3, '8', '90–92,5', 120, 'machine-plate-loaded-row'],
    ['Финишер-круг: махи гирей 15 · отжимания 10 · гоблет 10 · фермер 30 м · планка 30 с', 3, '1 круг', '—', 120, null]],
    cardio: 'Ходьба 8 мин спокойно + растяжка.' }
};

// Замены (как в мини-приложении): [название, вес, видео, повторы?]
const ALT = {"w1":[null,[["Болгарские сплит-приседания с гантелями","2×12–16","dumbbell-bulgarian-split-squat","8–10 / нога"],["Сплит-присед с опорой","16–20","dumbbell-assisted-bulgarian-split-squat","10 / нога"],["Выпады с гантелями в ходьбе","2×16–20","lunge-walking","10 шагов / нога"]],[["Разгибание ног с гантелью (сидя на скамье)","12–16","dumbbell-leg-extension"],["Плие-присед с гантелью","30–32","dumbbell-sumo-squat"]],[["Жим гантелей лёжа","2×26–30","dumbbell-bench-press"],["Отжимания от пола","—",null,"максимум − 2"]],[["Разводка гантелей на наклонной","2×18–20","dumbbell-incline-chest-fly"]],[["Отведение ног в тренажёре","45","machine-hip-abduction","15"],["Ягодичный мост со штангой","старт 60","barbell-hip-thrust","10–12"]],[["Тяга штанги к подбородку","30","barbell-upright-row","12"],["Махи гантелями в наклоне","2×16–20","dumbbell-rear-delt-fly"]],[["Разгибание с канатом из-за головы","подбор","cable-rope-overhead-tricep-extension"],["Обратные отжимания от скамьи","—",null,"12–15"]],[["Махи гирей","16–20","kettlebell-swing","15"]],[["«Мёртвый жук»","—","dead-bug","10 / сторона"],["Жим Паллофа","подбор","band-pallof-press","10 / сторона"]]],"w2":[null,[["Тяга верхнего блока обратным хватом","55–57,5","underhand-pulldown"],["Подтягивания в гравитроне","−5 кг противовеса","machine-assisted-pull-up","6–8"]],[["Ягодичный мост со штангой","старт 60","barbell-hip-thrust","10–12"],["Сгибание ног сидя","40","machine-seated-leg-curl","12"]],[["Тяга нижнего блока узким хватом","55","machine-seated-cable-row","12"],["Тяга гантели одной рукой в наклоне","26–30",null,"10 / рука"]],[["Румынская тяга с гантелями (лёгкая)","2×20–24","dumbbell-romanian-deadlift"],["Ягодичный мост со штангой","старт 60","barbell-hip-thrust"]],[["Махи гантелями в наклоне","2×16–20","dumbbell-rear-delt-fly"]],[["Сгибание рук на нижнем блоке","подбор","cable-bar-curl","12"]],[["Прогулка фермера","2×28–32","kettlebell-farmers-carry","30 м"]],[["Планка на локтях","—","forearm-plank","40 с"],["«Мёртвый жук»","—","dead-bug"]]],"w3":[null,[["Гоблет-присед","32–36","dumbbell-goblet-squat"],["Выпады с гантелями в ходьбе","2×16–20","lunge-walking","10 шагов / нога"]],[["Румынская тяга с гантелями","2×24–28","dumbbell-romanian-deadlift","10"]],[["Тяга штанги к подбородку","30–32,5","barbell-upright-row","12"],["Махи гантелями в стороны","2×10–12","dumbbell-lateral-raise","12–15"]],[["Разгибание ног в тренажёре","35","machine-leg-extension","12"],["Сплит-присед с опорой","16–20","dumbbell-assisted-bulgarian-split-squat"],["Болгарские сплит-приседания с гантелями","2×12–16","dumbbell-bulgarian-split-squat","8–10 / нога"]],[["Плие-присед с гантелью","32–34","dumbbell-sumo-squat","12"]],[["Махи гантелями в стороны","2×10–12","dumbbell-lateral-raise","12–15"]],[["Разгибание ног в тренажёре","35","machine-leg-extension","12"],["Гоблет-присед","28–32","dumbbell-goblet-squat","12"]],[["Планка на локтях","—","forearm-plank","40 с"]]],"w4":[null,[["Тяга верхнего блока широким хватом","60","machine-pulldown","8–10"],["Тяга верхнего блока обратным хватом","55–57,5","underhand-pulldown","8–10"]],[["Жим гантелей на наклонной 30°","2×24–28","dumbbell-incline-bench-press"],["Отжимания от пола","—",null,"максимум − 2"]],[["Рычажная тяга сидя","85","machine-plate-loaded-row","10"],["Тяга гантели одной рукой в наклоне","26–30",null,"10 / рука"]],[["Сведение в тренажёре (бабочка)","27,5","machine-pec-fly"]],[["Обратная бабочка","10","machine-reverse-fly","15"]],[["Тяга штанги к подбородку","30","barbell-upright-row","12"]],[["Подъём гантелей на бицепс","2×12–14","dumbbell-curl"]],[["Разгибание рук на блоке (канат вниз)","подбор","cable-rope-pushdown"],["Обратные отжимания от скамьи","—",null,"12–15"]],[["Махи гирей","16–20","kettlebell-swing","15"]],[["Прогулка фермера","2×28–32","kettlebell-farmers-carry","30 м"],["Планка на локтях","—","forearm-plank","40 с"]]],"w5":[null,[["Присед с гантелями в опущенных руках","2×40",null],["Разгибание ног в тренажёре","37,5–40","machine-leg-extension","10"]],[["Жим гантелей лёжа","+2 кг к Т4","dumbbell-bench-press"]],[["Тяга верхнего блока широким хватом","60–62,5","machine-pulldown"],["Подтягивания в гравитроне","−5 кг противовеса","machine-assisted-pull-up","6–8"]],[["Ягодичный мост со штангой","+10 кг к Т3","barbell-hip-thrust"]],[["Тяга нижнего блока узким хватом","57,5–60","machine-seated-cable-row"],["Тяга гантели одной рукой в наклоне","28–32",null,"8 / рука"]],null]};
const APP = 'https://ipvshu.github.io/workout/';
// Упражнение с учётом замены
function E(c, i) {
  const b = W[c.w].ex[i]; const k = c.swap && c.swap[i];
  const a = k != null && ALT[c.w] && ALT[c.w][i] && ALT[c.w][i][k];
  if (!a) return b;
  const pre = (b[0].match(/^\d[ab] /) || [''])[0];
  return [pre + a[0] + ' ⇄', b[1], a[3] || b[2], a[1], b[4], a[2]];
}

/* ---------------- Telegram helpers ---------------- */
// Telegram rate-limits Cloudflare's shared IPs, so calls go through a relay on Vercel.
const RELAY = 'https://workout-proxy-sigma.vercel.app/api/tg';
async function tg(env, method, body) {
  const r = await fetch(`${RELAY}?method=${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-bot-token': env.BOT_TOKEN }, body: JSON.stringify(body)
  });
  try { return await r.json(); } catch (e) { return { ok: false, error_code: r.status, description: 'relay returned non-JSON' }; }
}
async function secretOf(env) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('wk:' + env.BOT_TOKEN));
  return [...new Uint8Array(d)].slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}
// Подход-вес: стартовые значения из плана
const num = v => { const m = String(v).replace(',', '.').match(/^\s*(?:\d+×)?(\d+(?:\.\d+)?)/); return m ? +m[1] : null; };
const kg = v => v == null ? '?' : String(v).replace('.', ',');
const stepOf = e => (/dumbbell|kettlebell/.test(e[5] || '') || /×/.test(e[3])) ? 2 : 2.5;
const hasW = e => e[3] !== '—';
const hasR = e => /^\d/.test(e[2]) && !/[мс]$/.test(e[2]) && !/мин/.test(e[2]);
// Упражнения на время (планка «40 с»): второе поле — секунды
const isT = e => /^\d+\s*с$/.test(e[2]);
const hasQ = e => hasR(e) || isT(e);
const fmtV = (e, v, r) => (hasW(e) ? kg(v) + ' кг' : '') + (hasW(e) && hasQ(e) ? ' × ' : '') + (hasQ(e) ? (r == null ? '?' : r) + (isT(e) ? ' с' : '') : '');
// Тоннаж: вес × повторы; «2×…» — гантели в каждой руке, считаем обе
const tonnage = (e, L) => hasW(e) && hasR(e) ? L.reduce((a, [v, r]) => a + (v || 0) * (r || 0) * (/^\s*2×/.test(e[3]) ? 2 : 1), 0) : 0;
const big = n => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');
// ---- Память и рекомендации ----
const dur = ms => { const m = Math.max(0, Math.round(ms / 60000)); return m >= 60 ? Math.floor(m / 60) + ' ч ' + String(m % 60).padStart(2, '0') + ' мин' : m + ' мин'; };
const hkey = e => e[0].replace(/^\d[ab] /, '').replace(/ ⇄$/, '').replace(/\s*\((суперсет|тяжёлый|лёгкая)\)/g, '').replace(/ стоя$/, '').trim().toLowerCase();
const range = e => { const m = String(e[2]).match(/(\d+)(?:\s*[–-]\s*(\d+))?/); return m ? [+m[1], +(m[2] || m[1])] : [null, null]; };
// Двойная прогрессия: все подходы на верхней границе → +шаг; сильно не добрал → −шаг; иначе тот же вес и добираем повторы
function recommend(e, h) {
  if (!h || !h.L || !h.L.length) return null;
  const L = h.L.filter(x => x[0] != null || x[1] != null); if (!L.length) return null;
  const [lo, hi] = range(e), st = stepOf(e);
  if (hasW(e) && L.some(x => x[0] != null)) {
    const cnt = {}; L.forEach(x => { if (x[0] != null) cnt[x[0]] = (cnt[x[0]] || 0) + 1; });
    const wb = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || b - a)[0];
    const at = L.filter(x => x[0] === wb && x[1] != null).map(x => x[1]);
    if (!hasR(e) || !at.length || lo == null) return { v: [wb, num(e[2])], tip: `тот же вес ${kg(wb)} кг` };
    const avg = at.reduce((a, b) => a + b, 0) / at.length;
    if (at.every(r => r >= hi)) return { v: [Math.round((wb + st) * 10) / 10, lo], tip: `в прошлый раз все подходы на ${hi}+ — пробуй ${kg(wb + st)} кг на ${lo}` };
    if (avg < lo - 1) return { v: [Math.max(st, Math.round((wb - st) * 10) / 10), lo], tip: `повторы просели — сними до ${kg(Math.max(st, wb - st))} кг и сделай ${lo}–${hi} чисто` };
    return { v: [wb, Math.min(hi, Math.max(lo, at[0]))], tip: `тот же вес ${kg(wb)} кг, цель — ${hi === lo ? hi : lo + '–' + hi} повторов в каждом подходе` };
  }
  const rs = L.map(x => x[1]).filter(x => x != null); if (!rs.length) return null;
  if (isT(e)) { const best = Math.max(...rs), plan = num(e[2]); return best >= plan ? { v: [null, best + 5], tip: `прошлый раз ${best} с — попробуй ${best + 5} с` } : { v: [null, best], tip: `прошлый раз до ${best} с — цель ${plan} с` }; }
  return { v: [null, rs[0]], tip: `прошлый раз ${rs.join(', ')} повт` };
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const restTxt = s => !s ? 'без отдыха' : s >= 120 ? String(s / 60).replace('.', ',') + ' мин' : s + ' с';
const clock = ms => new Date(ms).toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });

/* ---------------- Worker entry ---------------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (!env.BOT_TOKEN) return new Response('BOT_TOKEN secret is not set', { status: 500 });
    if (url.pathname === '/setup') {
      const body = {
        url: `${url.origin}/tg`, secret_token: await secretOf(env),
        allowed_updates: ['message', 'callback_query'], drop_pending_updates: true
      };
      let res;
      for (let k = 0; k < 3; k++) {
        res = await tg(env, 'setWebhook', body);
        if (res.ok || res.error_code !== 429) break;
        await new Promise(r => setTimeout(r, ((res.parameters && res.parameters.retry_after) || 5) * 1000 + 1000));
      }
      await tg(env, 'setMyCommands', { commands: [
        { command: 'start', description: 'Выбрать тренировку' },
        { command: 'stop', description: 'Остановить тренировку' }] });
      return new Response(res.ok ? 'Готово! Webhook установлен. Открой бота в Telegram и нажми /start.' : 'Ошибка: ' + JSON.stringify(res),
        { headers: { 'content-type': 'text/plain; charset=utf-8' } });
    }
    if (url.pathname === '/info') {
      const me = await tg(env, 'getMe', {});
      const wh = await tg(env, 'getWebhookInfo', {});
      const r = wh.result || {};
      return new Response(JSON.stringify({ bot: me.result && me.result.username, bot_id: String(env.BOT_TOKEN).split(':')[0], me_error: me.ok ? undefined : me,
        webhook: r.url, pending: r.pending_update_count, last_error: r.last_error_message, last_error_date: r.last_error_date,
        wh_error: wh.ok ? undefined : wh }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' } });
    }
    if (url.pathname === '/tg' && req.method === 'POST') {
      if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== await secretOf(env)) return new Response('forbidden', { status: 403 });
      const upd = await req.json();
      const chatId = upd.message?.chat?.id ?? upd.callback_query?.message?.chat?.id;
      if (chatId == null) return new Response('ok');
      const stub = env.CHAT.get(env.CHAT.idFromName(String(chatId)));
      await stub.fetch('https://do/update', { method: 'POST', body: JSON.stringify(upd) });
      return new Response('ok');
    }
    return new Response('Workout bot is running.', { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
};

/* ---------------- Per-chat state ---------------- */
export class ChatState {
  constructor(ctx, env) { this.ctx = ctx; this.env = env; }

  async load() { return (await this.ctx.storage.get('s')) || { done: {}, cur: null }; }
  async save(s) { await this.ctx.storage.put('s', s); }

  async fetch(req) {
    const upd = await req.json();
    const s = await this.load();
    try {
      if (upd.callback_query) await this.onButton(s, upd.callback_query);
      else if (upd.message?.text) await this.onText(s, upd.message);
    } finally { await this.save(s); }
    return new Response('ok');
  }

  /* ----- rendering ----- */
  menu(s) {
    const rows = Object.keys(W).map(id => [{ text: (s.done[id] ? '✅ ' : '') + W[id].t, callback_data: 'w:' + id }]);
    rows.push([{ text: '📱 Приложение', web_app: { url: APP } }]);
    return { text: '<b>Выбери тренировку</b>\nВес и повторы подхода меняй кнопками ± или напиши «34 8». Для планки — секунды: «30».', reply_markup: { inline_keyboard: rows } };
  }
  card(s, note) {
    const c = s.cur, w = W[c.w], e = E(c, c.i);
    const [name, sets, reps, wt, rest, vid] = e;
    const done = c.sets[c.i] || 0;
    const warm = name.startsWith('🔥');
    let t = `${note ? note + '\n' : ''}<b>${esc(w.t.split(' · ')[0])} · ${c.i + 1}/${w.ex.length}</b> · ⏱ ${dur(Date.now() - c.started)}\n<b>${esc(name)}</b>\n`
      + `план: ${sets} × ${esc(reps)}${wt !== '—' ? ' · ' + esc(wt) + (/\d$/.test(wt) ? ' кг' : '') : ''} · ${rest ? 'отдых ' + restTxt(rest) : 'без отдыха'}`;
    const kb = [];
    if (warm) t += '\n' + (done ? '✅' : '⬜');
    else {
      const log = (c.log && c.log[c.i]) || [], cur = this.curVals(s);
      const fmtSet = (v, r) => fmtV(e, v, r) || esc(reps);
      const h = s.hist && s.hist[hkey(e)], rec = recommend(e, h);
      if (h && done === 0) {
        t += `\n📈 ${esc(h.d)}: ` + h.L.map(([v, r]) => fmtV(e, v, r).replace(/ кг × /, '×')).join(', ');
        if (rec) t += `\n💡 ${esc(rec.tip)}`;
      }
      for (let k = 0; k < sets; k++) {
        if (k < log.length) t += `\n${k + 1}) ${fmtSet(log[k][0], log[k][1])} ✅`;
        else if (k === done) t += `\n▶️ ${k + 1}) <b>${fmtSet(cur[0], cur[1])}</b>`;
        else t += `\n${k + 1}) ⬜`;
      }
      if (done < sets && hasW(e) && cur[0] == null) t += '\n<i>Вес подбираешь сам — напиши число, например «20».</i>';
      if (done < sets && isT(e)) t += '\n<i>Простоял меньше? Напиши секунды, например «30».</i>';
      if (done < sets && (hasW(e) || hasQ(e))) {
        const st = stepOf(e), row = [];
        if (hasW(e) && cur[0] != null) row.push({ text: '−' + kg(st) + ' кг', callback_data: 'w-' }, { text: '+' + kg(st) + ' кг', callback_data: 'w+' });
        if (hasR(e)) row.push({ text: '−1 повт', callback_data: 'r-' }, { text: '+1 повт', callback_data: 'r+' });
        if (isT(e)) row.push({ text: '−5 с', callback_data: 'r-' }, { text: '+5 с', callback_data: 'r+' });
        if (row.length) kb.push(row);
      }
    }
    if (c.restUntil) {
      t += `\n⏳ Отдых до ${clock(c.restUntil)}`;
      kb.push([{ text: '⏭ Пропустить отдых', callback_data: 'skip' }]);
    } else if (done < sets) {
      kb.push([{ text: warm ? '✅ Размялся' : `✅ Подход ${done + 1}`, callback_data: 'set' }]);
    } else {
      kb.push([{ text: c.i + 1 < w.ex.length ? '➡️ Следующее упражнение' : '🏁 Завершить', callback_data: 'next' }]);
    }
    if (!c.restUntil && ALT[c.w] && ALT[c.w][c.i]) kb.push([{ text: '⇄ Заменить', callback_data: 'sw' }]);
    const nav = [{ text: '⬅️', callback_data: 'prev' }, { text: '➡️', callback_data: 'next' }];
    if (vid) nav.push({ text: '🎬', url: MW(vid) });
    kb.push(nav, [{ text: '⏹ Стоп', callback_data: 'stop' }]);
    return { text: t, reply_markup: { inline_keyboard: kb } };
  }

  // Значения следующего подхода: что выставлено → прошлый подход → план
  curVals(s) {
    const c = s.cur, e = E(c, c.i); c.cv = c.cv || {}; c.log = c.log || {};
    if (!c.cv[c.i]) {
      const last = (c.log[c.i] || []).at(-1);
      const rec = !last && recommend(e, s.hist && s.hist[hkey(e)]);
      c.cv[c.i] = last ? [last[0], last[1]] : rec ? [hasW(e) ? rec.v[0] : null, rec.v[1] ?? num(e[2])] : [num(e[3]), num(e[2])];
    }
    return c.cv[c.i];
  }

  swapView(s) {
    const c = s.cur, b = W[c.w].ex[c.i], alts = ALT[c.w][c.i], cur = c.swap && c.swap[c.i];
    const kb = [[{ text: (cur == null ? '● ' : '') + b[0] + ' (по плану)', callback_data: 'sw:-1' }]];
    alts.forEach((a, k) => kb.push([{ text: (cur === k ? '● ' : '') + a[0] + ' · ' + a[1] + (/\d$/.test(a[1]) ? ' кг' : ''), callback_data: 'sw:' + k }]));
    kb.push([{ text: '↩️ Назад', callback_data: 'sw:x' }]);
    return { text: '<b>Чем заменить?</b>\n' + esc(b[0]), reply_markup: { inline_keyboard: kb } };
  }

  /* ----- messaging ----- */
  async send(s, view) {
    const chat_id = s.chat;
    if (s.cur?.msg) await tg(this.env, 'editMessageReplyMarkup', { chat_id, message_id: s.cur.msg, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    const r = await tg(this.env, 'sendMessage', { chat_id, text: view.text, parse_mode: 'HTML', reply_markup: view.reply_markup, disable_web_page_preview: true });
    if (s.cur && r.ok) s.cur.msg = r.result.message_id;
    return r;
  }
  async edit(s, view) {
    if (!s.cur?.msg) return this.send(s, view);
    const r = await tg(this.env, 'editMessageText', { chat_id: s.chat, message_id: s.cur.msg, text: view.text, parse_mode: 'HTML', reply_markup: view.reply_markup, disable_web_page_preview: true });
    if (!r.ok && !/not modified/.test(r.description || '')) return this.send(s, view);
    return r;
  }

  /* ----- handlers ----- */
  async onText(s, m) {
    s.chat = m.chat.id;
    const txt = m.text.trim();
    if (/^\/(start|menu)/.test(txt)) { await this.stopRest(s); this.saveHist(s); s.cur = null; return tg(this.env, 'sendMessage', { chat_id: s.chat, parse_mode: 'HTML', ...this.menu(s) }); }
    if (/^\/stop/.test(txt)) return this.finish(s, true);
    // «34» — вес, «34 8» / «34х8» — вес и повторы, «х8» — только повторы
    const mm = txt.replace(/,/g, '.').match(/^(\d+(?:\.\d+)?)?\s*(?:[xх×*\s]\s*(\d+))?$/i);
    if (mm && (mm[1] || mm[2]) && s.cur) {
      const c = s.cur, cur = this.curVals(s), e = E(c, c.i);
      if (mm[1] && !mm[2] && !hasW(e)) { mm[2] = mm[1]; mm[1] = undefined; }
      if (mm[1]) cur[0] = +mm[1];
      if (mm[2]) cur[1] = +mm[2];
      const log = c.log[c.i] || [];
      // во время отдыха — правим только что сделанный подход
      let what = 'Следующий подход';
      if (c.restUntil && log.length) { const L = log.at(-1); if (mm[1]) L[0] = +mm[1]; if (mm[2]) L[1] = +mm[2]; what = `Подход ${log.length} исправлен`; }
      return this.send(s, this.card(s, `✍️ ${what}: ${fmtV(e, cur[0], cur[1])}`));
    }
    return tg(this.env, 'sendMessage', { chat_id: s.chat, text: s.cur ? 'Пришли вес и повторы: «34 8» (или просто «34», или «х8»). Или /stop.' : 'Нажми /start, чтобы выбрать тренировку.' });
  }

  async onButton(s, q) {
    s.chat = q.message.chat.id;
    const d = q.data || '';
    await tg(this.env, 'answerCallbackQuery', { callback_query_id: q.id }).catch(() => {});
    if (d.startsWith('w:')) {
      const id = d.slice(2); if (!W[id]) return;
      await this.stopRest(s);
      s.cur = { w: id, i: 0, sets: {}, fact: {}, log: {}, cv: {}, msg: null, restUntil: null, started: Date.now() };
      return this.send(s, this.card(s, `🏋️ <b>${esc(W[id].t)}</b>\nНачинаем с разминки.`));
    }
    if (!s.cur) return tg(this.env, 'sendMessage', { chat_id: s.chat, parse_mode: 'HTML', ...this.menu(s) });
    if (q.message.message_id !== s.cur.msg) s.cur.msg = q.message.message_id;
    const c = s.cur, w = W[c.w];
    if (d === 'sw') { if (!ALT[c.w] || !ALT[c.w][c.i]) return; await this.stopRest(s); return this.edit(s, this.swapView(s)); }
    if (d.startsWith('sw:')) {
      const v = d.slice(3); if (v === 'x') return this.edit(s, this.card(s));
      const k = +v; c.swap = c.swap || {};
      if (k < 0) delete c.swap[c.i]; else if (ALT[c.w][c.i] && ALT[c.w][c.i][k]) c.swap[c.i] = k; else return;
      if (c.cv) delete c.cv[c.i];
      return this.edit(s, this.card(s, k < 0 ? '↩️ Вернул по плану' : '⇄ Заменил'));
    }
    if (/^[wr][+-]$/.test(d)) {
      const e = E(c, c.i), cur = this.curVals(s), sg = d[1] === '+' ? 1 : -1;
      if (d[0] === 'w' && cur[0] != null) cur[0] = Math.max(0, Math.round((cur[0] + sg * stepOf(e)) * 10) / 10);
      if (d[0] === 'r') cur[1] = Math.max(isT(e) ? 5 : 1, (cur[1] || 0) + sg * (isT(e) ? 5 : 1));
      return this.edit(s, this.card(s));
    }
    if (d === 'set') {
      const e = E(c, c.i);
      if ((c.sets[c.i] || 0) >= e[1]) return this.edit(s, this.card(s));
      if (!e[0].startsWith('🔥')) { const cur = this.curVals(s); c.log[c.i] = c.log[c.i] || []; c.log[c.i].push([hasW(e) ? cur[0] : null, hasQ(e) ? cur[1] : null]); }
      c.sets[c.i] = Math.min(e[1], (c.sets[c.i] || 0) + 1);
      const last = c.sets[c.i] >= e[1];
      const isLastEx = c.i + 1 >= w.ex.length;
      if (e[4] > 0 && !(last && isLastEx)) {
        c.restUntil = Date.now() + e[4] * 1000;
        await this.ctx.storage.setAlarm(c.restUntil);
        return this.edit(s, this.card(s));
      }
      if (c.i === 0 && e[0].startsWith('🔥')) { c.i++; return this.send(s, this.card(s, '🔥 Разминка готова — поехали!')); }
      if (e[4] === 0 && !isLastEx) { c.i++; return this.send(s, this.card(s, '⚡ Суперсет — сразу без отдыха')); }
      if (last && isLastEx) return this.finish(s, false);
      return this.edit(s, this.card(s));
    }
    if (d === 'skip') { await this.stopRest(s); return this.advanceAfterRest(s, false); }
    if (d === 'next') {
      await this.stopRest(s);
      if (c.i + 1 >= w.ex.length) return this.finish(s, false);
      c.i++; return this.edit(s, this.card(s));
    }
    if (d === 'prev') { await this.stopRest(s); if (c.i > 0) c.i--; return this.edit(s, this.card(s)); }
    if (d === 'stop') return this.finish(s, true);
  }

  async stopRest(s) {
    if (s.cur) s.cur.restUntil = null;
    await this.ctx.storage.deleteAlarm();
  }

  async advanceAfterRest(s, fromAlarm) {
    const c = s.cur; if (!c) return;
    const w = W[c.w], e = E(c, c.i);
    let note = fromAlarm ? '⏰ <b>Отдых окончен!</b>' : '';
    const prev = c.i > 0 ? E(c, c.i - 1) : null;
    if (prev && prev[4] === 0 && !prev[0].startsWith('🔥') && (c.sets[c.i - 1] || 0) < prev[1]) {
      c.i--; note += (note ? '\n' : '') + 'Суперсет, следующий круг:';
    } else if ((c.sets[c.i] || 0) >= e[1]) {
      if (c.i + 1 >= w.ex.length) return this.finish(s, false);
      c.i++; note += (note ? '\n' : '') + 'Следующее упражнение:';
    }
    return fromAlarm ? this.send(s, this.card(s, note)) : this.edit(s, this.card(s, note));
  }

  async alarm() {
    const s = await this.load();
    if (s.cur && s.cur.restUntil) {
      s.cur.restUntil = null;
      await this.advanceAfterRest(s, true);
      await this.save(s);
    }
  }

  saveHist(s) {
    const c = s.cur; if (!c || !c.log) return;
    s.hist = s.hist || {};
    const d = new Date().toLocaleDateString('ru-RU', { timeZone: TZ, day: '2-digit', month: '2-digit' });
    Object.entries(c.log).forEach(([i, L]) => { if (L.some(x => x[0] != null || x[1] != null)) s.hist[hkey(E(c, +i))] = { d, L }; });
  }

  async finish(s, stopped) {
    await this.stopRest(s);
    const c = s.cur;
    if (!c) return tg(this.env, 'sendMessage', { chat_id: s.chat, parse_mode: 'HTML', ...this.menu(s) });
    const w = W[c.w];
    if (c.msg) await tg(this.env, 'editMessageReplyMarkup', { chat_id: s.chat, message_id: c.msg, reply_markup: { inline_keyboard: [] } }).catch(() => {});
    const totalSets = w.ex.reduce((a, e) => a + e[1], 0);
    const doneSets = Object.values(c.sets).reduce((a, b) => a + b, 0);
    this.saveHist(s);
    const took = dur(Date.now() - c.started);
    let t = stopped ? `⏹ <b>${esc(w.t)}</b> остановлена.` : `🏁 <b>${esc(w.t)}</b> — готово! 💪`;
    t += `\n⏱ <b>Тренировка заняла: ${took}</b>\nПодходов: ${doneSets}/${totalSets}`;
    let total = 0, best = null;
    const facts = Object.entries(c.log || {}).filter(([, L]) => L.some(([v, r]) => v != null || r != null)).map(([i, L]) => {
      const e = E(c, +i), ton = tonnage(e, L); total += ton;
      if (ton && (!best || ton > best[1])) best = [e[0], ton];
      return `• ${esc(e[0].replace(/ ⇄$/, ''))}: ` + L.map(([v, r]) => fmtV(e, v, r).replace(/ кг × /, '×').replace(/ кг$/, ' кг')).join(', ') + (ton ? ` = ${big(ton)} кг` : '');
    });
    if (total) t += `\n🏋️ <b>Поднято всего: ${big(total)} кг</b>` + (best ? `\nБольше всего — ${esc(best[0].replace(/ ⇄$/, ''))} (${big(best[1])} кг)` : '');
    if (facts.length) t += '\n\n<b>Подходы:</b>\n' + facts.join('\n') + '\n<i>Запомнил — в следующий раз подскажу веса.</i>';
    if (total) t += '\n<i>Тоннаж = вес × повторы; для гантелей «2×» считаю обе руки.</i>';
    if (!stopped) { t += `\n\n<b>Кардио:</b> ${esc(w.cardio)}`; s.done[c.w] = new Date().toLocaleDateString('ru-RU', { timeZone: TZ }); }
    s.cur = null;
    await tg(this.env, 'sendMessage', { chat_id: s.chat, text: t, parse_mode: 'HTML' });
    return tg(this.env, 'sendMessage', { chat_id: s.chat, parse_mode: 'HTML', ...this.menu(s) });
  }
}
