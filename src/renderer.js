import { marked } from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';
if (typeof window !== 'undefined') { window.katex = katex; }

// ---- DOM references ----
const $ = (id) => document.getElementById(id);
const contentEl = $('content');
const welcomeEl = $('welcome');
const tocEl = $('toc');
const sidebarEl = $('sidebar');
const titleText = $('titleText');
const readingProgress = $('readingProgress');
const readingProgressBar = readingProgress.querySelector('.reading-progress-bar');
const statusbar = $('statusbar');
const statusFile = $('statusFile');
const statusWords = $('statusWords');
const statusReading = $('statusReading');
const statusLineCol = $('statusLineCol');
const tocCount = $('tocCount');
const tocFilter = $('tocFilter');
const sidebarFooter = $('sidebarFooter');

const state = {
  filePath: null,
  fileName: null,
  theme: 'light',
  tocOpen: true,
  zoom: 1,
  headings: [],
  wordCount: 0,
  readingTime: 0,
  // simple history for back/forward
  history: [],
  historyIndex: -1
};

// ---- helpers ----
function slugify(text) {
  return String(text).trim().toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'section';
}

// Configure marked: GitHub-flavored, no auto line breaks inside paragraphs.
marked.setOptions({ gfm: true, breaks: false });

// ---- theme ----
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  window.api.setTitleBarOverlay(theme);
  const sun = document.querySelector('#btnTheme .icon-sun');
  // toggle overlay symbol handled via CSS; keep icon as-is
  if (window.mermaid) {
    try { window.mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: theme === 'dark' ? 'dark' : 'neutral' }); } catch (e) {}
  }
}
function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  window.api.saveSettings({ theme: state.theme });
}

