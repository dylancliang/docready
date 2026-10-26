// Pilot: clickable prototype of the applicant's document upload.
// All people, the building, the agent and the documents are fictional sample data.
// Rules cite the HPD/HDC Marketing Handbook (April 2025) by section, and Attachment H-1C (April 1, 2025).
// Applicant screens use i18n.js; the agent's view stays in English.

const TODAY = '2026-10-28';
const DUE_ISO = '2026-11-09';
const WEEKDAYS_LEFT = 8;          // request sent Mon Oct 26; at least 10 weekdays to respond (4-5.D.1.d)
const REMINDER_WEEKDAYS_LEFT = 2; // reminder preview: Thu Nov 5
const BUILDING = 'Willow Court';
const AGENT = 'Sample Leasing Co.';
const ASSET_LIMIT = '$51,600';    // H-1C; the current HUD figure must be used (5-4.I)

const PEOPLE = {
  maria: { name: 'Maria Santos', first: 'Maria', initial: 'M' },
  luis: { name: 'Luis Santos', first: 'Luis', initial: 'L' },
  sofia: { name: 'Sofia Santos', first: 'Sofia', initial: 'S' },
};

const SAMPLES = {
  maria_stubs: [
    { id: 'm23', label: 'Pay stub · Bright Smile Dental', date: '2026-10-23', type: 'stub', employer: 'Bright Smile Dental' },
    { id: 'm09', label: 'Pay stub · Bright Smile Dental', date: '2026-10-09', type: 'stub', employer: 'Bright Smile Dental' },
    { id: 'm828', label: 'Pay stub · Bright Smile Dental', date: '2026-08-28', type: 'stub', employer: 'Bright Smile Dental' },
    { id: 'mblur', label: 'Photo of a pay stub', sub: 'Blurry, taken at an angle', type: 'unreadable' },
  ],
  luis_stubs: [
    { id: 'f22', label: 'Pay stub · Fresh Market Co.', date: '2026-10-22', type: 'stub', employer: 'Fresh Market Co.' },
    { id: 'f15', label: 'Pay stub · Fresh Market Co.', date: '2026-10-15', type: 'stub', employer: 'Fresh Market Co.' },
    { id: 'f08', label: 'Pay stub · Fresh Market Co.', date: '2026-10-08', type: 'stub', employer: 'Fresh Market Co.' },
    { id: 'f01', label: 'Pay stub · Fresh Market Co.', date: '2026-10-01', type: 'stub', employer: 'Fresh Market Co.' },
  ],
  luis_metro: [
    { id: 'd23', label: 'Pay stub · Metro Deli', date: '2026-10-23', type: 'stub', employer: 'Metro Deli' },
    { id: 'd16', label: 'Pay stub · Metro Deli', date: '2026-10-16', type: 'stub', employer: 'Metro Deli' },
    { id: 'd09', label: 'Pay stub · Metro Deli', date: '2026-10-09', type: 'stub', employer: 'Metro Deli' },
    { id: 'd02', label: 'Pay stub · Metro Deli', date: '2026-10-02', type: 'stub', employer: 'Metro Deli' },
  ],
  benefits_letter: [
    { id: 'lgood', label: 'SNAP award letter (sample)', date: '2026-06-12', sub: 'Maria, Luis, Sofia', type: 'letter', members: ['maria', 'luis', 'sofia'] },
    { id: 'lold', label: 'SNAP award letter (sample)', date: '2025-01-20', sub: 'Maria, Luis, Sofia', type: 'letter', members: ['maria', 'luis', 'sofia'] },
    { id: 'lmiss', label: 'SNAP award letter (sample)', date: '2026-06-12', sub: 'Maria, Sofia', type: 'letter', members: ['maria', 'sofia'] },
    { id: 'lstub', label: 'Pay stub · Bright Smile Dental', date: '2026-10-23', type: 'stub' },
  ],
  maria_id: [{ id: 'idm', label: "Driver's license · Maria Santos", type: 'id' }],
  luis_id: [{ id: 'idl', label: 'IDNYC card · Luis Santos', type: 'id' }],
  sofia_bc: [{ id: 'bc', label: 'Birth certificate · Sofia Santos', type: 'birth' }],
  asset_statements: [{ id: 'bank', label: 'Bank statement · September 2026', type: 'bank' }],
};

