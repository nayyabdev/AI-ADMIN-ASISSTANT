/* ==========================================================================
   AI ADMIN ASSISTANT - CLIENT APPLICATION LOGIC
   Tab Routing, AI Chat Simulator, Command Palette (Ctrl+K), & Toast System
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initCommandPalette();
  initAIChat();
  initTaskControls();
  initChartTooltips();
  initNotificationsDrawer();
  initSmartSearch();
});

function navigateToTab(tabId) {
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const pageViews = document.querySelectorAll('.page-view');

  navLinks.forEach(l => {
    if (l.getAttribute('data-tab') === tabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  pageViews.forEach(view => {
    if (view.id === `view-${tabId}`) {
      view.classList.add('active-view');
    } else {
      view.classList.remove('active-view');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* --------------------------------------------------------------------------
   UTILITY & SECURITY HELPERS (XSS Escaping & Robust Network Fetch)
   -------------------------------------------------------------------------- */
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}: Request failed`);
    }
    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 8 seconds');
    }
    throw err;
  }
}

/* --------------------------------------------------------------------------
   1. TAB ROUTING & NAVIGATION
   -------------------------------------------------------------------------- */
function initTabNavigation() {
  const navLinks = document.querySelectorAll('.nav-link[data-tab]');
  const pageViews = document.querySelectorAll('.page-view');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');

      // Update Nav Link Active States
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update Active Page View
      pageViews.forEach(view => {
        if (view.id === `view-${targetTab}`) {
          view.classList.add('active-view');
        } else {
          view.classList.remove('active-view');
        }
      });

      // Update Header Title depending on view
      const viewTitle = link.querySelector('span')?.textContent || 'Dashboard';
      showToast('View Switch', `Navigated to ${viewTitle}`, 'info');
    });
  });
}

/* --------------------------------------------------------------------------
   2. COMMAND PALETTE (CTRL + K / CMD + K)
   -------------------------------------------------------------------------- */
function initCommandPalette() {
  const searchTrigger = document.getElementById('search-trigger');
  const modalOverlay = document.getElementById('command-modal-overlay');
  const modalInput = document.getElementById('modal-search-input');
  const commandItems = document.querySelectorAll('.command-item');

  function openModal() {
    modalOverlay.classList.add('active');
    setTimeout(() => modalInput?.focus(), 50);
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
  }

  if (searchTrigger) searchTrigger.addEventListener('click', openModal);

  // Keyboard Shortcuts (Ctrl+K / Cmd+K / Escape)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (modalOverlay.classList.contains('active')) {
        closeModal();
      } else {
        openModal();
      }
    } else if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // Close on Backdrop Click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // Dynamic Filtering in Command Palette
  if (modalInput) {
    modalInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      commandItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(query)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // Click on Command Item
  commandItems.forEach(item => {
    item.addEventListener('click', () => {
      const actionName = item.querySelector('strong')?.textContent || 'Action Executed';
      closeModal();
      showToast('AI Macro Triggered', `Executing: ${actionName}`, 'success');
      
      // If it has a specific action, simulate response in AI chat
      simulateAIResponse(`Execute: ${actionName}`);
    });
  });
}

/* --------------------------------------------------------------------------
   3. AI ASSISTANT CHAT ENGINE
   -------------------------------------------------------------------------- */
function initAIChat() {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const promptChips = document.querySelectorAll('.prompt-chip');

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendChatMessage('user', text);
      chatInput.value = '';
      simulateAIResponse(text);
    });
  }

  // Macro Chip Clicks
  promptChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const promptText = chip.getAttribute('data-prompt') || chip.textContent.trim();
      appendChatMessage('user', promptText);
      simulateAIResponse(promptText);
    });
  });
}

function appendChatMessage(sender, messageText, isHTML = false) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const avatarText = sender === 'user' ? 'YOU' : 'AI';
  const content = isHTML ? messageText : escapeHTML(messageText);

  bubble.innerHTML = `
    <div class="chat-avatar">${avatarText}</div>
    <div class="chat-content">
      ${content}
    </div>
  `;

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function simulateAIResponse(query) {
  const chatMessages = document.getElementById('chat-messages');
  
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble ai typing-indicator-bubble';
  typingBubble.innerHTML = `
    <div class="chat-avatar">AI</div>
    <div class="chat-content" style="color: var(--text-muted); font-style: italic;">
      AI Backend Agent is executing query on server...
    </div>
  `;
  chatMessages.appendChild(typingBubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const data = await fetchWithTimeout('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query, model: 'Gemini 3.6 Pro' })
    });
    typingBubble.remove();

    if (data.success) {
      appendChatMessage('ai', data.response, true);
      showToast('Backend API Response', `Engine: ${data.model} (${data.latency_ms}ms)`, 'success');
    } else {
      appendChatMessage('ai', `Error: ${escapeHTML(data.error || 'Request failed')}`);
      showToast('API Error', data.error || 'Server error', 'error');
    }
  } catch (err) {
    typingBubble.remove();
    appendChatMessage('ai', `Fallback Agent Response for query: "${escapeHTML(query)}"`);
    showToast('Offline Mode', err.message || 'API unreachable', 'warning');
  }
}
    // Fallback if backend offline
    appendChatMessage('ai', `I have processed your query: <code>"${query}"</code> via local fallback agent.`);
    showToast('AI Action Executed', 'Processed offline', 'info');
  }
}

/* --------------------------------------------------------------------------
   4. TASK CONTROLS & DYNAMIC CREATION
   -------------------------------------------------------------------------- */
function initTaskControls() {
  const triggerBtn = document.getElementById('trigger-new-task-btn');
  const taskTableBody = document.getElementById('task-table-body');

  if (triggerBtn && taskTableBody) {
    triggerBtn.addEventListener('click', () => {
      const taskTitles = [
        { title: 'Parse Vendor Contracts & NDAs', category: 'Legal AI', badge: 'badge-indigo', icon: '📄' },
        { title: 'Automate Q3 Tax Filing Draft', category: 'Finance AI', badge: 'badge-cyan', icon: '📊' },
        { title: 'Screen Incoming Exec Candidates', category: 'HR AI', badge: 'badge-emerald', icon: '👤' },
        { title: 'Audit AWS Infrastructure Invoices', category: 'Ops AI', badge: 'badge-amber', icon: '⚡' }
      ];

      const randomTask = taskTitles[Math.floor(Math.random() * taskTitles.length)];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="task-name-cell">
            <div class="task-icon">${randomTask.icon}</div>
            <div class="task-info">
              <strong>${randomTask.title}</strong>
              <span>Triggered just now • Agent #${Math.floor(Math.random()*900 + 100)}</span>
            </div>
          </div>
        </td>
        <td><span class="badge ${randomTask.badge}">${randomTask.category}</span></td>
        <td>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width: 25%;"></div>
          </div>
        </td>
        <td><span class="badge badge-emerald">Running</span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="showToast('Task Action', 'Task paused', 'info')">Pause</button>
        </td>
      `;

      taskTableBody.prepend(row);
      showToast('New Task Enqueued', `Started: ${randomTask.title}`, 'success');

      // Animate progress bar fill over 3 seconds
      const bar = row.querySelector('.progress-bar-fill');
      setTimeout(() => { if (bar) bar.style.width = '100%'; }, 100);
    });
  }
}

