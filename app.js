// Pilot: clickable prototype of the applicant's document upload.
// All people, the building, the agent and the documents are fictional sample data.
// Rules cite the HPD/HDC Marketing Handbook (April 2025) by section, and Attachment H-1C (April 1, 2025).

const TODAY = '2026-10-28';
const DUE = 'Mon, Nov 9';
const WEEKDAYS_LEFT = 8; // request sent Mon Oct 26; at least 10 weekdays to respond (4-5.D.1.d)
const BUILDING = 'Willow Court';
const AGENT = 'Sample Leasing Co.';
const ASSET_LIMIT = '$51,600'; // H-1C; the current HUD figure must be used (5-4.I)

const PEOPLE = {
  maria: { name: 'Maria Santos', first: 'Maria', initial: 'M', detail: 'Adult · works at Bright Smile Dental, paid every two weeks' },
  luis: { name: 'Luis Santos', first: 'Luis', initial: 'L', detail: 'Adult · works at Metro Deli, paid weekly' },
  sofia: { name: 'Sofia Santos', first: 'Sofia', initial: 'S', detail: 'Child, age 9' },
};

const SAMPLES = {
  maria_stubs: [
    { id: 'm23', label: 'Pay stub · Bright Smile Dental', sub: 'Pay date Oct 23, 2026', type: 'stub', employer: 'Bright Smile Dental', date: '2026-10-23' },
    { id: 'm09', label: 'Pay stub · Bright Smile Dental', sub: 'Pay date Oct 9, 2026', type: 'stub', employer: 'Bright Smile Dental', date: '2026-10-09' },
    { id: 'm828', label: 'Pay stub · Bright Smile Dental', sub: 'Pay date Aug 28, 2026', type: 'stub', employer: 'Bright Smile Dental', date: '2026-08-28' },
    { id: 'mblur', label: 'Photo of a pay stub', sub: 'Blurry, taken at an angle', type: 'unreadable' },
  ],
  luis_stubs: [
    { id: 'f22', label: 'Pay stub · Fresh Market Co.', sub: 'Pay date Oct 22, 2026', type: 'stub', employer: 'Fresh Market Co.', date: '2026-10-22' },
    { id: 'f15', label: 'Pay stub · Fresh Market Co.', sub: 'Pay date Oct 15, 2026', type: 'stub', employer: 'Fresh Market Co.', date: '2026-10-15' },
    { id: 'f08', label: 'Pay stub · Fresh Market Co.', sub: 'Pay date Oct 8, 2026', type: 'stub', employer: 'Fresh Market Co.', date: '2026-10-08' },
    { id: 'f01', label: 'Pay stub · Fresh Market Co.', sub: 'Pay date Oct 1, 2026', type: 'stub', employer: 'Fresh Market Co.', date: '2026-10-01' },
  ],
  luis_metro: [
    { id: 'd23', label: 'Pay stub · Metro Deli', sub: 'Pay date Oct 23, 2026', type: 'stub', employer: 'Metro Deli', date: '2026-10-23' },
    { id: 'd16', label: 'Pay stub · Metro Deli', sub: 'Pay date Oct 16, 2026', type: 'stub', employer: 'Metro Deli', date: '2026-10-16' },
    { id: 'd09', label: 'Pay stub · Metro Deli', sub: 'Pay date Oct 9, 2026', type: 'stub', employer: 'Metro Deli', date: '2026-10-09' },
    { id: 'd02', label: 'Pay stub · Metro Deli', sub: 'Pay date Oct 2, 2026', type: 'stub', employer: 'Metro Deli', date: '2026-10-02' },
  ],
  benefits_letter: [
    { id: 'lgood', label: 'SNAP award letter (sample)', sub: 'Dated Jun 12, 2026 · lists Maria, Luis, Sofia', type: 'letter', date: '2026-06-12', members: ['maria', 'luis', 'sofia'] },
    { id: 'lold', label: 'SNAP award letter (sample)', sub: 'Dated Jan 20, 2025 · lists Maria, Luis, Sofia', type: 'letter', date: '2025-01-20', members: ['maria', 'luis', 'sofia'] },
    { id: 'lmiss', label: 'SNAP award letter (sample)', sub: 'Dated Jun 12, 2026 · lists Maria, Sofia', type: 'letter', date: '2026-06-12', members: ['maria', 'sofia'] },
    { id: 'lstub', label: 'Pay stub · Bright Smile Dental', sub: 'Pay date Oct 23, 2026', type: 'stub' },
  ],
  maria_id: [{ id: 'idm', label: "Driver's license · Maria Santos", sub: 'Front and back', type: 'id' }],
  luis_id: [{ id: 'idl', label: 'IDNYC card · Luis Santos', sub: 'Front and back', type: 'id' }],
  sofia_bc: [{ id: 'bc', label: 'Birth certificate · Sofia Santos', sub: 'Copy', type: 'birth' }],
  asset_statements: [{ id: 'bank', label: 'Bank statement · September 2026', sub: 'Checking and savings', type: 'bank' }],
};

