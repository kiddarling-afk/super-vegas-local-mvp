/* Super Vegas local MVP — browser-local, confirmed setup seeded without fictional roster data. */
const STORAGE_KEY = 'super-vegas-local-mvp-v2';
const LEGACY_STORAGE_KEY = 'super-vegas-local-mvp-v1';
const LEGACY_ARCHIVE_KEY = 'super-vegas-local-mvp-v1-archive';

const roles = {
  bowler: { label: 'Bowler', identity: 'Demo bowler view', scope: 'Personal league information' },
  captain: { label: 'Captain', identity: 'Demo captain view', scope: 'Team 1 — temporary team' },
  leagueAdmin: { label: 'League Admin', identity: 'Demo league admin', scope: 'Super Vegas operations' },
  centerAdmin: { label: 'Center Admin', identity: 'Demo center admin', scope: 'Center operations' },
  orgAdmin: { label: 'Organization Admin', identity: 'Demo organization admin', scope: 'Organization reporting' }
};

const localDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const fmt = (n) => Number(n || 0).toLocaleString();
const avg = (nums) => nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length * 10) / 10 : 0;
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function seedTenant(id, organizationName, centers, leagueName, teamName, captainName, accent) {
  const centerRecords = centers.map((name, index) => ({ id: `${id}-center-${index + 1}`, name }));
  const leagueId = `${id}-league-1`;
  const seasonId = `${id}-season-1`;
  const teamId = `${id}-team-1`;
  const memberships = [
    { id: `${id}-m-1`, personId: `${id}-p-1`, displayName: captainName, teamId, position: 1, active: true },
    { id: `${id}-m-2`, personId: `${id}-p-2`, displayName: '', teamId, position: 2, active: false },
    { id: `${id}-m-3`, personId: `${id}-p-3`, displayName: '', teamId, position: 3, active: false },
    { id: `${id}-m-4`, personId: `${id}-p-4`, displayName: '', teamId, position: 4, active: false }
  ];
  return {
    id,
    organization: { id: `${id}-org-1`, name: organizationName, accent },
    centers: centerRecords,
    leagues: [{ id: leagueId, centerId: centerRecords[0].id, name: leagueName, sport: 'Bowling' }],
    seasons: [{ id: seasonId, leagueId, name: 'Fall 2026', startsOn: '2026-09-09', status: 'Active' }],
    teams: [{ id: teamId, seasonId, name: teamName }],
    memberships,
    sessions: [
      { id: `${id}-session-1`, seasonId, date: '2026-09-09', label: 'Week 1', status: 'Completed' },
      { id: `${id}-session-2`, seasonId, date: '2026-09-16', label: 'Week 2', status: 'Completed' },
      { id: `${id}-session-3`, seasonId, date: '2026-09-23', label: 'Week 3', status: 'Upcoming' }
    ],
    scorecards: [
      { id: `${id}-score-1`, membershipId: `${id}-m-1`, sessionId: `${id}-session-1`, scores: [172, 188, 195], sourceRef: `${id.toUpperCase()}-W1-001`, status: 'Published', importedAt: '2026-09-10T18:05:00Z', reviewedAt: '2026-09-10T18:12:00Z', reviewedBy: 'League Admin' },
      { id: `${id}-score-2`, membershipId: `${id}-m-1`, sessionId: `${id}-session-2`, scores: [201, 190, 204], sourceRef: `${id.toUpperCase()}-W2-002`, status: 'Published', importedAt: '2026-09-17T18:05:00Z', reviewedAt: '2026-09-17T18:12:00Z', reviewedBy: 'League Admin' },
      { id: `${id}-score-3`, membershipId: `${id}-m-1`, sessionId: `${id}-session-3`, scores: [0, 0, 0], sourceRef: `${id.toUpperCase()}-W3-PENDING`, status: 'Pending review', importedAt: '2026-09-23T17:50:00Z' }
    ],
    lineups: [],
    rules: { gamesRequiredForEvent: 6, handicapBase: 200, handicapPercent: 90 },
    audit: [{ id: `${id}-audit-1`, at: '2026-09-17T18:12:00Z', action: 'Scorecard published', detail: `${captainName} — Week 2`, actor: 'League Admin' }]
  };
}