/* --------------------------------------------------------------------------
   5. TOAST NOTIFICATION ENGINE
   -------------------------------------------------------------------------- */
function showToast(title, message, type = 'info') {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let borderColor = 'var(--accent-indigo)';
  if (type === 'success') borderColor = 'var(--accent-emerald)';
  if (type === 'warning') borderColor = 'var(--accent-amber)';
  if (type === 'error') borderColor = 'var(--accent-rose)';

  toast.style.borderLeftColor = borderColor;
  toast.innerHTML = `
    <div style="flex: 1;">
      <strong style="display: block; font-size: 0.85rem; color: var(--text-primary);">${title}</strong>
      <span style="font-size: 0.78rem; color: var(--text-secondary);">${message}</span>
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* --------------------------------------------------------------------------
   6. CHART INTERACTION & TOOLTIPS
   -------------------------------------------------------------------------- */
function initChartTooltips() {
  const chartDots = document.querySelectorAll('.chart-dot');
  chartDots.forEach(dot => {
    dot.addEventListener('mouseenter', (e) => {
      const val = dot.getAttribute('data-value') || 'Data Point';
      showToast('Chart Analytics', `Metric: ${val}`, 'info');
    });
  });
}

/* --------------------------------------------------------------------------
   7. TASK CREATION MODAL & KANBAN MANAGEMENT
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCreateTaskModal();
});

function initCreateTaskModal() {
  const openBtn = document.getElementById('open-create-task-modal');
  const modalOverlay = document.getElementById('create-task-modal-overlay');
  const closeBtn = document.getElementById('close-task-modal-btn');
  const cancelBtn = document.getElementById('cancel-task-modal-btn');
  const form = document.getElementById('create-task-form');

  if (!openBtn || !modalOverlay) return;

  function openModal() { modalOverlay.classList.add('active'); }
  function closeModal() { modalOverlay.classList.remove('active'); }

  openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('task-title-input');
      const title = titleInput ? titleInput.value.trim() : '';
      const category = document.getElementById('task-category-select').value;
      const agent = document.getElementById('task-agent-select').value;

      if (!title || title.length < 3) {
        showToast('Validation Error', 'Task title must be at least 3 characters long', 'warning');
        return;
      }

      const cleanTitle = escapeHTML(title);
      const cleanCategory = escapeHTML(category);
      const cleanAgent = escapeHTML(agent.split(' ')[0]);

      try {
        await fetchWithTimeout('/api/tasks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, agent })
        });
      } catch (err) {
        // Fallback
      }

      // Append new card into Kanban Active Running Column
      const activeColContainer = document.querySelectorAll('.kanban-cards-container')[1];
      if (activeColContainer) {
        const card = document.createElement('div');
        card.className = 'kanban-card';
        card.style.borderLeft = '3px solid var(--accent-indigo)';
        card.innerHTML = `
          <span class="badge badge-indigo" style="font-size:0.7rem; margin-bottom:0.4rem;">${cleanCategory}</span>
          <div class="kanban-card-title">${cleanTitle}</div>
          <div class="kanban-card-desc">Just triggered • Autonomous execution in progress.</div>
          <div style="margin: 0.5rem 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.2rem;">
              <span>Progress</span><strong>15%</strong>
            </div>
            <div class="progress-bar-wrap" style="width:100%; height:5px;">
              <div class="progress-bar-fill" style="width: 15%;"></div>
            </div>
          </div>
          <div class="kanban-card-footer">
            <span class="agent-tag">🤖 ${cleanAgent}</span>
            <button class="btn btn-ghost btn-sm" onclick="showToast('Task Action', 'Task paused', 'info')">Pause</button>
          </div>
        `;
        activeColContainer.prepend(card);
      }

      form.reset();
      closeModal();
      showToast('AI Task Dispatched', `Started workflow: "${cleanTitle}"`, 'success');
    });
  }
}

/* --------------------------------------------------------------------------
   8. AUTHENTICATION, PROFILE MENU, & CONSOLE LOCK SCREEN
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initAuthentication();
});

function initAuthentication() {
  const authOverlay = document.getElementById('auth-page-overlay');
  const lockOverlay = document.getElementById('lock-screen-overlay');
  const loginForm = document.getElementById('auth-login-form');
  const ssoGoogleBtn = document.getElementById('sso-google-btn');
  const ssoMsBtn = document.getElementById('sso-microsoft-btn');

  const profileTrigger = document.getElementById('user-profile-trigger');
  const profileMenu = document.getElementById('profile-dropdown-menu');
  const lockBtn = document.getElementById('menu-item-lock');
  const signoutBtn = document.getElementById('menu-item-signout');

  const unlockPinBtn = document.getElementById('unlock-pin-btn');
  const pinInputs = [
    document.getElementById('pin-1'),
    document.getElementById('pin-2'),
    document.getElementById('pin-3'),
    document.getElementById('pin-4')
  ];

  // Helper for Session Check
  function authenticateUser(email = 'nayyar@executive-ai.com') {
    localStorage.setItem('ai_exec_session', JSON.stringify({ email, time: Date.now() }));
    if (authOverlay) authOverlay.classList.remove('active');
    showToast('Executive Authenticated', `Welcome back, ${email}`, 'success');
  }

  // Handle Initial State
  const existingSession = localStorage.getItem('ai_exec_session');
  if (!existingSession && authOverlay) {
    authOverlay.classList.add('active');
  }

  // Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email-input').value;
      authenticateUser(email);
    });
  }

  // SSO Buttons
  if (ssoGoogleBtn) {
    ssoGoogleBtn.addEventListener('click', () => authenticateUser('nayyar@workspace-google.com'));
  }
  if (ssoMsBtn) {
    ssoMsBtn.addEventListener('click', () => authenticateUser('nayyar@microsoft365-exec.com'));
  }

  // Profile Menu Toggle
  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      profileMenu.classList.remove('active');
    });
  }

  // Lock Console Action
  if (lockBtn && lockOverlay) {
    lockBtn.addEventListener('click', () => {
      profileMenu.classList.remove('active');
      lockOverlay.classList.add('active');
      pinInputs[0]?.focus();
      showToast('Security Alert', 'Executive console locked', 'warning');
    });
  }

  // PIN Validation & Auto-Advance
  pinInputs.forEach((input, index) => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });

  // Unlock PIN Action
  if (unlockPinBtn && lockOverlay) {
    unlockPinBtn.addEventListener('click', () => {
      const pinCode = pinInputs.map(i => i?.value || '').join('');
      if (pinCode.length < 4) {
        showToast('Validation Error', 'Please enter a complete 4-digit PIN code', 'warning');
        return;
      }
      lockOverlay.classList.remove('active');
      pinInputs.forEach(i => { if (i) i.value = ''; });
      showToast('Unlocked', 'Session resumed', 'success');
    });
  }

  // Sign Out Action
  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('ai_exec_session');
      profileMenu.classList.remove('active');
      if (authOverlay) authOverlay.classList.add('active');
      showToast('Signed Out', 'Executive session terminated', 'info');
    });
  }
}

/* --------------------------------------------------------------------------
   9. DEDICATED AI CHAT WORKSPACE LOGIC
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initAIChatWorkspace();
});

function initAIChatWorkspace() {
  const chatForm = document.getElementById('workspace-chat-form');
  const chatInput = document.getElementById('workspace-chat-input');
  const chatMessages = document.getElementById('workspace-chat-messages');
  const modelSelector = document.getElementById('chat-model-selector');
  const activeModelDisplay = document.getElementById('active-model-display');
  const newThreadBtn = document.getElementById('new-chat-thread-btn');
  const threadItems = document.querySelectorAll('#chat-threads-list .nav-link');

  const voiceBtn = document.getElementById('voice-input-btn');
  const attachBtn = document.getElementById('attach-file-btn');

  // Model Selection Update
  if (modelSelector && activeModelDisplay) {
    modelSelector.addEventListener('change', (e) => {
      const selectedModel = e.target.value;
      activeModelDisplay.textContent = selectedModel;
      showToast('LLM Switched', `Active model set to ${selectedModel}`, 'info');
    });
  }

  // Thread Switching
  threadItems.forEach(item => {
    item.addEventListener('click', () => {
      threadItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const title = item.querySelector('strong')?.textContent || 'AI Session';
      const threadTitleEl = document.getElementById('chat-thread-title');
      if (threadTitleEl) threadTitleEl.textContent = title;

      showToast('Thread Switch', `Loaded conversation: ${title}`, 'info');
    });
  });

  // New Thread Action
  if (newThreadBtn) {
    newThreadBtn.addEventListener('click', () => {
      if (chatMessages) {
        chatMessages.innerHTML = `
          <div class="chat-bubble ai">
            <div class="chat-avatar">AI</div>
            <div class="chat-content">
              New Executive AI Session initialized. Select an AI model or prompt co-pilot to begin.
            </div>
          </div>
        `;
      }
      showToast('New Session', 'Fresh AI workspace initialized', 'success');
    });
  }

  // Voice Input Simulation
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      showToast('Voice Listening', 'Listening for executive voice command...', 'info');
      setTimeout(() => {
        if (chatInput) {
          chatInput.value = "Summarize today's financial metrics and schedule conflicts.";
          showToast('Speech Recognized', 'Transcribed voice to prompt input.', 'success');
        }
      }, 1500);
    });
  }

  // File Attachment Simulation
  if (attachBtn) {
    attachBtn.addEventListener('click', () => {
      showToast('Document Upload', 'Attached Q3_Executive_Briefing.pdf to context', 'success');
    });
  }

  // Workspace Form Submit
  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      // Append User Bubble
      const userBubble = document.createElement('div');
      userBubble.className = 'chat-bubble user';
      userBubble.innerHTML = `
        <div class="chat-avatar">YOU</div>
        <div class="chat-content">${text}</div>
      `;
      chatMessages.appendChild(userBubble);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Simulate Typing & Response
      const currentModel = modelSelector ? modelSelector.value : 'Gemini 3.6 Pro';
      setTimeout(() => {
        const aiBubble = document.createElement('div');
        aiBubble.className = 'chat-bubble ai';
        aiBubble.innerHTML = `
          <div class="chat-avatar">AI</div>
          <div class="chat-content">
            <strong>Response from ${currentModel}:</strong><br>
            Analyzed executive query: <code>"${text}"</code>.<br><br>
            • Processing completed across 4 background vector indices.<br>
            • Action Recommendation: Automate email digest dispatch to board members.<br><br>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn btn-primary btn-sm" onclick="showToast('Task Created', 'Automated task enqueued', 'success')">Dispatch Task Agent</button>
            </div>
          </div>
        `;
        chatMessages.appendChild(aiBubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        showToast('AI Response Generated', `Output received from ${currentModel}`, 'success');
      }, 1000);
    });
  }
}

/* --------------------------------------------------------------------------
   10. REMINDERS & NOTES WORKSPACE LOGIC
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initRemindersAndNotes();
});

function initRemindersAndNotes() {
  const reminderForm = document.getElementById('quick-reminder-form');
  const reminderInput = document.getElementById('quick-reminder-input');
  const reminderContainer = document.getElementById('reminders-list-container');

  const noteForm = document.getElementById('quick-note-form');
  const noteTitleInput = document.getElementById('quick-note-title');
  const noteContentInput = document.getElementById('quick-note-content');
  const noteTagSelect = document.getElementById('quick-note-tag');
  const noteContainer = document.getElementById('notes-list-container');

  // Create Quick Reminder
  if (reminderForm && reminderContainer) {
    reminderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = reminderInput.value.trim();
      if (!title) {
        showToast('Validation Error', 'Reminder title cannot be empty', 'warning');
        return;
      }

      const cleanTitle = escapeHTML(title);

      try {
        await fetchWithTimeout('/api/reminders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category: 'Executive', time: 'Today' })
        });
      } catch (err) {}

      const item = document.createElement('div');
      item.className = 'activity-item';
      item.style.alignItems = 'center';
      item.innerHTML = `
        <input type="checkbox" style="width:18px; height:18px; cursor:pointer;" onchange="showToast('Reminder Updated', 'Marked as completed', 'success')">
        <div class="activity-details" style="flex:1;">
          <strong>${cleanTitle}</strong>
          <span style="color:var(--accent-cyan);">Due Today • Just Added</span>
        </div>
        <span class="badge badge-cyan">New</span>
      `;
      reminderContainer.prepend(item);
      reminderInput.value = '';
      showToast('Reminder Scheduled', `Scheduled: "${cleanTitle}"`, 'success');
    });
  }

  // Create Quick Smart Note
  if (noteForm && noteContainer) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = noteTitleInput.value.trim();
      const content = noteContentInput.value.trim();
      const tag = noteTagSelect ? noteTagSelect.value : 'Strategy';

      if (!title || !content) {
        showToast('Validation Error', 'Please enter both note title and content', 'warning');
        return;
      }

      const cleanTitle = escapeHTML(title);
      const cleanContent = escapeHTML(content);
      const cleanTag = escapeHTML(tag);

      try {
        await fetchWithTimeout('/api/notes/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, tag })
        });
      } catch (err) {}

      const card = document.createElement('div');
      card.style.background = 'rgba(255,255,255,0.03)';
      card.style.border = '1px solid var(--glass-border)';
      card.style.borderLeft = '3px solid var(--accent-emerald)';
      card.style.padding = '0.85rem';
      card.style.borderRadius = 'var(--radius-md)';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
          <strong style="font-size:0.9rem;">${cleanTitle}</strong>
          <span class="badge badge-emerald">#${cleanTag}</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.4;">${cleanContent}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.65rem; font-size:0.75rem; color:var(--text-muted);">
          <span>Just created</span>
          <button class="btn btn-ghost btn-sm" onclick="showToast('AI Summarizer', 'Extracted key action points', 'success')">✨ Auto-Summarize</button>
        </div>
      `;

      noteContainer.prepend(card);
      noteTitleInput.value = '';
      noteContentInput.value = '';
      showToast('Smart Note Saved', `Created note: "${cleanTitle}"`, 'success');
    });
  }
}