const initial = () => ({
  screen: 'welcome',
  viewer: 'maria',
  reminders: true,
  benefits: null,       // true | false | null
  letterOk: false,
  luisJob: null,        // null | 'both' | 'ended'
  luisLink: false,
  assetsOver: null,
  status: {},           // id -> 'done' | 'warn'
  files: {},            // id -> [sample ids]
  notes: {},            // id -> string shown to the agent
  current: null,        // item id being worked on
  picked: [],           // sample ids selected on the upload screen
  result: null,         // check result on the upload screen
  sent: false,
  stubsToo: false,     // letter sent anyway without covering everyone
});
let S = initial();

// ---------- checklist built from the frozen application (R1) ----------
function items() {
  const list = [];
  if (S.benefits === true) {
    list.push({ id: 'benefits_letter', who: 'household', kind: 'upload', title: 'Benefits award letter',
      need: 'One letter from SNAP, Medicaid, TANF or WIC, from the last 12 months, listing everyone on your application.',
      why: 'If the letter lists everyone on your application, it replaces your other income documents.', cite: 'H-1C; Handbook 5-4.A.2' });
  }
  if (S.benefits === false || S.stubsToo) {
    list.push({ id: 'maria_stubs', who: 'maria', kind: 'upload', title: 'Pay stubs · Bright Smile Dental', count: 2, period: 14, employer: 'Bright Smile Dental',
      need: "Your 2 most recent pay stubs, back to back. You're paid every two weeks.",
      why: 'Every adult with a job sends recent pay stubs covering about a month: 2 if paid monthly, twice a month or every two weeks; 4 if paid weekly.', cite: 'Handbook 5-4.C' });
    if (S.luisJob === 'both') {
      list.push({ id: 'luis_metro', who: 'luis', kind: 'upload', title: 'Pay stubs · Metro Deli', count: 4, period: 7, employer: 'Metro Deli',
        need: "Your 4 most recent Metro Deli pay stubs, back to back. You're paid weekly.", why: 'Each job needs its own pay stubs.', cite: 'Handbook 5-4.C' });
    }
    if (S.luisJob === 'ended') {
      list.push({ id: 'luis_ended', who: 'luis', kind: 'sign', form: 'ended', title: 'Statement: Metro Deli job ended',
        need: 'Your last day at Metro Deli, signed.', why: 'Your application lists Metro Deli. When a job has ended, the agent needs to know your last day.', cite: 'Handbook 5-3.A.1; H-1C' });
    }
    const fm = S.luisJob === 'both' || S.luisJob === 'ended';
    list.push({ id: 'luis_stubs', who: 'luis', kind: 'upload', title: fm ? 'Pay stubs · Fresh Market Co.' : 'Pay stubs · Metro Deli', count: 4, period: 7,
      employer: fm ? 'Fresh Market Co.' : 'Metro Deli',
      need: `Your 4 most recent ${fm ? 'Fresh Market Co.' : 'Metro Deli'} pay stubs, back to back. You're paid weekly.`,
      why: 'Every adult with a job sends recent pay stubs covering about a month: 4 if paid weekly.', cite: 'Handbook 5-4.C' });
  }
  list.push(
    { id: 'maria_assets', who: 'maria', kind: 'sign', form: 'assets', title: 'Asset statement',
      need: 'A short form about savings and property. Every adult signs one.', why: `Every adult signs this form. If your household's assets are under ${ASSET_LIMIT}, it's the only asset document you need.`, cite: 'Handbook 5-4.I.1; H-1C' },
    { id: 'luis_assets', who: 'luis', kind: 'sign', form: 'assets', title: 'Asset statement',
      need: 'A short form about savings and property. Every adult signs one.', why: `Every adult signs this form. If your household's assets are under ${ASSET_LIMIT}, it's the only asset document you need.`, cite: 'Handbook 5-4.I.1; H-1C' },
    { id: 'maria_id', who: 'maria', kind: 'upload', title: 'Photo ID', agentAsks: true,
      need: "Any photo ID, like a driver's license, passport or IDNYC card.", why: `${AGENT} asks for photo ID for every adult. It's on the city's document list.`, cite: 'H-1C' },
    { id: 'luis_id', who: 'luis', kind: 'upload', title: 'Photo ID', agentAsks: true,
      need: "Any photo ID, like a driver's license, passport or IDNYC card.", why: `${AGENT} asks for photo ID for every adult. It's on the city's document list.`, cite: 'H-1C' },
    { id: 'sofia_bc', who: 'sofia', kind: 'upload', title: "Sofia's birth certificate", agentAsks: true,
      need: 'A copy is fine. Maria sends this one.', why: `${AGENT} asks for a birth certificate for every child. It's on the city's document list.`, cite: 'H-1C' },
  );
  if (S.assetsOver) {
    list.push({ id: 'asset_statements', who: 'household', kind: 'upload', title: 'Bank and investment statements',
      need: 'Most recent statements for every account, including apps like Venmo or Cash App.', why: `Households with more than ${ASSET_LIMIT} in assets send statements, not just the signed form.`, cite: 'H-1C; Handbook 5-4.I.3' });
  }
  return list;
}
const visibleItems = () => items().filter((i) => S.viewer === 'maria' || i.who === 'luis');
const itemById = (id) => items().find((i) => i.id === id);