const initial = (lang = 'en') => ({
  lang,
  screen: 'welcome',
  back: 'welcome',      // where the reminders preview returns to
  viewer: 'maria',
  reminders: true,
  benefits: null,       // true | false | null
  stubsToo: false,      // letter sent anyway without covering everyone
  luisJob: null,        // null | 'both' | 'ended'
  luisLink: false,
  assetsOver: null,
  status: {},           // id -> 'done' | 'warn'
  files: {},            // id -> [sample ids]
  notes: {},            // id -> English note shown to the agent
  current: null,        // item id being worked on
  picked: [],           // sample ids selected on the upload screen
  result: null,         // check result on the upload screen
});
let S = initial();

// ---------- language ----------
const LOC = () => LANGS.find((l) => l.code === S.lang).locale;
function t(key, vars = {}) {
  const e = STR[key];
  if (!e) return key;
  let s = e[S.lang] ?? e.en;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
}
const plural = (one, many, n, vars = {}) => (n === 1 ? t(one, vars) : t(many, { ...vars, n }));
const fd = (iso, style) => {
  const opts = {
    due: { weekday: 'short', month: 'short', day: 'numeric' },
    full: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
    date: { year: 'numeric', month: 'short', day: 'numeric' },
    md: { month: 'short', day: 'numeric' },
  }[style];
  return new Intl.DateTimeFormat(LOC(), { ...opts, timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
};
const DUE = () => fd(DUE_ISO, 'due');
const enDate = (iso) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
const fixDots = (s) => s.replace(/\.\./g, '.').replace(/\.。/g, '。').replace(/\.，/g, '，');

// ---------- checklist built from the frozen application (R1) ----------
function items() {
  const list = [];
  if (S.benefits === true) {
    list.push({ id: 'benefits_letter', who: 'household', kind: 'upload', title: t('letterTitle'), need: t('letterNeed'),
      why: t('benWhy'), cite: 'H-1C; Handbook 5-4.A.2', en: 'Benefits award letter' });
  }
  if (S.benefits === false || S.stubsToo) {
    list.push({ id: 'maria_stubs', who: 'maria', kind: 'upload', count: 2, period: 14, employer: 'Bright Smile Dental',
      title: t('stubsTitle', { e: 'Bright Smile Dental' }), need: t('needBiweekly'), why: t('stubsWhy'), cite: 'Handbook 5-4.C', en: 'Pay stubs · Bright Smile Dental' });
    if (S.luisJob === 'both') {
      list.push({ id: 'luis_metro', who: 'luis', kind: 'upload', count: 4, period: 7, employer: 'Metro Deli',
        title: t('stubsTitle', { e: 'Metro Deli' }), need: t('needWeekly', { e: 'Metro Deli' }), why: t('metroWhy'), cite: 'Handbook 5-4.C', en: 'Pay stubs · Metro Deli' });
    }
    if (S.luisJob === 'ended') {
      list.push({ id: 'luis_ended', who: 'luis', kind: 'sign', form: 'ended', title: t('endedTitle'), need: t('endedNeed'),
        why: t('endedItemWhy'), cite: 'Handbook 5-3.A.1; H-1C', en: 'Statement: Metro Deli job ended' });
    }
    const emp = S.luisJob ? 'Fresh Market Co.' : 'Metro Deli';
    list.push({ id: 'luis_stubs', who: 'luis', kind: 'upload', count: 4, period: 7, employer: emp,
      title: t('stubsTitle', { e: emp }), need: t('needWeekly', { e: emp }), why: t('stubsWhy'), cite: 'Handbook 5-4.C', en: `Pay stubs · ${emp}` });
  }
  const assets = (who) => ({ id: `${who}_assets`, who, kind: 'sign', form: 'assets', title: t('assetsTitle'), need: t('assetsNeed'),
    why: t('assetsWhy', { x: ASSET_LIMIT }), cite: 'Handbook 5-4.I.1; H-1C', en: 'Asset statement' });
  const photo = (who) => ({ id: `${who}_id`, who, kind: 'upload', agentAsks: true, title: t('idTitle'), need: t('idNeed'),
    why: t('idWhy', { a: AGENT }), cite: 'H-1C', en: 'Photo ID' });
  list.push(assets('maria'), assets('luis'), photo('maria'), photo('luis'),
    { id: 'sofia_bc', who: 'sofia', kind: 'upload', agentAsks: true, title: t('bcTitle'), need: t('bcNeed'),
      why: t('bcWhy', { a: AGENT }), cite: 'H-1C', en: "Sofia's birth certificate" });
  if (S.assetsOver) {
    list.push({ id: 'asset_statements', who: 'household', kind: 'upload', title: t('bankTitle'), need: t('bankNeed'),
      why: t('bankWhy', { x: ASSET_LIMIT }), cite: 'H-1C; Handbook 5-4.I.3', en: 'Bank and investment statements' });
  }
  return list;
}
const visibleItems = () => items().filter((i) => S.viewer === 'maria' || i.who === 'luis');
const itemById = (id) => items().find((i) => i.id === id);
const missingFor = (who) => items().filter((i) => !S.status[i.id] && (who === 'maria' ? i.who !== 'luis' : i.who === 'luis'));

// ---------- checks: warn and explain, never block (R6) ----------
const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);

function checkUpload(item, docs) {
  if (docs.some((d) => d.type === 'unreadable')) return { kind: 'warn', title: t('unreadT'), body: t('unreadB'), en: "Couldn't read a photo" };
  if (item.count) {
    if (docs.some((d) => d.type !== 'stub')) return { kind: 'warn', title: t('notStubT'), body: t('notStubB'), en: 'Not a pay stub' };
    const other = docs.find((d) => d.employer !== item.employer);
    if (other && item.id === 'luis_stubs' && !S.luisJob) return { kind: 'mismatch', employer: other.employer };
    if (other) return { kind: 'warn', title: fixDots(t('otherEmpT', { e: other.employer }) + (S.lang.startsWith('zh') ? '。' : '.')), body: t('otherEmpB', { e: item.employer }), en: `Stub from ${other.employer}` };
    const sorted = [...docs].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 1; i < sorted.length; i++) {
      if (days(sorted[i - 1].date, sorted[i].date) > item.period + 2) {
        return { kind: 'warn', title: t('gapT'), body: t('gapB', { a: fd(sorted[i].date, 'date'), b: fd(sorted[i - 1].date, 'date') }), cite: 'Handbook 5-4.C', en: 'Stubs not back to back' };
      }
    }
    if (docs.length < item.count) {
      const n = item.count - docs.length;
      const date = fd(sorted[sorted.length - 1].date, 'date');
      return { kind: 'warn', title: t('countT', { c: item.count, k: docs.length }), body: plural('countB1', 'countBN', n, { date }), cite: 'Handbook 5-4.C', en: `${docs.length} of ${item.count} stubs` };
    }
    return { kind: 'good', title: t('goodStubsT', { c: item.count }), body: `${item.employer} · ${sorted.map((d) => fd(d.date, 'md')).reverse().join(', ')}` };
  }
  if (item.id === 'benefits_letter') {
    const d = docs[0];
    if (docs.length > 1) return { kind: 'warn', title: t('pickOneT'), body: t('pickOneB'), en: 'More than one letter' };
    if (d.type !== 'letter') return { kind: 'warn', title: t('notLetterT'), body: t('notLetterB'), en: 'Not a benefits letter' };
    if (days(TODAY, d.date) > 365) return { kind: 'warn', title: t('oldT', { date: fd(d.date, 'date') }), body: t('oldB'), cite: 'H-1C; Handbook 5-4.A.2', alt: true, en: `Letter dated ${enDate(d.date)}, older than 12 months` };
    const missing = Object.keys(PEOPLE).filter((p) => !d.members.includes(p));
    if (missing.length) {
      const names = missing.map((p) => PEOPLE[p].first).join(', ');
      return { kind: 'warn', title: t('missT', { names }), body: t('missB'), cite: 'H-1C', alt: true, en: `${names} not on letter` };
    }
    return { kind: 'good', title: t('letterGoodT'), body: t('letterGoodB') };
  }
  return { kind: 'good', title: t('gotItT'), body: t('gotItB') };
}