// ---- markdown rendering pipeline ----
function renderMarkdown(md) {
  let html;
  try { html = marked.parse(md); } catch (e) { html = '<p>渲染失败: ' + escapeHtml(String(e)) + '</p>'; }
  contentEl.innerHTML = html;

  // resolve relative image/link src against the file directory
  const base = state.filePath ? pathDir(state.filePath) : null;
  if (base) {
    contentEl.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && !/^(https?:|data:|blob:|file:|#)/i.test(src)) {
        img.setAttribute('src', 'file:///' + joinPath(base, src).replace(/\\/g, '/'));
      }
    });
    contentEl.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && !/^(https?:|data:|blob:|mailto:|tel:|#|file:)/i.test(href)) {
        a.setAttribute('href', 'file:///' + joinPath(base, href).replace(/\\/g, '/'));
        a.setAttribute('data-local', '1');
      }
    });
  }

  // headings: assign ids + anchor links, collect for TOC
  state.headings = [];
  const slugCounts = {};
  contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    let id = h.id || slugify(h.textContent);
    if (slugCounts[id]) { id = id + '-' + (++slugCounts[id]); } else { slugCounts[id] = 0; }
    h.id = id;
    h.classList.add('heading');
    const anchor = document.createElement('a');
    anchor.className = 'anchor-link';
    anchor.href = '#' + id;
    anchor.textContent = '#';
    anchor.title = '链接到此标题';
    h.insertBefore(anchor, h.firstChild);
    state.headings.push({ id, level: Number(h.tagName.substring(1)), text: h.textContent.replace(/^#/, '').trim() });
  });

  // code blocks: highlight + label + copy; mermaid handling
  contentEl.querySelectorAll('pre > code').forEach((code) => {
    const lang = detectLang(code);
    if (lang === 'mermaid') {
      const pre = code.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      pre.replaceWith(div);
      return;
    }
    try { if (lang && hljs.getLanguage(lang)) { code.removeAttribute('class'); code.classList.add('hljs'); hljs.highlightElement(code); } else { hljs.highlightElement(code); } } catch (e) {}
    const pre = code.parentElement;
    if (lang) { const lbl = document.createElement('span'); lbl.className = 'code-lang'; lbl.textContent = lang; pre.appendChild(lbl); }
    const btn = document.createElement('button'); btn.className = 'copy-btn'; btn.textContent = '复制';
    btn.addEventListener('click', () => { navigator.clipboard.writeText(code.textContent); btn.textContent = '已复制'; setTimeout(() => btn.textContent = '复制', 1200); });
    pre.appendChild(btn);
  });

  // math (KaTeX)
  try { renderMathInElement(contentEl, { delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false }
  ], throwOnError: false }); } catch (e) {}

  // mermaid
  if (window.mermaid) { try { window.mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') }); } catch (e) {} }

  // intercept link clicks
  contentEl.querySelectorAll('a').forEach((a) => a.addEventListener('click', onLinkClick));

  buildTOC();
  contentEl.classList.add('show');
  welcomeEl.classList.add('hide');
  observeHeadings();
  updateStats(md);
  updateStatusBar();
  updateReadingProgress();
}

function updateStats(md) {
  const text = md.replace(/[#*>`~\-\[\]()!_]/g, ' ').trim();
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  const words = (text.match(/\b[a-zA-Z0-9]+\b/g) || []).length;
  state.wordCount = cjk + words;
  state.readingTime = Math.max(1, Math.ceil(cjk / 400 + words / 200));
}

function updateStatusBar() {
  if (!state.fileName) { statusbar.style.display = ''; return; }
  statusFile.innerHTML = '';
  statusFile.textContent = state.fileName;
  statusFile.title = state.filePath || '';
  statusWords.textContent = state.wordCount.toLocaleString() + ' 字';
  statusReading.textContent = '约 ' + state.readingTime + ' 分钟';
  sidebarFooter.textContent = state.filePath || '';
}

function updateReadingProgress() {
  if (!state.fileName) { readingProgressBar.classList.remove('active'); return; }
  const wrap = contentEl.closest('.content-wrap');
  const max = wrap.scrollHeight - wrap.clientHeight;
  const pct = max > 0 ? (wrap.scrollTop / max) * 100 : 0;
  readingProgressBar.style.width = pct + '%';
  readingProgressBar.classList.add('active');
}

function detectLang(code) {
  const cls = code.className || '';
  const m = cls.match(/language-([\w-]+)/);
  return m ? m[1].toLowerCase() : '';
}
function onLinkClick(e) {
  const a = e.currentTarget;
  const href = a.getAttribute('href') || '';
  if (href.startsWith('#')) { e.preventDefault(); scrollToHeading(href.slice(1)); return; }
  if (a.getAttribute('data-local') === '1') {
    e.preventDefault();
    const p = a.getAttribute('href').replace(/^file:\/\/\//, '');
    if (/\.(md|markdown|mdown|mkd)$/i.test(p)) { window.api.openRecent(p); }
    else { window.api.revealFile(p); }
    return;
  }
  if (/^https?:/i.test(href)) { e.preventDefault(); openExternal(href); }
}
function openExternal(url) {
  window.api.openExternal(url);
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
function pathDir(p) { const i = Math.max(p.lastIndexOf('/'), p.lastIndexOf('\\')); return i >= 0 ? p.substring(0, i) : ''; }
function joinPath(dir, rel) { if (!dir) return rel; if (/^[A-Za-z]:/.test(rel) || rel.startsWith('/')) return rel; return dir.replace(/[\\/]+$/, '') + '\\' + rel.replace(/^[\\/]+/, ''); }

// ---- table of contents ----
function buildTOC() {
  tocEl.innerHTML = '';
  if (!state.headings.length) {
    tocEl.innerHTML = '<div class="toc-empty">该文档没有标题</div>';
    return;
  }
  state.headings.forEach((h) => {
    const a = document.createElement('a');
    a.className = 'toc-item';
    a.href = '#' + h.id;
    a.textContent = h.text;
    a.style.paddingLeft = (8 + (h.level - 1) * 14) + 'px';
    a.title = h.text;
    a.classList.add('toc-level-' + h.level);
    a.addEventListener('click', (e) => { e.preventDefault(); scrollToHeading(h.id); });
    tocEl.appendChild(a);
  });
  tocCount.textContent = state.headings.length;
}

function scrollToHeading(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const wrap = contentEl.closest('.content-wrap');
  const top = el.getBoundingClientRect().top - wrap.getBoundingClientRect().top + wrap.scrollTop - 12;
  wrap.scrollTo({ top, behavior: 'smooth' });
}

let scrollObserver = null;
function observeHeadings() {
  if (scrollObserver) scrollObserver.disconnect();
  const wrap = contentEl.closest('.content-wrap');
  const items = tocEl.querySelectorAll('.toc-item');
  const visible = new Map();
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) visible.set(en.target.id, en.intersectionRatio); else visible.delete(en.target.id); });
    let bestId = null, bestR = 0;
    visible.forEach((r, id) => { if (r > bestR) { bestR = r; bestId = id; } });
    if (!bestId && state.headings.length) bestId = state.headings[0].id;
    items.forEach((it) => it.classList.toggle('active', it.getAttribute('href') === '#' + bestId));
  }, { root: wrap, rootMargin: '0px 0px -70% 0px', threshold: [0, 0.1, 0.5, 1] });
  contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => scrollObserver.observe(h));
}