// ---------- checks: warn and explain, never block (R6) ----------
const days = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);
const fmt = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}, ${y}`;
};

function checkUpload(item, docs) {
  if (docs.some((d) => d.type === 'unreadable')) {
    return { kind: 'warn', title: "We couldn't read one of these.", body: 'Try another photo: flat on a table, in good light, with all four corners showing. We never guess at what a document says.' };
  }
  if (item.count) {
    if (docs.some((d) => d.type !== 'stub')) return { kind: 'warn', title: "This doesn't look like a pay stub.", body: 'This item needs pay stubs.' };
    const other = docs.find((d) => d.employer !== item.employer);
    if (other && item.id === 'luis_stubs' && !S.luisJob) return { kind: 'mismatch', employer: other.employer };
    if (other) return { kind: 'warn', title: `This stub is from ${dot(other.employer)}`, body: `This item is for ${item.employer}.` };
    const sorted = [...docs].sort((a, b) => b.date.localeCompare(a.date));
    for (let i = 1; i < sorted.length; i++) {
      if (days(sorted[i - 1].date, sorted[i].date) > item.period + 2) {
        return { kind: 'warn', title: "These stubs aren't back to back.",
          body: `There are pay dates missing between ${fmt(sorted[i].date)} and ${fmt(sorted[i - 1].date)}. Send your most recent stubs, one after another.`, cite: 'Handbook 5-4.C' };
      }
    }
    if (docs.length < item.count) {
      const n = item.count - docs.length;
      return { kind: 'warn', title: `We need ${item.count} pay stubs in a row. You've added ${docs.length}.`,
        body: `Add ${n} more: the ${n === 1 ? 'one' : 'ones'} right before ${fmt(sorted[sorted.length - 1].date)}.`, cite: 'Handbook 5-4.C' };
    }
    return { kind: 'good', title: `${item.count} pay stubs in a row.`, body: `${item.employer}, ${sorted.map((d) => fmt(d.date).replace(', 2026', '')).reverse().join(', ')}.` };
  }
  if (item.id === 'benefits_letter') {
    const d = docs[0];
    if (docs.length > 1) return { kind: 'warn', title: 'Pick one letter.', body: 'One letter that lists everyone is enough.' };
    if (d.type !== 'letter') return { kind: 'warn', title: "This doesn't look like a benefits letter.", body: 'It looks like a pay stub. This item needs an award letter from SNAP, Medicaid, TANF or WIC.' };
    if (days(TODAY, d.date) > 365) return { kind: 'warn', title: `This letter is from ${fmt(d.date)}.`, body: 'It needs to be from the last 12 months. Look for a newer letter, or use pay stubs instead.', cite: 'H-1C; Handbook 5-4.A.2', alt: true };
    const missing = Object.keys(PEOPLE).filter((p) => !d.members.includes(p));
    if (missing.length) {
      const names = missing.map((p) => PEOPLE[p].first).join(' and ');
      return { kind: 'warn', title: `${names} isn't on this letter.`, body: 'A letter replaces income documents only when it lists everyone on your application. You can still send it, but everyone\'s pay stubs stay on your list.', cite: 'H-1C', alt: true };
    }
    return { kind: 'good', title: 'This letter lists everyone on your application.', body: "You don't need to send pay stubs. Your list just got shorter." };
  }
  return { kind: 'good', title: 'Got it.', body: 'This looks like the right document.' };
}

