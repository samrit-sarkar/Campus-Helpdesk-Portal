type Item = {
  id: number;
  userId: number;
  userName: string;
  categoryId: number;
  categoryName: string;
  itemName: string;
  description: string;
  location: string;
  type: 'LOST' | 'FOUND';
  status: string;
  imagePath: string | null;
  createdAt: string;
};
type Ticket = {
  id: number;
  userId: number;
  userName: string;
  categoryId: number;
  categoryName: string;
  title: string;
  roomNo: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
};
type Category = { id: number; name: string };
type User = { id: number; name: string; email: string; role: string };
type Claim = { itemId: number; itemName: string; note: string; date: string };
type Page = 'home' | 'browse' | 'report' | 'tickets' | 'new-ticket' | 'claims' | 'activity';

const API_BASE_URL = 'http://localhost:8080';
const SESSION_KEY = 'uniassist_user';
const CLAIMS_KEY = 'uniassist_claims';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=80';
const categories: Category[] = [];
let currentUser: User | null = readUser();
let page: Page = 'home';
let authMode: 'login' | 'register' = 'login';
let items: Item[] = [];
let tickets: Ticket[] = [];
let query = '';
let categoryFilter = '';
let typeFilter = '';
let claims = readClaims(currentUser?.id);

function readUser(): User | null {
  try {
    const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as User | null;
    return user && user.id != null ? user : null;
  } catch {
    return null;
  }
}

function readClaims(userId: number | undefined): Claim[] {
  if (userId == null) return [];
  try {
    return JSON.parse(localStorage.getItem(`${CLAIMS_KEY}_${userId}`) || '[]') as Claim[];
  } catch {
    return [];
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
  } catch {
    throw new Error(`Cannot reach the server. Check that the backend is running at ${API_BASE_URL}.`);
  }
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!response.ok) {
    if (typeof data === 'string' && data) throw new Error(data);
    if (data && typeof data === 'object') {
      const body = data as { message?: string; error?: string };
      if (body.message || body.error) throw new Error(body.message || body.error);
    }
    throw new Error(response.status >= 500 ? 'Server error. Please try again later.' : `Request failed (${response.status}).`);
  }
  return data as T;
}

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char] || char));
const dateLabel = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};
const statusLabel = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
const setPage = (next: Page) => {
  page = next;
  query = '';
  categoryFilter = '';
  typeFilter = '';
  renderApp();
};

function toast(root: HTMLElement, message: string, isError = false) {
  const element = root.querySelector<HTMLElement>('#toast');
  if (!element) return;
  element.textContent = `${isError ? '!' : '✓'}　${message}`;
  element.classList.toggle('error', isError);
  element.classList.add('show');
  window.setTimeout(() => element.classList.remove('show'), 3500);
}

function authView() {
  const registering = authMode === 'register';
  return `<main class="auth-page"><section class="auth-card">
    <div class="auth-mark">U</div><p class="eyebrow">CAMPUS HELPdesk</p>
    <h1>${registering ? 'Create your account' : 'Welcome to UniAssist'}</h1>
    <p class="auth-copy">${registering ? 'Register as a student to report campus issues and items.' : 'Sign in to manage your tickets and campus reports.'}</p>
    <div id="auth-error" class="form-error" role="alert"></div>
    <form id="auth-form">
      ${registering ? '<label>Full name<input name="name" required minlength="2" autocomplete="name" placeholder="Your full name"></label>' : ''}
      <label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@university.edu"></label>
      <label>Password<input name="password" type="password" required minlength="${registering ? '6' : '1'}" autocomplete="${registering ? 'new-password' : 'current-password'}" placeholder="${registering ? 'At least 6 characters' : 'Your password'}"></label>
      <button class="submit auth-submit" type="submit">${registering ? 'Create student account' : 'Sign in'}</button>
    </form>
    <p class="auth-switch">${registering ? 'Already registered?' : 'New to UniAssist?'} <button id="auth-toggle" type="button">${registering ? 'Sign in' : 'Create an account'}</button></p>
    <p class="auth-note">Staff or administrator? <a href="http://localhost:5500/admin-portal/login.html">Open the staff portal</a>.</p>
  </section></main>`;
}