// ---------- rendering ----------
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $app = document.getElementById('app');
const disabled = (off) => (off ? 'disabled style="opacity:.4"' : '');

function bar() {
  const opts = LANGS.map((l) => `<option value="${l.code}" ${l.code === S.lang ? 'selected' : ''}>${l.label}</option>`).join('');
  return `<div class="bar"><div class="brand">Pilot<span>.</span></div>
    <label class="lang"><span class="sr-only">${t('language')}</span><span aria-hidden="true">🌐</span><select data-change="lang" aria-label="${t('language')}">${opts}</select></label></div>
    <div class="duebar"><span class="due">${t('due', { date: DUE(), n: WEEKDAYS_LEFT })}</span></div>`;
}
function viewerBar() {
  if (!S.luisLink) return '';
  return `<div class="viewer">${t('viewingAs')}
    <button type="button" data-act="viewer" data-v="maria" aria-pressed="${S.viewer === 'maria'}">Maria</button>
    <button type="button" data-act="viewer" data-v="luis" aria-pressed="${S.viewer === 'luis'}">Luis</button></div>`;
}
function why(text, cite) {
  return `<details class="why"><summary>${t('why')}</summary><p>${esc(text)} <span class="cite">${esc(cite)}</span></p></details>`;
}
const whoLabel = (w) => (w === 'household' ? t('household') : PEOPLE[w].first);