function seed() {
  return {
    version: 2,
    selectedTenantId: 'sv',
    selectedCenterId: 'sv-center-1',
    selectedLeagueId: 'sv-league-1',
    selectedSeasonId: 'sv-season-1',
    currentRole: 'bowler',
    currentPage: 'dashboard',
    tenants: {
      sv: seedTenant('sv', 'Super Vegas Bowling', ['Sunset Lanes', 'The Gold Pin'], 'Desert Classic League', 'Thunder Lane', 'Maya Reed', '#55e6db'),
      demo: seedTenant('demo', 'Demo Bowling Group', ['North Star Bowl', 'River City Lanes'], 'Friday Night League', 'Strike Force', 'Jordan Ellis', '#ffca55')
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      localStorage.setItem(LEGACY_ARCHIVE_KEY, legacy);
      const next = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }
  } catch (err) { console.warn('Could not load local demo state', err); }
  const next = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

let state = loadState();

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function tenant() { return state.tenants[state.selectedTenantId]; }
function league() { return tenant().leagues.find((x) => x.id === state.selectedLeagueId); }
function season() { return tenant().seasons.find((x) => x.id === state.selectedSeasonId); }
function currentTeam() { return tenant().teams.find((x) => x.seasonId === state.selectedSeasonId); }
function currentMemberships() { return tenant().memberships.filter((x) => x.teamId === currentTeam().id); }
function scorecardsForSeason() { const sessionIds = tenant().sessions.filter((x) => x.seasonId === state.selectedSeasonId).map((x) => x.id); return tenant().scorecards.filter((x) => sessionIds.includes(x.sessionId)); }
function gamesForMembership(membershipId) { return scorecardsForSeason().filter((x) => x.membershipId === membershipId && x.status === 'Published').flatMap((x) => x.scores); }
function membershipById(id) { return tenant().memberships.find((x) => x.id === id); }
function sessionById(id) { return tenant().sessions.find((x) => x.id === id); }
function activeMemberships() { return currentMemberships().filter((x) => x.active); }
function isRole(...allowed) { return allowed.includes(state.currentRole); }

function eventEligibility(membershipId) {
  const games = gamesForMembership(membershipId);
  const needed = tenant().rules.gamesRequiredForEvent;
  return { games: games.length, needed, eligible: games.length >= needed };
}

function calculateStandings() {
  const rows = currentMemberships().filter((m) => m.active).map((m) => {
    const games = gamesForMembership(m.id);
    return { name: m.displayName || `Open slot ${m.position}`, games: games.length, average: avg(games), pinfall: games.reduce((a, b) => a + b, 0) };
  });
  return rows.sort((a, b) => b.pinfall - a.pinfall || b.average - a.average || a.name.localeCompare(b.name));
}

function renderShell() {
  const t = tenant();
  document.documentElement.style.setProperty('--cyan', t.organization.accent);
  document.getElementById('brandName').textContent = t.organization.name;
  document.getElementById('brandSubhead').textContent = 'PROVISIONAL PLATFORM · LOCAL MVP';
  const company = document.getElementById('companySelect');
  company.innerHTML = Object.values(state.tenants).map((x) => `<option value="${x.id}" ${x.id === state.selectedTenantId ? 'selected' : ''}>${x.organization.name}</option>`).join('');
  const center = document.getElementById('centerSelect');
  center.innerHTML = t.centers.map((x) => `<option value="${x.id}" ${x.id === state.selectedCenterId ? 'selected' : ''}>${x.name}</option>`).join('');
  const centerLeague = t.leagues.find((x) => x.centerId === state.selectedCenterId) || t.leagues[0];
  if (centerLeague && state.selectedLeagueId !== centerLeague.id) state.selectedLeagueId = centerLeague.id;
  const leagues = document.getElementById('leagueSelect');
  leagues.innerHTML = t.leagues.filter((x) => x.centerId === state.selectedCenterId).map((x) => `<option value="${x.id}" ${x.id === state.selectedLeagueId ? 'selected' : ''}>${x.name}</option>`).join('');
  const seasons = document.getElementById('seasonSelect');
  seasons.innerHTML = t.seasons.filter((x) => x.leagueId === state.selectedLeagueId).map((x) => `<option value="${x.id}" ${x.id === state.selectedSeasonId ? 'selected' : ''}>${x.name}</option>`).join('');
  const role = document.getElementById('roleSelect');
  role.innerHTML = Object.entries(roles).map(([key, value]) => `<option value="${key}" ${key === state.currentRole ? 'selected' : ''}>${value.label}</option>`).join('');
  document.getElementById('identityCard').innerHTML = `<strong>${roles[state.currentRole].identity}</strong><span>${roles[state.currentRole].scope}</span>`;
  const nav = navItems();
  const buttons = nav.map((x) => `<button class="nav-button ${state.currentPage === x.id ? 'active' : ''}" data-page="${x.id}">${x.label}</button>`).join('');
  document.getElementById('mainNav').innerHTML = buttons;
  document.getElementById('mobileNav').innerHTML = buttons;
}

function navItems() {
  const shared = [{ id: 'dashboard', label: 'Dashboard' }, { id: 'schedule', label: 'Schedule' }, { id: 'standings', label: 'Standings' }, { id: 'scores', label: 'Scores & averages' }, { id: 'events', label: 'Sweeps & events' }];
  if (isRole('captain')) shared.push({ id: 'team', label: 'Team hub' });
  if (isRole('leagueAdmin', 'centerAdmin', 'orgAdmin')) shared.push({ id: 'operations', label: 'Operations' });
  if (isRole('orgAdmin')) shared.push({ id: 'network', label: 'Network' });
  return shared;
}

function pageHeader(eyebrow, title, subhead, action = '') { return `<header class="page-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subhead">${subhead}</p></div>${action}</header>`; }
function card(title, body, extra = '') { return `<section class="card ${extra}"><h2>${title}</h2>${body}</section>`; }
function badge(text, kind = '') { return `<span class="badge ${kind}">${text}</span>`; }
function listRow(title, detail, right = '') { return `<div class="list-row"><div><strong>${title}</strong><span>${detail}</span></div>${right}</div>`; }
function table(headers, rows) { return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`; }

function renderDashboard() {
  const m = activeMemberships()[0];
  const games = gamesForMembership(m.id);
  const next = tenant().sessions.find((x) => x.seasonId === state.selectedSeasonId && x.status === 'Upcoming');
  const center = tenant().centers.find((x) => x.id === league().centerId);
  const eligibility = eventEligibility(m.id);
  const standings = calculateStandings();
  return pageHeader('Bowler view', 'Your league night, in one place', `${season().name} · ${league().name} · ${center.name}`) +
    `<div class="grid metrics"><section class="card metric"><span class="label">Season average</span><div class="value">${avg(games)}</div><div class="detail">${games.length} published games</div></section><section class="card metric"><span class="label">Next league night</span><div class="value">${next ? localDate(next.date) : 'Complete'}</div><div class="detail">${next ? next.label : 'No upcoming session'}</div></section><section class="card metric"><span class="label">Team placement</span><div class="value">#${standings.findIndex((x) => x.name === m.displayName) + 1}</div><div class="detail">${standings.length} active bowlers</div></section><section class="card metric"><span class="label">Sweep eligibility</span><div class="value">${eligibility.eligible ? 'Ready' : `${eligibility.games}/${eligibility.needed}`}</div><div class="detail">${eligibility.eligible ? 'Qualified for event' : 'Published games required'}</div></section></div>` +
    `<div class="grid two-column">${card('Upcoming session', next ? listRow(next.label, `${localDate(next.date)} · ${center.name}`, badge(next.status, 'warn')) : '<div class="empty">Season complete</div>')}${card('Recent scores', games.length ? games.slice(-6).reverse().map((g, index) => listRow(`Game ${games.length - index}`, 'Published score', `<strong>${g}</strong>`)).join('') : '<div class="empty">No published games yet</div>')}</div>`;
}

function renderSchedule() {
  const center = tenant().centers.find((x) => x.id === league().centerId);
  const sessions = tenant().sessions.filter((x) => x.seasonId === state.selectedSeasonId);
  return pageHeader('League calendar', 'Schedule', `${league().name} at ${center.name}`) + card('Season sessions', `<div class="list">${sessions.map((x) => listRow(x.label, `${localDate(x.date)} · ${center.name}`, badge(x.status, x.status === 'Completed' ? 'ok' : 'warn'))).join('')}</div>`);
}

function renderStandings() {
  const rows = calculateStandings();
  return pageHeader('Published results only', 'Standings', `${season().name} · updates when scorecards are published`) + card('Individual pinfall standings', table(['Place', 'Bowler', 'Games', 'Average', 'Pinfall'], rows.map((x, index) => `<tr><td>#${index + 1}</td><td>${x.name}</td><td>${x.games}</td><td>${x.average}</td><td>${fmt(x.pinfall)}</td></tr>`)));
}

function renderScores() {
  const rows = scorecardsForSeason().map((x) => {
    const member = membershipById(x.membershipId);
    const session = sessionById(x.sessionId);
    return `<tr><td>${session.label}</td><td>${member.displayName || `Open slot ${member.position}`}</td><td>${x.scores.join(' / ')}</td><td>${x.sourceRef}</td><td>${badge(x.status, x.status === 'Published' ? 'ok' : x.status === 'Rejected' ? 'bad' : 'warn')}</td></tr>`;
  });
  return pageHeader('Score history', 'Scores & averages', 'Published scorecards count toward standings and event eligibility.') + card('Scorecard ledger', table(['Session', 'Bowler', 'Games', 'Source', 'Status'], rows));
}

function renderEvents() {
  const m = activeMemberships()[0];
  const eligibility = eventEligibility(m.id);
  return pageHeader('League rewards', 'Sweeps & events', 'Eligibility is calculated from published games only.') + `<div class="grid two-column">${card('Current eligibility', `<div class="metric"><span class="label">Published games</span><div class="value">${eligibility.games} / ${eligibility.needed}</div><div class="detail">${eligibility.eligible ? 'Eligible for the next event' : 'Keep bowling to qualify'}</div></div>`)}${card('Rule set', `<div class="list">${listRow('Games required', `${tenant().rules.gamesRequiredForEvent} published games`)}${listRow('Handicap basis', `${tenant().rules.handicapPercent}% of ${tenant().rules.handicapBase}`)}</div>`)}</div>`;
}

function renderTeam() {
  const team = currentTeam();
  const members = currentMemberships().sort((a, b) => a.position - b.position);
  const upcoming = tenant().sessions.find((x) => x.seasonId === state.selectedSeasonId && x.status === 'Upcoming');
  const lineup = tenant().lineups.find((x) => x.sessionId === upcoming?.id && x.teamId === team.id);
  return pageHeader('Captain workflow', 'Team hub', 'Confirm four eligible lineup spots before league night.') + `<div class="grid two-column">${card('Roster', `<div class="list">${members.map((m) => listRow(`Position ${m.position}`, m.active ? m.displayName : 'Open slot', m.active ? badge('Active', 'ok') : badge('Needs player', 'warn'))).join('')}</div>`)}${card('Upcoming lineup', upcoming ? `<div class="callout">${upcoming.label} · ${localDate(upcoming.date)}. ${lineup ? 'Lineup confirmed.' : 'No lineup confirmed yet.'}</div><div class="action-row"><button class="button" data-action="confirm-lineup" ${lineup ? 'disabled' : ''}>${lineup ? 'Confirmed' : 'Confirm lineup'}</button></div>` : '<div class="empty">No upcoming session</div>')}</div>`;
}

function renderOperations() {
  const pending = scorecardsForSeason().filter((x) => x.status === 'Pending review');
  const audit = tenant().audit.slice().reverse();
  const memberOptions = currentMemberships().filter((x) => x.active).map((x) => `<option value="${x.id}">${x.displayName}</option>`).join('');
  const sessionOptions = tenant().sessions.filter((x) => x.seasonId === state.selectedSeasonId).map((x) => `<option value="${x.id}">${x.label} — ${localDate(x.date)}</option>`).join('');
  return pageHeader('League control room', 'Operations', 'Imported scorecards require review before they affect standings.') + `<div class="grid two-column">${card('Manual score import', `<form id="importForm" class="form-grid"><label>Bowler<select name="membershipId" required>${memberOptions}</select></label><label>Session<select name="sessionId" required>${sessionOptions}</select></label><label>Date<input type="date" name="date" required></label><label>Game 1<input type="number" min="0" max="300" name="g1" required></label><label>Game 2<input type="number" min="0" max="300" name="g2" required></label><label>Game 3<input type="number" min="0" max="300" name="g3" required></label><label class="full">Source reference<input name="sourceRef" placeholder="Score sheet / import ID" required></label><div class="full"><button class="button" type="submit">Queue for review</button></div></form>`) }${card('Pending review', pending.length ? `<div class="list">${pending.map((x) => { const m = membershipById(x.membershipId); const s = sessionById(x.sessionId); return `<div class="list-row"><div><strong>${m.displayName} · ${s.label}</strong><span>${x.scores.join(' / ')} · ${x.sourceRef}</span></div><div class="action-row"><button class="button" data-action="publish-score" data-id="${x.id}">Publish</button><button class="button danger" data-action="reject-score" data-id="${x.id}">Reject</button></div></div>`; }).join('')}</div>` : '<div class="empty">Nothing waiting for review</div>')}</div><div class="grid two-column">${card('Rejected-score ledger', `<div class="list">${scorecardsForSeason().filter((x) => x.status === 'Rejected').map((x) => listRow(x.sourceRef, x.rejectionReason, badge('Rejected', 'bad')).join('') || '<div class="empty">No rejected scorecards</div>'}</div>`)}${card('Audit trail', `<div class="timeline">${audit.map((x) => `<div class="timeline-item"><strong>${x.action}</strong><span>${x.detail} · ${x.actor}</span><time>${new Date(x.at).toLocaleString()}</time></div>`).join('')}</div>`)}</div>`;
}

function renderNetwork() {
  const t = tenant();
  return pageHeader('Organization oversight', 'Network', 'Tenant-scoped centers, leagues, seasons, and operating rules.') + `<div class="grid three-column">${card('Centers', t.centers.map((x) => listRow(x.name, 'Center workspace')).join(''))}${card('Leagues', t.leagues.map((x) => listRow(x.name, `${x.sport} · ${t.centers.find((c) => c.id === x.centerId).name}`)).join(''))}${card('Data boundary', '<div class="callout">This browser-local MVP keeps organizations isolated in state. Production needs tenant-scoped server authorization, audit retention, and a relational database.</div>')}</div>`;
}

function render() {
  renderShell();
  const pages = { dashboard: renderDashboard, schedule: renderSchedule, standings: renderStandings, scores: renderScores, events: renderEvents, team: renderTeam, operations: renderOperations, network: renderNetwork };
  if (!navItems().some((x) => x.id === state.currentPage)) state.currentPage = 'dashboard';
  document.getElementById('app').innerHTML = pages[state.currentPage]();
  bindEvents();
}

function log(action, detail) { tenant().audit.push({ id: uid('audit'), at: new Date().toISOString(), action, detail, actor: roles[state.currentRole].label }); }
function toast(message) { const region = document.getElementById('toastRegion'); const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; region.appendChild(node); setTimeout(() => node.remove(), 3800); }

function handleAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'confirm-lineup') {
    const team = currentTeam(); const upcoming = tenant().sessions.find((x) => x.seasonId === state.selectedSeasonId && x.status === 'Upcoming'); const active = activeMemberships();
    if (!upcoming) return toast('No upcoming session available.');
    const positions = new Set(active.map((m) => m.position));
    if (active.length !== 4 || positions.size !== 4 || ![1,2,3,4].every((position) => positions.has(position))) return toast('Four active players in positions 1–4 are required before confirmation.');
    tenant().lineups.push({ id: uid('lineup'), teamId: team.id, sessionId: upcoming.id, confirmedAt: new Date().toISOString(), confirmedBy: roles[state.currentRole].label });
    log('Lineup confirmed', `${team.name} · ${upcoming.label}`); saveState(); render(); toast('Lineup confirmed.');
  }
  if (action === 'publish-score' && isRole('leagueAdmin', 'centerAdmin', 'orgAdmin')) {
    const score = tenant().scorecards.find((x) => x.id === button.dataset.id);
    if (!score || score.status !== 'Pending review') return;
    score.status = 'Published'; score.reviewedAt = new Date().toISOString(); score.reviewedBy = roles[state.currentRole].label; log('Scorecard published', `${membershipById(score.membershipId).displayName} · ${sessionById(score.sessionId).label}`); saveState(); render(); toast('Scorecard published and standings updated.');
  }
  if (action === 'reject-score' && isRole('leagueAdmin', 'centerAdmin', 'orgAdmin')) {
    const score = tenant().scorecards.find((x) => x.id === button.dataset.id); if (!score || score.status !== 'Pending review') return;
    const reason = window.prompt('Reason for rejection (required):'); if (!reason || !reason.trim()) return toast('A rejection reason is required.');
    score.status = 'Rejected'; score.rejectionReason = reason.trim(); score.reviewedAt = new Date().toISOString(); score.reviewedBy = roles[state.currentRole].label; log('Scorecard rejected', `${score.sourceRef} · ${score.rejectionReason}`); saveState(); render(); toast('Scorecard rejected and retained in the ledger.');
  }
}