/* --------------------------------------------------------------------------
   11. SMART CALENDAR WORKSPACE LOGIC
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initCalendarWorkspace();
});

function initCalendarWorkspace() {
  const dayCells = document.querySelectorAll('.calendar-day-cell');
  dayCells.forEach(cell => {
    cell.addEventListener('click', () => {
      const num = cell.querySelector('.calendar-day-number')?.textContent.trim().split(' ')[0] || 'Day';
      showToast('Date Selected', `Viewing schedule for September ${num}, 2026`, 'info');
    });
  });
}

/* --------------------------------------------------------------------------
   12. DOCUMENT DROPZONE & AI ANALYSIS LOGIC
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initDocumentDropzone();
});

function initDocumentDropzone() {
  const dropzone = document.getElementById('document-dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileName = files[0].name;
      showToast('OCR Upload Started', `Analyzing "${fileName}"...`, 'success');
    }
  });
}

/* --------------------------------------------------------------------------
   13. EMAIL ASSISTANT & SMART TRIAGE LOGIC
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initEmailAssistant();
});

function initEmailAssistant() {
  const textarea = document.getElementById('email-reply-textarea');
  const approveBtn = document.getElementById('preset-approve-btn');
  const infoBtn = document.getElementById('preset-request-info-btn');
  const declineBtn = document.getElementById('preset-decline-btn');
  const emailItems = document.querySelectorAll('.email-item');

  if (approveBtn && textarea) {
    approveBtn.addEventListener('click', () => {
      textarea.value = `Hi Ops Team,\n\nI have reviewed the Q4 headcount budget proposal and hereby approve the $250,000 reallocation to core AI engineering. Please proceed with candidate offers.\n\nBest regards,\nNayyar Admin`;
      showToast('Preset Loaded', 'Approve proposal preset applied', 'success');
    });
  }

  if (infoBtn && textarea) {
    infoBtn.addEventListener('click', () => {
      textarea.value = `Hi Ops Team,\n\nBefore I issue final sign-off on the $250,000 reallocation, please provide a itemized breakdown of expected ROI and hiring timeline for the Q4 engineering roles.\n\nBest regards,\nNayyar Admin`;
      showToast('Preset Loaded', 'Request breakdown preset applied', 'info');
    });
  }

  if (declineBtn && textarea) {
    declineBtn.addEventListener('click', () => {
      textarea.value = `Hi Ops Team,\n\nDue to Q4 margin targets, I am unable to approve the $250,000 budget reallocation at this time. Let's revisit during our Monday strategy sync.\n\nBest regards,\nNayyar Admin`;
      showToast('Preset Loaded', 'Decline proposal preset applied', 'warning');
    });
  }

  emailItems.forEach(item => {
    item.addEventListener('click', () => {
      emailItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const subject = item.querySelector('.email-item-title')?.textContent || 'Email Thread';
      showToast('Thread Selected', `Loaded email: "${subject}"`, 'info');
    });
  });
}

/* --------------------------------------------------------------------------
   14. EXECUTIVE NOTIFICATION DRAWER LOGIC
   -------------------------------------------------------------------------- */