const screens = {
  welcome() {
    return `${bar()}<div class="screen">
      <h2>${t('welcomeH', { b: BUILDING })}</h2>
      <p class="lead">${t('welcomeLead', { a: AGENT, date: `<b>${DUE()}</b>` })}</p>
      <div class="card soft"><div class="muted">${t('langNote')} <i>${t('sampleTr')}</i></div>
      ${why(t('langWhy'), 'Handbook 4-3.C.3')}</div>
      <div class="card"><div class="toggle"><div><b>${t('remTitle')}</b><div class="muted">${t('remSub')}</div></div>
        <button type="button" class="switch" role="switch" aria-checked="${S.reminders}" aria-label="${t('remTitle')}" data-act="reminders"></button></div>
        <button type="button" class="link" style="margin-top:10px" data-act="remPreview">${t('remPreview')}</button></div>
      <div class="card soft"><div class="muted">${t('trust')}</div>${why(t('trustWhy'), 'Handbook 5-6.B')}</div>
      <button type="button" class="btn" data-act="go" data-to="household">${t('start')}</button>
      ${why(t('deadlineWhy'), 'Handbook 4-5.D.1.d')}
    </div>`;
  },
  household() {
    const rows = Object.entries(PEOPLE).map(([k, p]) => `<div class="card"><div class="person"><div class="avatar">${p.initial}</div><div><b>${p.name}</b><div class="muted">${t(`p_${k}`)}</div></div></div></div>`).join('');
    return `${bar()}<div class="screen">
      <h2>${t('hhH')}</h2><p class="lead">${t('hhLead')}</p>${rows}
      <div class="card soft"><div class="muted">${t('hhNote')}</div>${why(t('hhWhy'), 'Handbook 5-3')}</div>
      <button type="button" class="btn" data-act="go" data-to="benefits">${t('continue')}</button>
    </div>`;
  },
  benefits() {
    const c = (v, title, sub) => `<button type="button" class="choice ${S.benefits === v ? 'selected' : ''}" data-act="benefits" data-v="${v}"><b>${title}</b><span class="muted">${sub}</span></button>`;
    return `${bar()}<div class="screen">
      <h2>${t('benH')}</h2><p class="lead">${t('benLead')}</p>
      ${c(true, t('yes'), t('benYesSub'))}${c(false, t('no'), t('benNoSub'))}
      ${why(t('benWhy'), 'H-1C; Handbook 5-4.A.2')}
      <button type="button" class="btn" data-act="benefitsNext" ${disabled(S.benefits === null)}>${t('continue')}</button>
    </div>`;
  },
  checklist() {
    const list = visibleItems();
    const done = list.filter((i) => S.status[i.id]).length;
    const groups = S.viewer === 'luis' ? ['luis'] : ['household', 'maria', 'luis', 'sofia'];
    const html = groups.map((g) => {
      const gi = list.filter((i) => i.who === g);
      if (!gi.length) return '';
      const gdone = gi.filter((i) => S.status[i.id]).length;
      const side = g === 'luis' && S.viewer === 'maria'
        ? (S.luisLink ? `<span class="muted">${t('linkSent')}</span>` : `<button type="button" class="link" data-act="luisLink">${t('sendLink')}</button>`)
        : `<span class="muted">${t('groupCount', { d: gdone, n: gi.length })}</span>`;
      return `<div class="group"><div class="group-head"><h3>${whoLabel(g)}</h3>${side}</div>${gi.map(row).join('')}</div>`;
    }).join('');
    const intro = S.viewer === 'luis' ? `<h2>${t('luisH')}</h2><p class="lead">${t('luisLead')}</p>` : `<h2>${t('listH')}</h2><p class="lead">${t('listLead')}</p>`;
    return `${bar()}${viewerBar()}<div class="screen">${intro}
      <div class="progress" aria-hidden="true"><div style="width:${list.length ? (done / list.length) * 100 : 0}%"></div></div>
      <div class="muted">${t('doneCount', { d: done, n: list.length })}</div>
      ${html}
      ${S.viewer === 'maria' ? `<button type="button" class="btn" data-act="send">${t('sendTo', { a: AGENT })}</button>
        <p class="muted" style="text-align:center;margin-top:8px">${t('sendNote', { date: DUE() })}</p>` : ''}
      <p class="muted" style="text-align:center">${fixDots(t('otherWays', { a: AGENT }))}</p>
      <p style="text-align:center"><button type="button" class="link" data-act="remPreview">${t('remPreview')}</button></p>
    </div>`;
  },
  upload() {
    const item = itemById(S.current);
    const docs = SAMPLES[item.id] || [];
    const r = S.result;
    const docBtns = docs.map((d) => {
      const on = S.picked.includes(d.id);
      const sub = d.date ? fd(d.date, 'date') + (d.sub ? ` · ${d.sub}` : '') : (d.sub || '');
      return `<button type="button" class="doc ${on ? 'selected' : ''}" data-act="pick" data-id="${d.id}" aria-pressed="${on}">
        <span class="thumb" aria-hidden="true"></span><span><b>${esc(d.label)}</b>${sub ? `<br><span class="muted">${esc(sub)}</span>` : ''}</span><span class="check" aria-hidden="true">${on ? '✓' : ''}</span></button>`;
    }).join('');
    let res = '';
    if (r && r.kind === 'warn') {
      res = `<div class="alert warn" role="alert"><b>${esc(r.title)}</b>${esc(r.body)}${r.cite ? ` <span class="cite">${esc(r.cite)}</span>` : ''}</div>
        <button type="button" class="btn" data-act="${r.alt ? 'useStubs' : 'clearResult'}">${t(r.alt ? 'useStubs' : 'fixIt')}</button>
        <button type="button" class="btn secondary" data-act="sendAnyway">${t('sendAnyway')}</button>
        <p class="muted" style="text-align:center;margin-top:8px">${t('anywayNote', { a: AGENT })}</p>`;
    } else if (r && r.kind === 'good') {
      res = `<div class="alert good" role="status"><b>${esc(r.title)}</b>${esc(r.body)}</div><button type="button" class="btn" data-act="accept">${t('doneBtn')}</button>`;
    }
    const n = S.picked.length;
    const addLabel = n === 0 ? t('addFiles0') : plural('addFiles1', 'addFilesN', n);
    return `${bar()}<div class="screen">
      <button type="button" class="link" data-act="go" data-to="checklist">${t('back')}</button>
      <h2 style="margin-top:12px">${esc(item.title)}</h2>
      <p class="lead">${esc(item.need)}</p>
      ${why(item.why, item.cite)}
      <h3>${t('chooseFiles')}</h3>
      <p class="muted" style="margin-top:-4px">${t('sampleNote')}</p>
      ${docBtns}
      ${r ? res : `<button type="button" class="btn" data-act="check" ${disabled(!n)}>${addLabel}</button>`}
    </div>`;
  },
  mismatch() {
    const c = (v, a, b) => `<button type="button" class="choice" data-act="job" data-v="${v}"><b>${t(a)}</b><span class="muted">${t(b)}</span></button>`;
    return `${bar()}<div class="screen">
      <h2>${esc(fixDots(t('mismatchH', { e: S.result.employer })))}</h2>
      <p class="lead">${t('mismatchLead', { a: AGENT })}</p>
      ${c('both', 'bothT', 'bothS')}${c('ended', 'leftT', 'leftS')}${c('wrong', 'wrongT', 'wrongS')}
      ${why(t('mismatchWhy'), 'Handbook 5-3.A.1')}
    </div>`;
  },
  sign() {
    const item = itemById(S.current);
    const who = PEOPLE[item.who];
    if (item.form === 'ended') {
      return `${bar()}<div class="screen">
        <h2>${t('endedTitle')}</h2>
        <p class="lead">${t('endedLead', { a: AGENT })}</p>
        <label for="lastday">${t('lastDay')}</label><input type="date" id="lastday" value="2026-09-25">
        <label style="display:flex;gap:10px;align-items:flex-start;font-weight:500"><input type="checkbox" id="noreturn" checked style="margin-top:4px"> ${t('noReturn')}</label>
        <label for="sig">${t('signName')}</label><input type="text" id="sig" placeholder="${who.name}" autocomplete="name">
        <button type="button" class="btn" data-act="signEnded">${t('signBtn')}</button>
        <p class="muted">${t('mayCheck', { a: AGENT })}</p>
        ${why(t('endedWhy'), 'Handbook 5-3.A.1; H-1C')}
      </div>`;
    }
    const c = (v, label) => `<button type="button" class="choice ${S.assetsOver === v ? 'selected' : ''}" data-act="assets" data-v="${v}"><b>${label}</b></button>`;
    return `${bar()}<div class="screen">
      <button type="button" class="link" data-act="go" data-to="checklist">${t('back')}</button>
      <h2 style="margin-top:12px">${t('assetsH', { name: who.first })}</h2>
      <p class="lead">${t('assetsQ', { x: ASSET_LIMIT })}</p>
      ${c(false, t('no'))}${c(true, t('yes'))}
      <label for="sig">${t('signName')}</label><input type="text" id="sig" placeholder="${who.name}" autocomplete="name">
      <button type="button" class="btn" data-act="signAssets" ${disabled(S.assetsOver === null)}>${t('signBtn')}</button>
      ${why(item.why, item.cite)}
    </div>`;
  },
  sendConfirm() {
    const left = items().filter((i) => !S.status[i.id]);
    return `${bar()}<div class="screen">
      <h2>${plural('left1', 'leftN', left.length)}</h2>
      <p class="lead">${t('sendNote', { date: DUE() })}</p>
      ${left.map((i) => `<div class="card"><b>${esc(i.title)}</b><div class="muted">${whoLabel(i.who)}</div></div>`).join('')}
      <button type="button" class="btn" data-act="confirmSend">${t('sendWhat')}</button>
      <button type="button" class="btn secondary" data-act="go" data-to="checklist">${t('keepWorking')}</button>
    </div>`;
  },
  done() {
    const all = items();
    const left = all.filter((i) => !S.status[i.id]);
    const st = (i) => (S.status[i.id] === 'warn' ? t('stNote') : S.status[i.id] ? t('stSent') : t('stNot'));
    return `${bar()}<div class="screen">
      <div class="alert good"><b>${t('sentT', { a: AGENT })}</b>${t('receipt', { date: fd(TODAY, 'full') })}</div>
      ${all.map((i) => `<div class="item" style="cursor:default"><span class="status ${S.status[i.id] || ''}">${S.status[i.id] === 'done' ? '✓' : S.status[i.id] === 'warn' ? '!' : ''}</span><span class="text"><span class="title">${esc(i.title)}</span><span class="muted">${whoLabel(i.who)} · ${st(i)}</span></span></div>`).join('')}
      <h3>${t('nextH')}</h3>
      <p class="muted">${t('nextB', { a: AGENT })}${left.length ? t('nextMissing', { date: DUE() }) : ''}</p>
      ${why(t('nextWhy'), 'Handbook 4-5.D.2')}
      <button type="button" class="btn secondary" data-act="go" data-to="agent">${t('seeAgent', { a: AGENT })}</button>
      ${left.length ? `<button type="button" class="btn ghost" data-act="go" data-to="checklist">${t('addMissing')}</button>` : ''}
    </div>`;
  },
  reminders() {
    let body;
    if (!S.reminders) {
      body = `<div class="card soft"><div class="muted">${t('remOff')}</div></div>`;
    } else {
      const due = fd(DUE_ISO, 'due');
      const titles = (list, forLuis) => list.map((i) => (i.who === 'luis' && !forLuis ? `${i.title} (Luis)` : i.title)).join(S.lang.startsWith('zh') ? '；' : '; ');
      const maria = S.luisLink ? missingFor('maria') : items().filter((i) => !S.status[i.id]);
      const luis = missingFor('luis');
      const sms = (name, list, extra = '') => (list.length
        ? `<div class="card"><b>${t('smsTo', { name })}</b><div class="sms">${esc(t('smsBody', { n: REMINDER_WEEKDAYS_LEFT, b: BUILDING, date: due, items: titles(list, name === 'Luis') }))}${esc(extra)}</div></div>`
        : `<div class="card soft"><div class="muted">${t('smsNone', { name })}</div></div>`);
      body = sms('Maria', maria, S.luisLink && luis.length ? plural('smsLuisLeft1', 'smsLuisLeftN', luis.length, { k: luis.length }) : '')
        + (S.luisLink ? sms('Luis', luis) : `<p class="muted">${t('smsNoLink')}</p>`);
    }
    return `${bar()}<div class="screen">
      <button type="button" class="link" data-act="go" data-to="${S.back}">${t('backPlain')}</button>
      <h2 style="margin-top:12px">${t('remH')}</h2><p class="lead">${t('remLead')}</p>
      ${body}
    </div>`;
  },
  agent() {
    const people = ['household', 'maria', 'luis', 'sofia'];
    const all = items();
    const summary = people.map((p) => {
      const pi = all.filter((i) => i.who === p);
      if (!pi.length) return '';
      const got = pi.filter((i) => S.status[i.id]).length;
      const flagged = pi.filter((i) => S.status[i.id] === 'warn').length;
      return `<tr><td>${p === 'household' ? 'Household' : PEOPLE[p].first}</td><td>${got} of ${pi.length} received${flagged ? `, ${flagged} flagged` : ''}</td></tr>`;
    }).join('');
    const rows = all.map((i) => `<tr><td>${i.who === 'household' ? 'Household' : PEOPLE[i.who].first}</td><td>${esc(i.en)}</td>
      <td>${S.status[i.id] === 'done' ? 'Received' : S.status[i.id] === 'warn' ? 'Received, flagged' : 'Missing'}</td><td>${esc(S.notes[i.id] || '')}</td></tr>`).join('');
    return `<div class="bar"><div class="brand">Pilot<span>.</span> <span style="color:var(--muted);font-weight:500">for ${AGENT}</span></div></div><div class="screen">
      <h2>Santos household</h2>
      <p class="lead">${BUILDING} · Applicant language: ${LANGS.find((l) => l.code === S.lang).label}. Pilot flags problems but makes no eligibility decision. You review, decide, and upload the file to Housing Connect.</p>
      <h3>By person</h3>
      <table><thead><tr><th>Person</th><th>Status</th></tr></thead><tbody>${summary}</tbody></table>
      <h3>By item</h3>
      <table><thead><tr><th>Person</th><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
      <button type="button" class="btn secondary" data-act="go" data-to="done">Back to applicant view</button>
    </div>`;
  },
};