function itemCard(item: Item) {
  const status = item.status === 'RESOLVED' ? 'returned' : item.type.toLowerCase();
  const image = item.imagePath || FALLBACK_IMAGE;
  return `<article class="item"><div class="photo" data-detail="${item.id}">
    <img src="${esc(image)}" alt="${esc(item.itemName)}" onerror="this.src='${FALLBACK_IMAGE}'">
    <span class="pill ${status}">${esc(item.type)} · ${esc(statusLabel(item.status))}</span>
    ${item.userId === currentUser?.id ? '<span class="own-tag">YOUR REPORT</span>' : ''}
    <button class="zoom" data-detail="${item.id}" aria-label="View item">↗</button>
  </div><div class="itembody"><div class="meta"><span>${esc(item.categoryName)}</span><span>${dateLabel(item.createdAt)}</span></div>
    <h3>${esc(item.itemName)}</h3><p>⌖ ${esc(item.location)}</p>
    <div class="itemfoot"><span>◉ ${esc(item.userName)}</span><button data-detail="${item.id}">View details →</button></div>
  </div></article>`;
}

function home() {
  const mine = tickets.filter(ticket => ticket.userId === currentUser?.id);
  const openItems = items.filter(item => item.status !== 'RESOLVED');
  const recent = [...mine].sort((a, b) => b.id - a.id).slice(0, 4);
  const stats = [
    ['My tickets', mine.length, 'fa-ticket'],
    ['Pending', mine.filter(ticket => ['PENDING', 'ASSIGNED'].includes(ticket.status)).length, 'fa-clock'],
    ['In progress', mine.filter(ticket => ticket.status === 'IN_PROGRESS').length, 'fa-gears'],
    ['Open item reports', openItems.length, 'fa-magnifying-glass']
  ];
  return `<section class="hero"><div class="herotxt"><label>YOUR CAMPUS, CONNECTED</label>
    <h1>How can we<br><em>help today?</em></h1>
    <p>Report a maintenance issue, track a request, or help a lost item find its way home.</p>
    <div class="actions"><button class="lightbtn" data-page="new-ticket">＋ Create a ticket</button><button class="glassbtn" data-page="browse">Browse Lost &amp; Found</button></div>
    <small>Signed in as ${esc(currentUser?.name)}</small></div>
    <div class="heroimg"><img src="/assets/sapthagiri-campus.jpg" alt="Campus"></div>
  </section><section class="stats">${stats.map(([label, count, icon]) => `<div><small>${label}</small><b>${count}</b><span><i class="fa-solid ${icon}"></i> Live from UniAssist</span></div>`).join('')}</section>
  <div class="sectionhead"><div><label>MAINTENANCE</label><h2>Recent tickets</h2><p>Track the status of your requests.</p></div><button class="plain" data-page="tickets">View my tickets →</button></div>
  ${recent.length ? `<div class="ticket-list">${recent.map(ticketRow).join('')}</div>` : '<div class="empty"><h3>No tickets yet</h3><p>Create a maintenance request and track it here.</p><button data-page="new-ticket">Create a ticket →</button></div>'}
  <section class="banner"><b>✧</b><div><label>LOST &amp; FOUND</label><h3>${items.length} campus reports</h3><p>${openItems.length} reports are still open.</p></div><button data-page="report">＋ Report an item</button></section>`;
}

function ticketRow(ticket: Ticket) {
  return `<article class="ticket-row"><div><small>#${esc(ticket.id)} · ${esc(ticket.categoryName)}</small><h3>${esc(ticket.title || 'Maintenance request')}</h3>
    <p>Room ${esc(ticket.roomNo)} · ${dateLabel(ticket.createdAt)}</p><p>${esc(ticket.description)}</p></div>
    <span class="ticket-status">${esc(statusLabel(ticket.status))}</span></article>`;
}

function ticketPage() {
  const mine = [...tickets].filter(ticket => ticket.userId === currentUser?.id).sort((a, b) => b.id - a.id);
  return `<div class="heading"><div><label>MAINTENANCE</label><h1>My <em>tickets.</em></h1><p>Follow requests you've submitted to the campus helpdesk.</p></div><button data-page="new-ticket">＋ New ticket</button></div>
    ${mine.length ? `<div class="ticket-list">${mine.map(ticketRow).join('')}</div>` : '<div class="empty"><h3>No tickets found</h3><p>Your submitted requests will appear here.</p><button data-page="new-ticket">Create a ticket →</button></div>'}`;
}