function initNotificationsDrawer() {
  const notifBtn = document.getElementById('header-notif-btn');
  const drawer = document.getElementById('notifications-drawer-menu');
  const badgeIndicator = document.getElementById('notif-badge-indicator');
  const markReadBtn = drawer?.querySelector('button');

  if (!notifBtn || !drawer) return;

  // Toggle notification drawer
  notifBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    drawer.classList.toggle('active');
  });

  // Close drawer on click outside
  document.addEventListener('click', (e) => {
    if (!drawer.contains(e.target) && !notifBtn.contains(e.target)) {
      drawer.classList.remove('active');
    }
  });

  // Mark all read button action
  if (markReadBtn) {
    markReadBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const dots = drawer.querySelectorAll('.notif-unread-dot');
      dots.forEach(dot => dot.style.display = 'none');

      if (badgeIndicator) badgeIndicator.style.display = 'none';

      try {
        await fetch('/api/notifications/read', { method: 'POST' });
      } catch (err) {}

      showToast('Notifications Clear', 'Marked all notifications as read', 'info');
    });
  }

  // Handle clicking individual notifications
  const notifItems = drawer.querySelectorAll('.notif-item');
  notifItems.forEach(item => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const dot = item.querySelector('.notif-unread-dot');
      if (dot) dot.style.display = 'none';

      const title = item.querySelector('strong')?.textContent || 'Notification';
      const badgeText = item.querySelector('.badge')?.textContent || '';

      drawer.classList.remove('active');

      if (badgeText.includes('Approval') || title.includes('Transfer')) {
        navigateToTab('tasks');
        showToast('Notification Action', `Opened Task Approvals for: "${title}"`, 'success');
      } else if (badgeText.includes('Calendar')) {
        navigateToTab('calendar');
        showToast('Notification Action', `Viewing Calendar Schedule for: "${title}"`, 'info');
      } else if (badgeText.includes('Finance') || badgeText.includes('Receipt')) {
        navigateToTab('documents');
        showToast('Notification Action', `Viewing Audited Documents for: "${title}"`, 'info');
      } else {
        showToast('Notification Opened', title, 'info');
      }

      // Check remaining unread dots
      const unreadRemaining = drawer.querySelectorAll('.notif-unread-dot:not([style*="display: none"])');
      if (unreadRemaining.length === 0 && badgeIndicator) {
        badgeIndicator.style.display = 'none';
      }
    });
  });

  // Simulate periodic incoming live notification after 15s
  setTimeout(() => {
    const notifContainer = drawer.querySelector('div[style*="flex-direction:column"]');
    if (notifContainer) {
      const liveNotif = document.createElement('div');
      liveNotif.className = 'notif-item';
      liveNotif.style.cursor = 'pointer';
      liveNotif.innerHTML = `
        <div class="notif-unread-dot"></div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.15rem;">
            <strong style="color:var(--text-primary);">Autonomous Briefing Ready</strong>
            <span style="font-size:0.7rem; color:var(--text-muted);">Just now</span>
          </div>
          <span style="font-size:0.78rem; color:var(--text-secondary);">AI Agent #402 generated your Board Strategy Briefing memo.</span>
          <span class="badge badge-indigo" style="font-size:0.65rem; margin-top:0.35rem;">AI Co-Pilot</span>
        </div>
      `;
      liveNotif.addEventListener('click', (e) => {
        e.stopPropagation();
        drawer.classList.remove('active');
        navigateToTab('reminders-notes');
        showToast('Live Notification', 'Opened Executive Strategy Note', 'success');
      });
      notifContainer.prepend(liveNotif);

      if (badgeIndicator) badgeIndicator.style.display = 'block';
      showToast('New Live Notification', 'Agent #402 completed Board Briefing memo', 'success');
    }
  }, 15000);
}