function row(i) {
  const st = S.status[i.id];
  const nFiles = (S.files[i.id] || []).length;
  const sub = st === 'warn' ? t('subWarn') : st === 'done' ? (i.kind === 'sign' ? t('subSigned') : plural('subFiles1', 'subFilesN', nFiles)) : i.need;
  return `<button type="button" class="item" data-act="open" data-id="${i.id}">
    <span class="status ${st || ''}" aria-hidden="true">${st === 'done' ? '✓' : st === 'warn' ? '!' : ''}</span>
    <span class="text"><span class="title">${esc(i.title)}</span><span class="muted">${esc(sub)}</span>
    ${i.agentAsks ? `<br><span class="tag">${t('agentAsks', { a: AGENT })}</span>` : ''}${i.kind === 'sign' ? `<br><span class="tag">${t('signHere')}</span>` : ''}</span>
    <span class="chev" aria-hidden="true">›</span></button>`;
}

function render() {
  document.documentElement.lang = S.lang;
  $app.innerHTML = screens[S.screen]();
}

let toastTimer;
function toast(key) {
  const el = document.getElementById('toast');
  el.textContent = t(key); el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

function go(screen) {
  S.screen = screen;
  render();
  window.scrollTo(0, 0);
}

// ---------- actions ----------
const actions = {
  go: (el) => go(el.dataset.to),
  reminders: () => { S.reminders = !S.reminders; render(); },
  remPreview: () => { S.back = S.screen; go('reminders'); },
  benefits: (el) => { S.benefits = el.dataset.v === 'true'; render(); },
  benefitsNext: () => {
    if (S.benefits === true) { S.current = 'benefits_letter'; S.picked = []; S.result = null; go('upload'); } else go('checklist');
  },
  viewer: (el) => { S.viewer = el.dataset.v; render(); },
  luisLink: () => { S.luisLink = true; render(); toast('tLink'); },
  open: (el) => {
    S.current = el.dataset.id; S.picked = [...(S.files[S.current] || [])]; S.result = null;
    go(itemById(S.current).kind === 'sign' ? 'sign' : 'upload');
  },
  pick: (el) => {
    const id = el.dataset.id;
    S.picked = S.picked.includes(id) ? S.picked.filter((x) => x !== id) : [...S.picked, id];
    S.result = null; render();
  },
  check: () => {
    const item = itemById(S.current);
    const pool = SAMPLES[item.id] || [];
    const docs = S.picked.map((id) => pool.find((d) => d.id === id)).filter(Boolean);
    S.result = checkUpload(item, docs);
    if (S.result.kind === 'mismatch') return go('mismatch');
    render();
  },
  clearResult: () => { S.result = null; render(); },
  accept: () => {
    S.status[S.current] = 'done'; S.files[S.current] = [...S.picked]; delete S.notes[S.current];
    if (S.current === 'benefits_letter') toast('tLetterOk');
    go('checklist');
  },
  sendAnyway: () => {
    S.status[S.current] = 'warn'; S.files[S.current] = [...S.picked];
    S.notes[S.current] = `Applicant sent anyway. Pilot flagged: ${S.result.en}.`;
    if (S.current === 'benefits_letter') { S.stubsToo = true; toast('tLetterNote'); }
    go('checklist');
  },
  useStubs: () => {
    delete S.status.benefits_letter; S.benefits = false; S.stubsToo = false;
    toast('tStubs'); go('checklist');
  },
  job: (el) => {
    const v = el.dataset.v;
    if (v === 'wrong') { S.picked = []; S.result = null; return go('upload'); }
    S.luisJob = v;
    if (v === 'both') {
      S.result = null; S.current = 'luis_stubs'; S.screen = 'upload'; toast('tMetro');
      actions.check();
    } else {
      S.current = 'luis_ended'; go('sign');
    }
  },
  signEnded: () => {
    const sig = document.getElementById('sig').value.trim();
    if (!sig) { toast('signName'); return; }
    const last = document.getElementById('lastday').value;
    S.status.luis_ended = 'done';
    S.notes.luis_ended = `Last day ${last ? enDate(last) : 'not given'}. ${document.getElementById('noreturn').checked ? "Doesn't expect to return within 12 months." : 'May return.'} Signed "${sig}".`;
    S.current = 'luis_stubs'; S.result = null;
    toast('tEnded');
    S.screen = 'upload'; actions.check();
  },
  assets: (el) => { S.assetsOver = el.dataset.v === 'true'; const v = document.getElementById('sig')?.value; render(); if (v) document.getElementById('sig').value = v; },
  signAssets: () => {
    const sig = document.getElementById('sig').value.trim();
    if (!sig) { toast('signName'); return; }
    S.status[S.current] = 'done';
    S.notes[S.current] = `Signed "${sig}". Household assets ${S.assetsOver ? 'over' : 'under'} ${ASSET_LIMIT}.`;
    toast(S.assetsOver ? 'tSignedBank' : 'tSigned');
    go('checklist');
  },
  send: () => {
    const left = items().filter((i) => !S.status[i.id]);
    go(left.length ? 'sendConfirm' : 'done');
  },
  confirmSend: () => go('done'),
};

$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el);
});
$app.addEventListener('change', (e) => {
  if (e.target.dataset.change === 'lang') {
    const sig = document.getElementById('sig')?.value;
    S.lang = e.target.value;
    if (S.result && S.screen === 'upload') actions.check(); else render();
    if (sig && document.getElementById('sig')) document.getElementById('sig').value = sig;
    $app.querySelector('select[data-change=lang]')?.focus();
  }
});
document.querySelectorAll('.js-restart').forEach((el) => el.addEventListener('click', () => { S = initial(S.lang); go('welcome'); }));
// Reviewer shortcut: jump straight to the agent's view. If nothing has been done yet,
// fill in a realistic, partly finished household so the view has something to show.
function seedSample() {
  Object.assign(S, {
    benefits: false, luisJob: 'ended', luisLink: true, assetsOver: false,
    status: { maria_stubs: 'warn', luis_ended: 'done', luis_stubs: 'done', maria_assets: 'done', maria_id: 'done' },
    files: { maria_stubs: ['m23'], luis_stubs: ['f22', 'f15', 'f08', 'f01'], maria_id: ['idm'] },
    notes: {
      maria_stubs: 'Applicant sent anyway. Pilot flagged: 1 of 2 stubs.',
      luis_ended: 'Last day Sep 25, 2026. Doesn\'t expect to return within 12 months. Signed "Luis Santos".',
      maria_assets: 'Signed "Maria Santos". Household assets under $51,600.',
    },
  });
}
function openAgent() {
  if (S.benefits === null) seedSample();
  go('agent');
}
document.querySelectorAll('.js-agent').forEach((el) => el.addEventListener('click', openAgent));
if (location.hash === '#agent') openAgent();
window.addEventListener('hashchange', () => { if (location.hash === '#agent') openAgent(); });
document.querySelectorAll('.js-reminders').forEach((el) => el.addEventListener('click', () => {
  if (S.screen !== 'reminders') { S.back = S.screen; go('reminders'); }
}));
render();