function newTicketPage() {
  return `<div class="heading"><div><label>MAINTENANCE</label><h1>Create a <em>ticket.</em></h1><p>Tell us what needs attention and where to find it.</p></div></div>
    <div class="reportlayout"><form id="ticket-form" class="formcard">
      <div class="fields">
        <label class="wide">Title *<input name="title" required minlength="3" maxlength="255" placeholder="e.g. Wi-Fi not working in the library"></label>
        <label>Category *<select name="category" required><option value="">Choose category</option>${categories.map(category => `<option value="${category.id}">${esc(category.name)}</option>`).join('')}</select></label>
        <label>Room / location *<input name="roomNo" required placeholder="e.g. Block B, Room 204"></label>
        <label class="wide">Description *<textarea name="description" rows="5" required minlength="10" maxlength="1000" placeholder="Describe the issue and any useful details"></textarea></label>
      </div>
      <p class="hint">Tickets are submitted with MEDIUM priority. Staff can update priority and status.</p>
      <button class="submit" type="submit">Submit ticket →</button>
    </form><aside class="tips"><h3>What happens next?</h3><p>Your request is saved to the UniAssist helpdesk. You can follow its status from My Tickets.</p></aside></div>`;
}

function browsePage() {
  const filtered = [...items].sort((a, b) => b.id - a.id).filter(item =>
    (!typeFilter || item.type === typeFilter) &&
    (!categoryFilter || String(item.categoryId) === categoryFilter) &&
    `${item.itemName} ${item.categoryName} ${item.location} ${item.description}`.toLowerCase().includes(query.toLowerCase())
  );
  return `<div class="heading"><div><label>CAMPUS DISCOVERY</label><h1>Browse <em>items.</em></h1><p>Search reports shared by students across campus.</p></div><button data-page="report">＋ Report an item</button></div>
    <div class="filters"><input id="search" type="search" placeholder="Search item, category or location..." value="${esc(query)}">
      <select id="type-filter"><option value="">All types</option><option value="LOST" ${typeFilter === 'LOST' ? 'selected' : ''}>Lost</option><option value="FOUND" ${typeFilter === 'FOUND' ? 'selected' : ''}>Found</option></select>
      <select id="category-filter"><option value="">All categories</option>${categories.map(category => `<option value="${category.id}" ${categoryFilter === String(category.id) ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}</select>
      <button id="reset">Reset</button></div>
    <div class="result">${filtered.length} items <span>matching your search · ${items.length} total reports</span></div>
    ${filtered.length ? `<div class="grid">${filtered.map(itemCard).join('')}</div>` : '<div class="empty"><h3>No matching items</h3><p>Try a different search or report the item you are looking for.</p></div>'}`;
}

function reportPage() {
  return `<div class="heading"><div><label>HELP YOUR COMMUNITY</label><h1>Report an <em>item.</em></h1><p>Share a lost or found item with your campus community.</p></div></div>
    <div class="reportlayout"><form id="report-form" class="formcard">
      <label class="formtitle">What happened?</label>
      <div class="radio"><label><input type="radio" name="type" value="LOST" checked> I lost an item</label><label><input type="radio" name="type" value="FOUND"> I found an item</label></div>
      <div class="fields">
        <label>Item name *<input name="itemName" required minlength="2" maxlength="255" placeholder="e.g. Black wireless headphones"></label>
        <label>Category *<select name="category" required><option value="">Choose category</option>${categories.map(category => `<option value="${category.id}">${esc(category.name)}</option>`).join('')}</select></label>
        <label>Campus location *<input name="location" required maxlength="255" placeholder="e.g. Central Library, Level 2"></label>
        <label>Image URL (optional)<input name="imagePath" type="url" placeholder="https://..."></label>
        <label class="wide">Description *<textarea name="description" rows="4" required minlength="5" maxlength="1000" placeholder="Colour, brand, identifying details..."></textarea></label>
      </div><p class="hint">Reports are shared with other students. Do not include sensitive personal information. Image upload is not supported by the backend; an optional public image URL can be used.</p>
      <button class="submit" type="submit">Submit report →</button>
    </form><aside class="tips"><h3>Help items find their way home</h3><p>Use a precise campus location and enough detail to identify the item. Keep private information out of public reports.</p></aside></div>`;
}

function claimsPage() {
  const mine = claims.filter(claim => claim.itemId > 0);
  return `<div class="heading"><div><label>YOUR REQUESTS</label><h1>My <em>claims.</em></h1><p>Claim details are currently saved only in this browser.</p></div></div>
    <div class="notice">The backend can mark an item as claim requested, but it does not yet provide shared claim review or approval.</div>
    ${mine.length ? mine.map(claim => `<div class="claim"><b>${esc(claim.itemName)}</b><p>#${claim.itemId} · ${dateLabel(claim.date)}</p><span>Claim request submitted</span><small>${esc(claim.note)}</small></div>`).join('') : '<div class="empty"><h3>No claims yet</h3><p>Open a found-item report to submit a claim request.</p><button data-page="browse">Browse items →</button></div>'}`;
}

function activityPage() {
  const activity = [
    ...items.map(item => ({ title: `${item.type === 'LOST' ? 'Lost item' : 'Found item'} reported`, detail: `${item.itemName} · ${item.location}`, date: item.createdAt })),
    ...tickets.filter(ticket => ticket.userId === currentUser?.id).map(ticket => ({ title: 'Maintenance ticket submitted', detail: `${ticket.title} · ${ticket.status}`, date: ticket.createdAt })),
    ...claims.map(claim => ({ title: 'Claim request submitted', detail: claim.itemName, date: claim.date }))
  ].sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="heading"><div><label>THE LATEST FROM YOUR CAMPUS</label><h1>Recent <em>activity.</em></h1><p>Recent maintenance tickets and Lost &amp; Found reports.</p></div></div>
    <div class="timeline">${activity.slice(0, 30).map(event => `<div><i></i><section><b>${esc(event.title)}</b><p>${esc(event.detail)}</p><small>${new Date(event.date).toLocaleString()}</small></section></div>`).join('') || '<p class="empty">No activity yet.</p>'}</div>`;
}