function bindEvents() {
  document.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => { state.currentPage = button.dataset.page; saveState(); render(); document.getElementById('app').focus(); }));
  document.getElementById('companySelect').onchange = (event) => { state.selectedTenantId = event.target.value; const t = tenant(); state.selectedCenterId = t.centers[0].id; state.selectedLeagueId = t.leagues[0].id; state.selectedSeasonId = t.seasons[0].id; state.currentPage = 'dashboard'; saveState(); render(); };
  document.getElementById('centerSelect').onchange = (event) => { state.selectedCenterId = event.target.value; const nextLeague = tenant().leagues.find((x) => x.centerId === state.selectedCenterId); if (nextLeague) { state.selectedLeagueId = nextLeague.id; state.selectedSeasonId = tenant().seasons.find((x) => x.leagueId === nextLeague.id)?.id; } saveState(); render(); };
  document.getElementById('leagueSelect').onchange = (event) => { state.selectedLeagueId = event.target.value; state.selectedSeasonId = tenant().seasons.find((x) => x.leagueId === state.selectedLeagueId)?.id; saveState(); render(); };
  document.getElementById('seasonSelect').onchange = (event) => { state.selectedSeasonId = event.target.value; saveState(); render(); };
  document.getElementById('roleSelect').onchange = (event) => { state.currentRole = event.target.value; state.currentPage = 'dashboard'; saveState(); render(); };
  document.getElementById('resetDemo').onclick = () => { if (window.confirm('Reset all browser-local demo data for this app?')) { state = seed(); saveState(); render(); toast('Demo data reset.'); } };
  document.addEventListener('click', handleAction, { once: true });
  const form = document.getElementById('importForm');
  if (form) form.onsubmit = (event) => {
    event.preventDefault(); if (!isRole('leagueAdmin', 'centerAdmin', 'orgAdmin')) return toast('Only operations roles can import scorecards.');
    const data = new FormData(form); const scores = ['g1', 'g2', 'g3'].map((key) => Number(data.get(key))); const sourceRef = String(data.get('sourceRef')).trim(); const membershipId = data.get('membershipId'); const sessionId = data.get('sessionId'); const date = String(data.get('date'));
    const session = sessionById(sessionId);
    if (!session || date !== session.date) return toast('The scorecard date must match the selected session.');
    if (scores.some((score) => !Number.isInteger(score) || score < 0 || score > 300)) return toast('Each game must be a whole number from 0 to 300.');
    if (!sourceRef) return toast('A source reference is required.');
    if (tenant().scorecards.some((x) => x.sourceRef === sourceRef)) return toast('That source reference has already been imported.');
    if (tenant().scorecards.some((x) => x.membershipId === membershipId && x.sessionId === sessionId)) return toast('This bowler already has a scorecard for that session.');
    tenant().scorecards.push({ id: uid('score'), membershipId, sessionId, scores, sourceRef, status: 'Pending review', importedAt: new Date().toISOString() }); log('Scorecard queued', `${membershipById(membershipId).displayName} · ${session.label} · ${sourceRef}`); saveState(); render(); toast('Scorecard queued for review.');
  };
}

render();
