/**
 * Standalone Creator Feedback Studio Dashboard Logic (`creator.html`)
 */
import { messageService } from './messages.js';
import { audio } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
  let cachedThreads = [];
  let studioFilter = 'open'; // 'open' | 'resolved'
  let studioSelectedThreadId = null;

  const metricOpenCnt = document.getElementById('metric-open-cnt');
  const metricResCnt = document.getElementById('metric-res-cnt');

  const tabFilterOpen = document.getElementById('tab-filter-open');
  const tabFilterRes = document.getElementById('tab-filter-res');
  const studioThreadList = document.getElementById('studio-thread-list');

  const studioEmptyState = document.getElementById('studio-empty-state');
  const studioActiveState = document.getElementById('studio-active-state');

  const studioChatLevel = document.getElementById('studio-chat-level');
  const studioChatTitle = document.getElementById('studio-chat-title');
  const studioChatAuthor = document.getElementById('studio-chat-author');
  const btnStudioJump = document.getElementById('btn-studio-jump');
  const btnStudioToggleRes = document.getElementById('btn-studio-toggle-res');
  const studioMessagesContainer = document.getElementById('studio-messages-container');

  const studioInputText = document.getElementById('studio-input-text');
  const btnStudioSend = document.getElementById('btn-studio-send');
  const cannedButtons = document.querySelectorAll('.canned-btn');

  const btnStudioCloud = document.getElementById('btn-studio-cloud');
  const cloudSettingsOverlay = document.getElementById('cloud-settings-overlay');
  const btnCancelCloud = document.getElementById('btn-cancel-cloud');
  const btnSaveCloud = document.getElementById('btn-save-cloud');
  const inputSupabaseUrl = document.getElementById('input-supabase-url');
  const inputSupabaseKey = document.getElementById('input-supabase-key');

  // Initialize Dashboard
  async function initDashboard() {
    cachedThreads = await messageService.fetchThreads();
    updateStudioMetrics();

    // Auto-select first thread matching filter
    const matching = cachedThreads.filter(t => t.status === studioFilter);
    if (matching.length > 0) {
      studioSelectedThreadId = matching[0].id;
    }

    renderStudioSidebar();
    renderStudioMain();
  }

  function updateStudioMetrics() {
    const openCount = cachedThreads.filter(t => t.status === 'open').length;
    const resCount = cachedThreads.filter(t => t.status === 'resolved').length;
    metricOpenCnt.textContent = openCount;
    metricResCnt.textContent = resCount;
  }

  function renderStudioSidebar() {
    studioThreadList.innerHTML = '';
    const matching = cachedThreads.filter(t => t.status === studioFilter);
    
    if (matching.length === 0) {
      studioThreadList.innerHTML = `<div style="padding: 2rem 1rem; color: #7b8578; text-align: center; font-style: italic;">No ${studioFilter} conversations found</div>`;
      return;
    }

    matching.forEach(t => {
      const el = document.createElement('div');
      el.className = `thread-item ${t.id === studioSelectedThreadId ? 'active' : ''} ${t.status === 'resolved' ? 'resolved' : ''}`;
      const dateStr = new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const lastMsg = t.messages[t.messages.length - 1];
      const isUnread = t.status === 'open' && lastMsg?.senderRole === 'player';

      el.innerHTML = `
        <div class="thread-top">
          <span class="level-tag">${t.levelName}</span>
          <span class="thread-time">${dateStr}</span>
        </div>
        <div class="thread-title" title="${t.title}">${t.title}</div>
        <div class="thread-bottom">
          <span class="thread-author"><i class="fa-solid fa-user"></i> ${t.playerName}</span>
          ${isUnread ? '<div class="unread-dot"></div>' : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        studioSelectedThreadId = t.id;
        renderStudioSidebar();
        renderStudioMain();
      });

      studioThreadList.appendChild(el);
    });
  }

  function renderStudioMain() {
    studioEmptyState.classList.add('hidden');
    studioActiveState.classList.add('hidden');

    if (!studioSelectedThreadId) {
      studioEmptyState.classList.remove('hidden');
      return;
    }

    const thread = cachedThreads.find(t => t.id === studioSelectedThreadId);
    if (!thread) {
      studioEmptyState.classList.remove('hidden');
      return;
    }

    studioActiveState.classList.remove('hidden');
    studioChatLevel.textContent = thread.levelName;
    studioChatTitle.textContent = thread.title;
    studioChatAuthor.textContent = `Started by ${thread.playerName} • ${new Date(thread.createdAt).toLocaleDateString()}`;

    if (thread.status === 'resolved') {
      btnStudioToggleRes.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Reopen Thread';
      btnStudioToggleRes.className = 'secondary-btn';
    } else {
      btnStudioToggleRes.innerHTML = '<i class="fa-solid fa-check"></i> Mark Resolved';
      btnStudioToggleRes.className = 'primary-btn';
    }

    const wasAtBottom = studioMessagesContainer.scrollHeight - studioMessagesContainer.scrollTop <= studioMessagesContainer.clientHeight + 80;

    studioMessagesContainer.innerHTML = '';
    thread.messages.forEach(msg => {
      const b = document.createElement('div'); b.className = `chat-bubble ${msg.senderRole}`;
      const senderName = msg.senderRole === 'creator' ? 'You (Creator)' : thread.playerName;
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      b.innerHTML = `
        <div class="bubble-meta">
          <span class="bubble-sender">${senderName}</span>
          <span class="bubble-time">${timeStr}</span>
        </div>
        <div class="bubble-text">${msg.text}</div>
      `;
      studioMessagesContainer.appendChild(b);
    });

    setTimeout(() => {
      if (wasAtBottom || studioMessagesContainer.scrollTop === 0) {
        studioMessagesContainer.scrollTop = studioMessagesContainer.scrollHeight;
      }
    }, 50);
  }

  async function handleStudioReply() {
    const text = studioInputText.value.trim();
    if (!text || !studioSelectedThreadId) return;

    studioInputText.value = '';
    await messageService.addReply(studioSelectedThreadId, 'creator', text);
    cachedThreads = await messageService.fetchThreads();
    renderStudioSidebar();
    renderStudioMain();
  }

  // Event Listeners
  tabFilterOpen.addEventListener('click', () => {
    studioFilter = 'open';
    tabFilterRes.classList.remove('active');
    tabFilterOpen.classList.add('active');
    const matching = cachedThreads.filter(t => t.status === studioFilter);
    studioSelectedThreadId = matching.length > 0 ? matching[0].id : null;
    renderStudioSidebar();
    renderStudioMain();
  });

  tabFilterRes.addEventListener('click', () => {
    studioFilter = 'resolved';
    tabFilterOpen.classList.remove('active');
    tabFilterRes.classList.add('active');
    const matching = cachedThreads.filter(t => t.status === studioFilter);
    studioSelectedThreadId = matching.length > 0 ? matching[0].id : null;
    renderStudioSidebar();
    renderStudioMain();
  });

  btnStudioSend.addEventListener('click', handleStudioReply);
  studioInputText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleStudioReply();
  });

  cannedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      studioInputText.value = btn.getAttribute('data-text');
      studioInputText.focus();
    });
  });

  btnStudioToggleRes.addEventListener('click', async () => {
    if (!studioSelectedThreadId) return;
    const thread = cachedThreads.find(t => t.id === studioSelectedThreadId);
    if (!thread) return;

    if (thread.status === 'resolved') {
      // Reopen
      if (messageService.isCloudConfigured()) {
        try {
          const patchUrl = `${messageService.cloudConfig.supabaseUrl}/rest/v1/gm6700_messages?id=eq.${thread.id}`;
          await fetch(patchUrl, {
            method: 'PATCH',
            headers: {
              'apikey': messageService.cloudConfig.supabaseKey,
              'Authorization': `Bearer ${messageService.cloudConfig.supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ status: 'open' })
          });
        } catch(e) { console.warn(e); }
      }
      thread.status = 'open';
      messageService.saveLocalThreads(messageService.localThreads);
    } else {
      await messageService.resolveThread(studioSelectedThreadId);
    }

    cachedThreads = await messageService.fetchThreads();
    updateStudioMetrics();
    renderStudioSidebar();
    renderStudioMain();
  });

  btnStudioJump.addEventListener('click', () => {
    if (!studioSelectedThreadId) return;
    const thread = cachedThreads.find(t => t.id === studioSelectedThreadId);
    if (!thread) return;

    const targetId = thread.levelId || thread.levelName;
    window.location.href = `index.html?edit=${encodeURIComponent(targetId)}`;
  });

  btnStudioCloud.addEventListener('click', () => {
    cloudSettingsOverlay.classList.remove('hidden');
    const cfg = messageService.cloudConfig;
    inputSupabaseUrl.value = cfg.supabaseUrl || '';
    inputSupabaseKey.value = cfg.supabaseKey || '';
  });

  btnCancelCloud.addEventListener('click', () => {
    cloudSettingsOverlay.classList.add('hidden');
  });

  btnSaveCloud.addEventListener('click', async () => {
    const url = inputSupabaseUrl.value.trim();
    const key = inputSupabaseKey.value.trim();
    messageService.saveConfig(url, key);
    cloudSettingsOverlay.classList.add('hidden');
    alert('Cloud configuration saved! Synchronizing messages...');
    await initDashboard();
  });

  // Start & Auto-Poll
  initDashboard();

  setInterval(async () => {
    if (!messageService.isCloudConfigured()) return;
    const fresh = await messageService.fetchThreads();
    const currentSummary = JSON.stringify(cachedThreads);
    const freshSummary = JSON.stringify(fresh);
    if (currentSummary !== freshSummary) {
      const prevTotalMessages = cachedThreads.reduce((sum, t) => sum + t.messages.length, 0);
      const newTotalMessages = fresh.reduce((sum, t) => sum + t.messages.length, 0);

      cachedThreads = fresh;
      updateStudioMetrics();

      // If no thread selected or selected thread no longer matches filter, auto-select first matching
      const matching = cachedThreads.filter(t => t.status === studioFilter);
      if ((!studioSelectedThreadId || !matching.some(t => t.id === studioSelectedThreadId)) && matching.length > 0) {
        studioSelectedThreadId = matching[0].id;
      }

      renderStudioSidebar();
      renderStudioMain();

      if (newTotalMessages > prevTotalMessages) {
        audio.playTileSound();
      }
    }
  }, 3000);
});