function renderMain(root: HTMLElement) {
  const labels: Record<Page, string> = {
    home: 'Overview', browse: 'Browse items', report: 'Report an item',
    tickets: 'My tickets', 'new-ticket': 'New ticket', claims: 'My claims', activity: 'Activity'
  };
  const nav: Array<[Page, string, string]> = [
    ['home', '▦', 'Overview'], ['new-ticket', '＋', 'New ticket'], ['tickets', '▤', 'My tickets'],
    ['browse', '⌕', 'Browse items'], ['report', '＋', 'Report an item'], ['claims', '◇', 'My claims'], ['activity', '◷', 'Activity']
  ];
  const content = page === 'home' ? home() : page === 'browse' ? browsePage() : page === 'report' ? reportPage() :
    page === 'tickets' ? ticketPage() : page === 'new-ticket' ? newTicketPage() : page === 'claims' ? claimsPage() : activityPage();
  root.innerHTML = `<aside class="sidebar"><div class="brand"><img src="/assets/main-logo.jpg" alt="Sapthagiri NPS University logo">
    <div class="brand-caption"><b>UniAssist</b><small>CAMPUS HELPDESK</small></div></div><label>WORKSPACE</label>
    <nav>${nav.map(([target, icon, label]) => `<button data-page="${target}" class="${page === target ? 'active' : ''}"><i>${icon}</i>${label}</button>`).join('')}</nav>
    <div class="sidebottom"><div class="sidepromo"><b>✧</b><label>YOUR CAMPUS, CONNECTED</label><h3>One place.<br>More support.</h3><p>Requests and reports, together.</p></div><small>UNIASSIST · CAMPUS HELPDESK</small></div></aside>
    <main class="main"><header><span>Workspace　/　<b>${labels[page]}</b></span><div class="user-actions"><span class="user-name">${esc(currentUser?.name)}</span><button id="logout">Sign out</button></div></header>
    <div class="content">${content}<footer>© 2026 UniAssist <span>Campus support, connected.</span></footer></div></main><div id="modal"></div><div id="toast" role="status"></div>`;
  root.querySelectorAll<HTMLElement>('[data-page]').forEach(button => button.addEventListener('click', () => setPage(button.dataset.page as Page)));
  root.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    currentUser = null;
    page = 'home';
    renderApp();
  });
  root.querySelector<HTMLInputElement>('#search')?.addEventListener('input', event => {
    query = (event.target as HTMLInputElement).value;
    const position = (event.target as HTMLInputElement).selectionStart;
    renderMain(root);
    const input = root.querySelector<HTMLInputElement>('#search');
    input?.focus();
    input?.setSelectionRange(position, position);
  });
  root.querySelector<HTMLSelectElement>('#type-filter')?.addEventListener('change', event => {
    typeFilter = (event.target as HTMLSelectElement).value;
    renderMain(root);
  });
  root.querySelector<HTMLSelectElement>('#category-filter')?.addEventListener('change', event => {
    categoryFilter = (event.target as HTMLSelectElement).value;
    renderMain(root);
  });
  root.querySelector('#reset')?.addEventListener('click', () => {
    query = '';
    typeFilter = '';
    categoryFilter = '';
    renderMain(root);
  });
  root.querySelectorAll<HTMLElement>('[data-detail]').forEach(element => element.addEventListener('click', () => showItem(root, Number(element.dataset.detail))));
  root.querySelector<HTMLFormElement>('#report-form')?.addEventListener('submit', event => submitReport(root, event));
  root.querySelector<HTMLFormElement>('#ticket-form')?.addEventListener('submit', event => submitTicket(root, event));
}