/* --------------------------------------------------------------------------
   15. SMART UNIVERSAL VECTOR SEARCH LOGIC
   -------------------------------------------------------------------------- */
function initSmartSearch() {
  const modalInput = document.getElementById('modal-search-input');
  const resultsContainer = document.querySelector('.command-results');
  if (!modalInput || !resultsContainer) return;

  let searchDebounce = null;

  modalInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchDebounce);

    searchDebounce = setTimeout(async () => {
      if (!query) {
        // Restore default macros
        resultsContainer.innerHTML = `
          <div class="command-item" data-tab="email-assistant">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            <div class="command-item-info">
              <strong>Summarize Priority Inbox Emails</strong>
              <span>Generate executive digest of today's priority inbox</span>
            </div>
          </div>
          <div class="command-item" data-tab="documents">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            <div class="command-item-info">
              <strong>Reconcile Expense Receipts</strong>
              <span>Scan pending PDF receipts and match with bank transactions</span>
            </div>
          </div>
          <div class="command-item" data-tab="calendar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <div class="command-item-info">
              <strong>Optimize Calendar Conflicts</strong>
              <span>Auto-reschedule overlapping meetings based on priority</span>
            </div>
          </div>
          <div class="command-item" data-tab="dashboard">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <div class="command-item-info">
              <strong>Generate Weekly Executive Report</strong>
              <span>Compile team KPIs, revenue metrics, and operational blockers</span>
            </div>
          </div>
        `;
        attachCommandItemClickListeners();
        return;
      }

      try {
        const data = await fetchWithTimeout('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });

        if (data.success && data.results.length > 0) {
          resultsContainer.innerHTML = data.results.map(item => `
            <div class="command-item search-result-item" data-tab="${escapeHTML(item.tab)}">
              <div style="font-size:1.2rem; margin-right:0.75rem;">${item.icon || '🔍'}</div>
              <div class="command-item-info" style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <strong style="color:var(--text-primary); font-size:0.88rem;">${escapeHTML(item.title)}</strong>
                  <span class="badge ${escapeHTML(item.badge)}" style="font-size:0.65rem;">${escapeHTML(item.cat)}</span>
                </div>
                <span style="font-size:0.78rem; color:var(--text-secondary); line-height:1.3; display:block; margin-top:0.15rem;">${escapeHTML(item.desc)}</span>
              </div>
            </div>
          `).join('');
          attachCommandItemClickListeners();
        } else {
          resultsContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
              No vector matches found for "<strong>${escapeHTML(query)}</strong>".<br>
              <span style="font-size:0.75rem; color:var(--text-secondary);">Try: "email", "receipt", "calendar", "board", or "transfer".</span>
            </div>
          `;
        }
      } catch (err) {
        showToast('Search Error', err.message || 'Failed to perform search', 'warning');
      }
    }, 150);
  });

  attachCommandItemClickListeners();
}

function attachCommandItemClickListeners() {
  const modalOverlay = document.getElementById('command-modal-overlay');
  const commandItems = document.querySelectorAll('.command-item');

  commandItems.forEach(item => {
    item.addEventListener('click', () => {
      const actionName = item.querySelector('strong')?.textContent || 'Item';
      const targetTab = item.getAttribute('data-tab');

      if (modalOverlay) modalOverlay.classList.remove('active');

      if (targetTab) {
        navigateToTab(targetTab);
        showToast('Smart Search Navigate', `Opened ${actionName}`, 'success');
      } else {
        showToast('AI Action Triggered', `Executed: ${actionName}`, 'success');
        simulateAIResponse(`Execute: ${actionName}`);
      }
    });
  });
}