// ---- find in page ----
const findbar = $('findbar');
const findInput = $('findInput');
const findCount = $('findCount');
let findMarks = [];
let findIndex = -1;

function openFind() { findbar.classList.add('show'); findInput.focus(); findInput.select(); }
function closeFind() { findbar.classList.remove('show'); clearFindMarks(); }
function clearFindMarks() {
  contentEl.querySelectorAll('mark.find-mark').forEach((m) => {
    const parent = m.parentNode; parent.replaceChild(document.createTextNode(m.textContent), m); parent.normalize();
  });
  findMarks = []; findIndex = -1; findCount.textContent = '';
}
function doFind(query) {
  clearFindMarks();
  if (!query) return;
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentNode && (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE' || node.parentNode.classList.contains('mermaid'))) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach((node) => {
    const text = node.nodeValue; re.lastIndex = 0; let m; const frag = document.createDocumentFragment(); let last = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const mark = document.createElement('mark'); mark.className = 'find-mark'; mark.textContent = m[0]; frag.appendChild(mark); findMarks.push(mark);
      last = m.index + m[0].length; if (m[0].length === 0) re.lastIndex++;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    if (frag.childNodes.length) node.parentNode.replaceChild(frag, node);
  });
  findIndex = findMarks.length ? 0 : -1; updateFindCurrent();
}
function updateFindCurrent() {
  findMarks.forEach((m, i) => m.classList.toggle('current', i === findIndex));
  findCount.textContent = findMarks.length ? (findIndex + 1) + '/' + findMarks.length : '0/0';
  if (findMarks[findIndex]) findMarks[findIndex].scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function findNext() { if (!findMarks.length) return; findIndex = (findIndex + 1) % findMarks.length; updateFindCurrent(); }
function findPrev() { if (!findMarks.length) return; findIndex = (findIndex - 1 + findMarks.length) % findMarks.length; updateFindCurrent(); }

// ---- zoom ----
function setZoomDisplay() { $('btnZoomReset').textContent = Math.round(state.zoom * 100) + '%'; }
function applyZoom(f) { state.zoom = Math.min(3, Math.max(0.5, f)); document.body.style.zoom = state.zoom; setZoomDisplay(); window.api.saveSettings({ zoom: state.zoom }); }

// ---- sidebar ----
function setToc(open) {
  state.tocOpen = open;
  sidebarEl.classList.toggle('collapsed', !open);
  $('btnToc').setAttribute('aria-pressed', String(open));
  window.api.saveSettings({ toc: open });
}

// ---- reading progress + scroll ----
contentEl.closest('.content-wrap').addEventListener('scroll', () => {
  updateReadingProgress();
}, { passive: true });

// ---- TOC filter ----
tocFilter.addEventListener('input', () => {
  const q = tocFilter.value.trim().toLowerCase();
  tocEl.querySelectorAll('.toc-item').forEach((item) => {
    const match = !q || item.textContent.toLowerCase().includes(q);
    item.classList.toggle('hidden', !match);
  });
});

// ---- resizer ----
(function initResizer() {
  const resizer = $('resizer'); let startX = 0, startW = 0;
  resizer.addEventListener('mousedown', (e) => {
    startX = e.clientX; startW = sidebarEl.offsetWidth;
    const onMove = (ev) => { let w = startW + (ev.clientX - startX); w = Math.max(180, Math.min(460, w)); sidebarEl.style.flexBasis = w + 'px'; sidebarEl.style.width = w + 'px'; };
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  });
})();

// ---- drag & drop ----
let dropOverlay = null;
function ensureDropOverlay() {
  if (!dropOverlay) { dropOverlay = document.createElement('div'); dropOverlay.className = 'drop-overlay'; dropOverlay.innerHTML = '<span>松开以打开文件</span>'; document.body.appendChild(dropOverlay); }
  return dropOverlay;
}
['dragenter', 'dragover'].forEach((ev) => window.addEventListener(ev, (e) => { e.preventDefault(); if (e.dataTransfer && e.dataTransfer.types.includes('Files')) ensureDropOverlay().classList.add('show'); }));
['dragleave', 'drop'].forEach((ev) => window.addEventListener(ev, (e) => { e.preventDefault(); if (ev === 'dragleave' && e.relatedTarget) return; if (dropOverlay) dropOverlay.classList.remove('show'); }));
window.addEventListener('drop', (e) => {
  e.preventDefault(); const files = e.dataTransfer ? Array.from(e.dataTransfer.files) : [];
  const md = files.find((f) => /\.(md|markdown|mdown|mkd|txt)$/i.test(f.name));
  if (md && md.path) window.api.openRecent(md.path);
});

// ---- file loading ----
function loadFile(data) {
  state.filePath = data.path; state.fileName = data.name;
  window.api.setCurrentPath(data.path);
  titleText.textContent = data.name + ' — MarkdownReader';
  renderMarkdown(data.content);
  document.querySelector('.content-wrap').scrollTop = 0;
}

// ---- recent files dropdown ----
const recentDropdown = $('recentDropdown');
async function toggleRecent() {
  if (recentDropdown.classList.contains('show')) { recentDropdown.classList.remove('show'); return; }
  const recent = await window.api.getRecent();
  recentDropdown.innerHTML = '';
  if (!recent.length) { recentDropdown.innerHTML = '<div class="dropdown-empty">暂无最近文件</div>'; }
  else {
    recent.forEach((p) => {
      const item = document.createElement('div'); item.className = 'dropdown-item';
      const name = p.split(/[\\/]/).pop();
      item.innerHTML = '<span class="di-name">' + escapeHtml(name) + '</span><span class="di-path">' + escapeHtml(p) + '</span>';
      item.addEventListener('click', () => { recentDropdown.classList.remove('show'); window.api.openRecent(p); });
      recentDropdown.appendChild(item);
    });
  }
  const btn = $('btnRecent'); const r = btn.getBoundingClientRect();
  recentDropdown.style.top = (r.bottom + 4) + 'px';
  recentDropdown.style.left = (r.left) + 'px';
  recentDropdown.classList.add('show');
}
document.addEventListener('click', (e) => { if (!recentDropdown.contains(e.target) && e.target !== $('btnRecent') && !$('btnRecent').contains(e.target)) recentDropdown.classList.remove('show'); });

// ---- bind toolbar buttons ----
$('btnOpen').addEventListener('click', () => window.api.openFileDialog());
$('welcomeOpen').addEventListener('click', () => window.api.openFileDialog());
$('btnRecent').addEventListener('click', (e) => { e.stopPropagation(); toggleRecent(); });
$('btnToc').addEventListener('click', () => setToc(!state.tocOpen));
$('btnFind').addEventListener('click', openFind);
$('findClose').addEventListener('click', closeFind);
$('findNext').addEventListener('click', findNext);
$('findPrev').addEventListener('click', findPrev);
$('findInput').addEventListener('input', () => doFind(findInput.value));
$('findInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? findPrev() : findNext(); } if (e.key === 'Escape') closeFind(); });
$('btnZoomIn').addEventListener('click', () => applyZoom(state.zoom * 1.1));
$('btnZoomOut').addEventListener('click', () => applyZoom(state.zoom / 1.1));
$('btnZoomReset').addEventListener('click', () => applyZoom(1));
$('btnTheme').addEventListener('click', toggleTheme);
$('btnExport').addEventListener('click', () => window.api.exportPdf());
$('btnPrint').addEventListener('click', () => window.api.print());
$('btnBack').addEventListener('click', () => history.back());
$('btnForward').addEventListener('click', () => history.forward());

// keyboard shortcuts
window.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'f') { e.preventDefault(); openFind(); }
  else if (mod && e.key === 'o') { /* handled by menu */ }
  else if (e.key === 'Escape' && findbar.classList.contains('show')) { closeFind(); }
});

// ---- IPC from main ----
window.api.onFileOpened((data) => loadFile(data));
window.api.onFileChanged((data) => { if (data.path === state.filePath) { contentEl.scrollTop; renderMarkdown(data.content); } });
window.api.onApplySettings((s) => {
  if (s.theme) applyTheme(s.theme);
  if (typeof s.toc === 'boolean') setToc(s.toc);
  if (typeof s.zoom === 'number') applyZoom(s.zoom);
});
window.api.onToggleTheme(() => toggleTheme());
window.api.onToggleToc((v) => setToc(v));
window.api.onToggleFind(() => openFind());

// ---- init: request settings ----
(async function init() {
  const s = await window.api.getSettings();
  if (s.theme) applyTheme(s.theme); else applyTheme('light');
  if (typeof s.toc === 'boolean') setToc(s.toc); else setToc(true);
  if (typeof s.zoom === 'number') applyZoom(s.zoom); else applyZoom(1);
  if (s.version) $('statusVer').textContent = 'v' + s.version;
  setZoomDisplay();
})();