function showItem(root: HTMLElement, id: number) {
  const item = items.find(candidate => candidate.id === id);
  const modal = root.querySelector<HTMLElement>('#modal');
  if (!item || !modal) return;
  const isMine = item.userId === currentUser?.id;
  const isOpen = item.status !== 'RESOLVED';
  modal.innerHTML = `<div class="shade"><div class="dialog"><button class="x" id="close" aria-label="Close">×</button>
    <img src="${esc(item.imagePath || FALLBACK_IMAGE)}" alt="${esc(item.itemName)}"><div><label>${esc(item.categoryName)} · ${esc(item.type)} · ${esc(statusLabel(item.status))}${isMine ? ' · YOUR REPORT' : ''}</label>
    <h2>${esc(item.itemName)}</h2><p>⌖ ${esc(item.location)} · ${dateLabel(item.createdAt)}</p><p>${esc(item.description)}</p><small>Reported by ${esc(item.userName)}</small>
    ${item.type === 'FOUND' && isOpen && !isMine ? `<div class="claim-intro"><b>Is this your missing item?</b><p>Submit identifying details. This request is currently stored locally; the backend does not yet provide a shared claim-review workflow.</p><button type="button" id="start-claim">This is mine — request a claim</button></div>
      <form id="claim-form" hidden><label>Your name<input name="claimant" required placeholder="Full name"></label><label>How can you identify it?<textarea name="note" required placeholder="Share a detail only the owner would know"></textarea></label><button>Submit claim request</button></form>` : ''}
    ${item.type === 'LOST' && isMine && isOpen ? '<div class="owner-actions"><p><b>Got your item back?</b> Mark this report resolved.</p><button type="button" id="resolve-item">✓ Mark as resolved</button></div>' : ''}
    ${item.type === 'FOUND' && item.status === 'CLAIM_REQUESTED' ? '<p class="notice">A claim has been requested for this item.</p>' : ''}
    ${item.status === 'RESOLVED' ? '<p class="returned-note">✓ This report is resolved.</p>' : ''}</div></div></div>`;
  modal.querySelector('#close')?.addEventListener('click', () => { modal.innerHTML = ''; });
  modal.querySelector('.shade')?.addEventListener('click', event => { if (event.target === event.currentTarget) modal.innerHTML = ''; });
  modal.querySelector<HTMLButtonElement>('#start-claim')?.addEventListener('click', () => {
    const form = modal.querySelector<HTMLFormElement>('#claim-form');
    if (form) form.hidden = false;
  });
  modal.querySelector<HTMLFormElement>('#claim-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    try {
      await api(`/api/lost-found/${item.id}/status?status=CLAIM_REQUESTED`, { method: 'PATCH' });
      claims.unshift({
        itemId: item.id, itemName: item.itemName,
        note: `Claimed by ${String(data.get('claimant')).trim()}. ${String(data.get('note')).trim()}`,
        date: new Date().toISOString()
      });
      localStorage.setItem(`${CLAIMS_KEY}_${currentUser?.id}`, JSON.stringify(claims));
      modal.innerHTML = '';
      await loadData();
      renderMain(root);
      toast(root, 'Claim request submitted. Claim details are only saved in this browser.');
    } catch (error) {
      toast(root, error instanceof Error ? error.message : 'Could not submit claim.', true);
    }
  });
  modal.querySelector<HTMLButtonElement>('#resolve-item')?.addEventListener('click', async () => {
    if (!confirm('Mark this lost-item report as resolved?')) return;
    try {
      await api(`/api/lost-found/${item.id}/status?status=RESOLVED`, { method: 'PATCH' });
      modal.innerHTML = '';
      await loadData();
      renderMain(root);
      toast(root, 'Your report is marked resolved.');
    } catch (error) {
      toast(root, error instanceof Error ? error.message : 'Could not update report.', true);
    }
  });
}