// ---------- rendering ----------
const dot = (s) => (s.endsWith('.') ? s : s + '.');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $app = document.getElementById('app');

function bar() {
  return `<div class="bar"><div class="brand">Pilot<span>.</span></div><div class="due">Due ${DUE} · ${WEEKDAYS_LEFT} weekdays left</div></div>`;
}
function viewerBar() {
  if (!S.luisLink) return '';
  return `<div class="viewer">Viewing as
    <button type="button" data-act="viewer" data-v="maria" aria-pressed="${S.viewer === 'maria'}">Maria</button>
    <button type="button" data-act="viewer" data-v="luis" aria-pressed="${S.viewer === 'luis'}">Luis</button></div>`;
}
function why(text, cite) {
  return `<details class="why"><summary>Why?</summary><p>${esc(text)} <span class="cite">${esc(cite)}</span></p></details>`;
}

const screens = {
  welcome() {
    return `${bar()}<div class="screen">
      <h2>Hi Maria, your application for ${BUILDING} was picked for review.</h2>
      <p class="lead">To keep your place, send your documents to ${AGENT} by <b>${DUE}</b>. We'll show you exactly what each person needs.</p>
      <div class="card soft"><div class="muted">Shown in English, the language on your application.</div>
      ${why('All messages come in the language you chose when you applied.', 'Handbook 4-3.C.3')}</div>
      <div class="card"><div class="toggle"><div><b>Text me reminders</b><div class="muted">Before the deadline, if anything is still missing</div></div>
        <button type="button" class="switch" role="switch" aria-checked="${S.reminders}" aria-label="Text me reminders" data-act="reminders"></button></div>
        ${S.reminders ? `<div class="sms">Pilot: 3 items left for ${BUILDING}. Due ${DUE}. Tap to continue.</div>` : ''}</div>
      <button type="button" class="btn" data-act="go" data-to="household">Get started</button>
      ${why('You have at least 10 weekdays from the request to respond.', 'Handbook 4-5.D.1.d')}
    </div>`;
  },
  household() {
    const rows = Object.values(PEOPLE).map((p) => `<div class="card"><div class="person"><div class="avatar">${p.initial}</div><div><b>${p.name}</b><div class="muted">${p.detail}</div></div></div></div>`).join('');
    return `${bar()}<div class="screen">
      <h2>Here's who is on your application</h2>
      <p class="lead">Your list is built from these answers.</p>
      ${rows}
      <div class="card soft"><div class="muted">These answers can't be changed now that you've been picked. If something has changed, like a new job, we'll ask about it as you upload.</div>
      ${why('Once an application is picked for review, its answers are frozen. Changes are explained, not edited.', 'Handbook 5-3')}</div>
      <button type="button" class="btn" data-act="go" data-to="benefits">Continue</button>
    </div>`;
  },
  benefits() {
    const c = (v, t, s) => `<button type="button" class="choice ${S.benefits === v ? 'selected' : ''}" data-act="benefits" data-v="${v}"><b>${t}</b><span class="muted">${s}</span></button>`;
    return `${bar()}<div class="screen">
      <h2>Does anyone in your household get SNAP, Medicaid, TANF or WIC?</h2>
      <p class="lead">One letter from these programs can replace everyone's pay stubs.</p>
      ${c(true, 'Yes', 'I can send an award letter from the last 12 months')}
      ${c(false, 'No', "We'll send pay stubs instead")}
      ${why('An award letter from the last 12 months that lists everyone on your application replaces your other income documents.', 'H-1C; Handbook 5-4.A.2')}
      <button type="button" class="btn" data-act="benefitsNext" ${S.benefits === null ? 'disabled style="opacity:.4"' : ''}>Continue</button>
    </div>`;
  },
  checklist() {
    const list = visibleItems();
    const done = list.filter((i) => S.status[i.id]).length;
    const groups = S.viewer === 'luis' ? ['luis'] : ['household', 'maria', 'luis', 'sofia'];
    const label = { household: 'Household', maria: 'Maria', luis: 'Luis', sofia: 'Sofia' };
    const html = groups.map((g) => {
      const gi = list.filter((i) => i.who === g);
      if (!gi.length) return '';
      const gdone = gi.filter((i) => S.status[i.id]).length;
      const link = g === 'luis' && S.viewer === 'maria'
        ? (S.luisLink ? '<span class="muted">Link sent</span>' : '<button type="button" class="link" data-act="luisLink">Send Luis his own link</button>')
        : `<span class="muted">${gdone} of ${gi.length}</span>`;
      return `<div class="group"><div class="group-head"><h3>${label[g]}</h3>${link}</div>${gi.map(row).join('')}</div>`;
    }).join('');
    const intro = S.viewer === 'luis'
      ? `<h2>Hi Luis, here are your items</h2><p class="lead">Maria added you. You'll only see what's yours, and Maria sees your progress.</p>`
      : `<h2>Your list</h2><p class="lead">Only what applies to your household, grouped by person.</p>`;
    return `${bar()}${viewerBar()}<div class="screen">${intro}
      <div class="progress" aria-hidden="true"><div style="width:${list.length ? (done / list.length) * 100 : 0}%"></div></div>
      <div class="muted">${done} of ${list.length} done</div>
      ${html}
      ${S.viewer === 'maria' ? `<button type="button" class="btn" data-act="send">Send to ${AGENT}</button>
        <p class="muted" style="text-align:center;margin-top:8px">You can send what you have now and add the rest before ${DUE}.</p>` : ''}
    </div>`;
  },
  upload() {
    const item = itemById(S.current);
    const docs = SAMPLES[item.id] || SAMPLES[item.id === 'luis_metro' ? 'luis_metro' : item.id];
    const r = S.result;
    const docBtns = docs.map((d) => `<button type="button" class="doc ${S.picked.includes(d.id) ? 'selected' : ''}" data-act="pick" data-id="${d.id}" aria-pressed="${S.picked.includes(d.id)}">
      <span class="thumb" aria-hidden="true"></span><span><b>${esc(d.label)}</b><br><span class="muted">${esc(d.sub)}</span></span><span class="check" aria-hidden="true">${S.picked.includes(d.id) ? '✓' : ''}</span></button>`).join('');
    let res = '';
    if (r && r.kind === 'warn') {
      res = `<div class="alert warn" role="alert"><b>${esc(r.title)}</b>${esc(r.body)}${r.cite ? ` <span class="cite">${esc(r.cite)}</span>` : ''}</div>
        ${r.alt ? '<button type="button" class="btn" data-act="useStubs">Use pay stubs instead</button>' : '<button type="button" class="btn" data-act="clearResult">Fix it</button>'}
        <button type="button" class="btn secondary" data-act="sendAnyway">Send anyway</button>
        <p class="muted" style="text-align:center;margin-top:8px">${AGENT} decides, not Pilot. Sending anyway is always allowed.</p>`;
    } else if (r && r.kind === 'good') {
      res = `<div class="alert good" role="status"><b>${esc(r.title)}</b>${esc(r.body)}</div><button type="button" class="btn" data-act="accept">Done</button>`;
    }
    return `${bar()}<div class="screen">
      <button type="button" class="link" data-act="go" data-to="checklist">‹ Back to list</button>
      <h2 style="margin-top:12px">${esc(item.title)}</h2>
      <p class="lead">${esc(item.need)}</p>
      ${why(item.why, item.cite)}
      <h3>Choose files</h3>
      <p class="muted" style="margin-top:-4px">Sample files for this prototype. In the real app, this opens your camera or photos.</p>
      ${docBtns}
      ${r ? res : `<button type="button" class="btn" data-act="check" ${S.picked.length ? '' : 'disabled style="opacity:.4"'}>Add ${S.picked.length || ''} file${S.picked.length === 1 ? '' : 's'}</button>`}
    </div>`;
  },
  mismatch() {
    const r = S.result;
    return `${bar()}<div class="screen">
      <h2>This stub is from ${esc(dot(r.employer))} Your application lists Metro Deli.</h2>
      <p class="lead">That's okay. Tell us which is true, so ${AGENT} doesn't have to ask later.</p>
      <button type="button" class="choice" data-act="job" data-v="both"><b>I work at both</b><span class="muted">We'll ask for pay stubs from each job</span></button>
      <button type="button" class="choice" data-act="job" data-v="ended"><b>I left Metro Deli</b><span class="muted">You'll sign a short statement with your last day</span></button>
      <button type="button" class="choice" data-act="job" data-v="wrong"><b>Wrong file</b><span class="muted">Go back and pick another</span></button>
      ${why('When a pay stub shows a different employer than the application, the agent must ask whether it is an added job or one that ended.', 'Handbook 5-3.A.1')}
    </div>`;
  },
  sign() {
    const item = itemById(S.current);
    const who = PEOPLE[item.who];
    if (item.form === 'ended') {
      return `${bar()}<div class="screen">
        <h2>Statement: Metro Deli job ended</h2>
        <p class="lead">Luis, this tells ${AGENT} when your Metro Deli job ended.</p>
        <label for="lastday">Last day at Metro Deli</label><input type="date" id="lastday" value="2026-09-25">
        <label style="display:flex;gap:10px;align-items:flex-start;font-weight:500"><input type="checkbox" id="noreturn" checked style="margin-top:4px"> I don't expect to go back to this job in the next 12 months.</label>
        <label for="sig">Type your full name to sign</label><input type="text" id="sig" value="" placeholder="${who.name}" autocomplete="name">
        <button type="button" class="btn" data-act="signEnded">Sign</button>
        <p class="muted">${AGENT} may also check with Metro Deli.</p>
        ${why('The agent may ask the old employer, or accept your signed statement with your last day and that you don\'t expect to return within 12 months.', 'Handbook 5-3.A.1; H-1C')}
      </div>`;
    }
    const c = (v, t) => `<button type="button" class="choice ${S.assetsOver === v ? 'selected' : ''}" data-act="assets" data-v="${v}"><b>${t}</b></button>`;
    return `${bar()}<div class="screen">
      <button type="button" class="link" data-act="go" data-to="checklist">‹ Back to list</button>
      <h2 style="margin-top:12px">Asset statement · ${who.first}</h2>
      <p class="lead">Together, does your household have more than ${ASSET_LIMIT} in savings, investments and property?</p>
      ${c(false, 'No')}${c(true, 'Yes')}
      <label for="sig">Type your full name to sign</label><input type="text" id="sig" placeholder="${who.name}" autocomplete="name">
      <button type="button" class="btn" data-act="signAssets" ${S.assetsOver === null ? 'disabled style="opacity:.4"' : ''}>Sign</button>
      ${why(item.why, item.cite)}
    </div>`;
  },
  sendConfirm() {
    const left = items().filter((i) => !S.status[i.id]);
    return `${bar()}<div class="screen">
      <h2>${left.length} item${left.length === 1 ? '' : 's'} still to go</h2>
      <p class="lead">You can send what you have now and add the rest before ${DUE}.</p>
      ${left.map((i) => `<div class="card"><b>${esc(i.title)}</b><div class="muted">${i.who === 'household' ? 'Household' : PEOPLE[i.who].first}</div></div>`).join('')}
      <button type="button" class="btn" data-act="confirmSend">Send what I have</button>
      <button type="button" class="btn secondary" data-act="go" data-to="checklist">Keep working</button>
    </div>`;
  },
  done() {
    const all = items();
    const left = all.filter((i) => !S.status[i.id]);
    return `${bar()}<div class="screen">
      <div class="alert good"><b>Sent to ${AGENT}</b>Wed, Oct 28, 2026. Keep this as your receipt.</div>
      ${all.map((i) => `<div class="item" style="cursor:default"><span class="status ${S.status[i.id] || ''}">${S.status[i.id] === 'done' ? '✓' : S.status[i.id] === 'warn' ? '!' : ''}</span><span class="text"><span class="title">${esc(i.title)}</span><span class="muted">${i.who === 'household' ? 'Household' : PEOPLE[i.who].first} · ${S.status[i.id] === 'warn' ? 'sent with a note' : S.status[i.id] ? 'sent' : 'not sent yet'}</span></span></div>`).join('')}
      <h3>What happens next</h3>
      <p class="muted">${AGENT} reviews your documents and decides. Pilot doesn't decide who qualifies. If anything else is needed, they'll ask, and you'll have at least 5 weekdays to send it.${left.length ? ` You can still add the ${left.length} missing item${left.length === 1 ? '' : 's'} before ${DUE}.` : ''}</p>
      ${why('Missing items get a follow-up request with at least 5 weekdays to respond.', 'Handbook 4-5.D.2')}
      <button type="button" class="btn secondary" data-act="go" data-to="agent">See what ${AGENT} receives</button>
      ${left.length ? '<button type="button" class="btn ghost" data-act="go" data-to="checklist">Add missing items</button>' : ''}
    </div>`;
  },
  agent() {
    const rows = items().map((i) => `<tr><td>${i.who === 'household' ? 'Household' : PEOPLE[i.who].first}</td><td>${esc(i.title)}</td>
      <td>${S.status[i.id] === 'done' ? 'Received' : S.status[i.id] === 'warn' ? 'Received, flagged' : 'Missing'}</td><td>${esc(S.notes[i.id] || '')}</td></tr>`).join('');
    return `<div class="bar"><div class="brand">Pilot<span>.</span> <span style="color:var(--muted);font-weight:500">for ${AGENT}</span></div></div><div class="screen">
      <h2>Santos household</h2>
      <p class="lead">${BUILDING} · Grouped by person. Pilot flags problems but makes no eligibility decision. You review, decide, and upload the file to Housing Connect.</p>
      <table><thead><tr><th>Person</th><th>Item</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
      <button type="button" class="btn secondary" data-act="go" data-to="done">Back to applicant view</button>
    </div>`;
  },
};