async function submitReport(root: HTMLElement, event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  if (!form.reportValidity() || !currentUser) return;
  const data = new FormData(form);
  const payload = {
    user: { id: currentUser.id },
    category: { id: Number(data.get('category')) },
    itemName: String(data.get('itemName')).trim(),
    description: String(data.get('description')).trim(),
    location: String(data.get('location')).trim(),
    type: String(data.get('type')),
    imagePath: String(data.get('imagePath') || '').trim() || null
  };
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = 'Submitting…'; }
  try {
    await api<Item>('/api/lost-found', { method: 'POST', body: JSON.stringify(payload) });
    await loadData();
    page = 'browse';
    renderApp();
    toast(root, 'Your report is now visible in Browse Items.');
  } catch (error) {
    toast(root, error instanceof Error ? error.message : 'Could not submit report.', true);
    if (button) { button.disabled = false; button.textContent = 'Submit report →'; }
  }
}

async function submitTicket(root: HTMLElement, event: SubmitEvent) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  if (!form.reportValidity() || !currentUser) return;
  const data = new FormData(form);
  const payload = {
    title: String(data.get('title')).trim(),
    roomNo: String(data.get('roomNo')).trim(),
    description: String(data.get('description')).trim(),
    user: { id: currentUser.id },
    category: { id: Number(data.get('category')) }
  };
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (button) { button.disabled = true; button.textContent = 'Submitting…'; }
  try {
    await api<Ticket>('/api/tickets', { method: 'POST', body: JSON.stringify(payload) });
    await loadData();
    page = 'tickets';
    renderApp();
    toast(root, 'Your ticket was submitted successfully.');
  } catch (error) {
    toast(root, error instanceof Error ? error.message : 'Could not submit ticket.', true);
    if (button) { button.disabled = false; button.textContent = 'Submit ticket →'; }
  }
}

async function loadData() {
  if (!currentUser) return;
  const [itemData, ticketData, categoryData] = await Promise.all([
    api<Item[]>('/api/lost-found'),
    api<Ticket[]>('/api/tickets/user/' + encodeURIComponent(currentUser.id)),
    api<Category[]>('/api/categories')
  ]);
  items = Array.isArray(itemData) ? itemData : [];
  tickets = Array.isArray(ticketData) ? ticketData : [];
  categories.splice(0, categories.length, ...(Array.isArray(categoryData) ? categoryData : []));
}

function bindAuth(root: HTMLElement) {
  root.querySelector<HTMLButtonElement>('#auth-toggle')?.addEventListener('click', () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    renderApp();
  });
  root.querySelector<HTMLFormElement>('#auth-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errorBox = root.querySelector<HTMLElement>('#auth-error');
    if (button) { button.disabled = true; button.textContent = authMode === 'login' ? 'Signing in…' : 'Creating account…'; }
    if (errorBox) { errorBox.textContent = ''; errorBox.style.display = 'none'; }
    try {
      if (authMode === 'register') {
        await api('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: String(data.get('name')).trim(), email, password, role: 'STUDENT' })
        });
        authMode = 'login';
        renderApp();
        const loginEmail = root.querySelector<HTMLInputElement>('[name="email"]');
        if (loginEmail) loginEmail.value = email;
        toast(root, 'Account created. Sign in to continue.');
        return;
      }
      const user = await api<User>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      if (!user || user.id == null) throw new Error('The server did not return a user id.');
      if (String(user.role).toUpperCase() !== 'STUDENT') throw new Error('Please use the staff portal for staff/admin accounts.');
      currentUser = user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      claims = readClaims(user.id);
      await loadData();
      page = 'home';
      renderApp();
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = error instanceof Error ? error.message : 'Could not complete the request.';
        errorBox.style.display = 'block';
      }
      if (button) { button.disabled = false; button.textContent = authMode === 'login' ? 'Sign in' : 'Create student account'; }
    }
  });
}

async function renderApp() {
  const root = document.querySelector<HTMLElement>('#app');
  if (!root) throw new Error('Missing app root');
  if (!currentUser) {
    root.innerHTML = authView();
    bindAuth(root);
    return;
  }
  try {
    await loadData();
  } catch (error) {
    root.innerHTML = `<main class="auth-page"><section class="auth-card"><h1>UniAssist is unavailable</h1><p>${esc(error instanceof Error ? error.message : 'Could not load helpdesk data.')}</p><button id="retry" class="submit">Try again</button><button id="logout-error" class="plain">Sign out</button></section></main>`;
    root.querySelector('#retry')?.addEventListener('click', () => renderApp());
    root.querySelector('#logout-error')?.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_KEY);
      currentUser = null;
      renderApp();
    });
    return;
  }
  renderMain(root);
}

export function startApp() {
  void renderApp();
}