function row(i) {
  const st = S.status[i.id];
  const sub = st === 'warn' ? 'Sent with a note' : st === 'done' ? (i.kind === 'sign' ? 'Signed' : `${(S.files[i.id] || []).length} file${(S.files[i.id] || []).length === 1 ? '' : 's'} added`) : i.need;
  return `<button type="button" class="item" data-act="open" data-id="${i.id}">
    <span class="status ${st || ''}" aria-hidden="true">${st === 'done' ? '✓' : st === 'warn' ? '!' : ''}</span>
    <span class="text"><span class="title">${esc(i.title)}</span><span class="muted">${esc(sub)}</span>
    ${i.agentAsks ? `<br><span class="tag">${AGENT} asks for this</span>` : ''}${i.kind === 'sign' ? '<br><span class="tag">Sign here</span>' : ''}</span>
    <span class="chev" aria-hidden="true">›</span></button>`;
}

function render() {
  $app.innerHTML = screens[S.screen]();
  const h = $app.querySelector('h2');
  if (h) { h.setAttribute('tabindex', '-1'); }
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
}

function go(screen) {
  S.screen = screen;
  render();
  document.querySelector('.phone').scrollTo?.(0, 0);
  window.scrollTo(0, 0);
}

// ---------- actions ----------
const actions = {
  go: (el) => go(el.dataset.to),
  reminders: () => { S.reminders = !S.reminders; render(); },
  benefits: (el) => { S.benefits = el.dataset.v === 'true'; render(); },
  benefitsNext: () => {
    if (S.benefits === true) { S.current = 'benefits_letter'; S.picked = []; S.result = null; go('upload'); } else go('checklist');
  },
  viewer: (el) => { S.viewer = el.dataset.v; render(); },
  luisLink: () => { S.luisLink = true; render(); toast('Text sent to Luis with his own link. He sees only his items.'); },
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
    if (S.current === 'benefits_letter') { S.letterOk = true; toast('Letter added. Pay stubs are off your list.'); }
    go('checklist');
  },
  sendAnyway: () => {
    S.status[S.current] = 'warn'; S.files[S.current] = [...S.picked];
    S.notes[S.current] = `Applicant sent anyway. Pilot flagged: ${S.result.title}`;
    if (S.current === 'benefits_letter') { S.stubsToo = true; toast('Letter sent with a note. Pay stubs are still on your list.'); }
    go('checklist');
  },
  useStubs: () => {
    delete S.status.benefits_letter; S.benefits = false; S.stubsToo = false;
    toast('Pay stubs added to your list.'); go('checklist');
  },
  job: (el) => {
    const v = el.dataset.v;
    if (v === 'wrong') { S.picked = []; S.result = null; return go('upload'); }
    S.luisJob = v;
    if (v === 'both') {
      S.result = null; S.current = 'luis_stubs'; S.screen = 'upload'; toast('Metro Deli stubs added to Luis\'s list.');
      actions.check();
    } else {
      S.current = 'luis_ended'; go('sign');
    }
  },
  signEnded: () => {
    const sig = document.getElementById('sig').value.trim();
    if (!sig) { toast('Type your full name to sign.'); return; }
    const last = document.getElementById('lastday').value;
    S.status.luis_ended = 'done';
    S.notes.luis_ended = `Last day ${last ? fmt(last) : 'not given'}. ${document.getElementById('noreturn').checked ? "Doesn't expect to return within 12 months." : 'May return.'} Signed "${sig}".`;
    S.current = 'luis_stubs'; S.result = null;
    toast('Signed. Now finish your Fresh Market stubs.');
    S.screen = 'upload'; actions.check();
  },
  assets: (el) => { S.assetsOver = el.dataset.v === 'true'; const v = document.getElementById('sig')?.value; render(); if (v) document.getElementById('sig').value = v; },
  signAssets: () => {
    const sig = document.getElementById('sig').value.trim();
    if (!sig) { toast('Type your full name to sign.'); return; }
    S.status[S.current] = 'done';
    S.notes[S.current] = `Signed "${sig}". Household assets ${S.assetsOver ? 'over' : 'under'} ${ASSET_LIMIT}.`;
    if (S.assetsOver) toast('Signed. Bank and investment statements added to your list.');
    else toast('Signed.');
    go('checklist');
  },
  send: () => {
    const left = items().filter((i) => !S.status[i.id]);
    if (left.length) go('sendConfirm'); else { S.sent = true; go('done'); }
  },
  confirmSend: () => { S.sent = true; go('done'); },
};

$app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el);
});
document.getElementById('restart').addEventListener('click', () => { S = initial(); go('welcome'); });
render();
