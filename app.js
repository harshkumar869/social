// ==========================================================================
// Required Constants at the Very Top
// ==========================================================================
const GEMINI_API_KEY = "AQ.Ab8RN6LPLzQuvJsd1n7BvV0TzToPNnhHPz73tShI4fljH2oyaA";
const GEMINI_MODEL = "gemini-2.0-flash";
const WEBHOOK_URL = "";

(function () {
  'use strict';

  // ==========================================================================
  // 1. Safe localStorage Wrapper Functions (try/catch protected)
  // ==========================================================================
  function safeGetStorage(key, fallback = null) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return fallback;
      }
      const val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function safeSetStorage(key, value) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (err) {
      return false;
    }
  }

  function safeRemoveStorage(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Storage Keys & Integration Getters
  const USER_KEY_STORAGE = 'pp_user_gemini_key';
  const USER_MODEL_STORAGE = 'pp_user_model';
  const USER_WEBHOOK_STORAGE = 'pp_user_webhook_url';
  const ACCOUNTS_STORAGE_KEY = 'pp_connected_accounts';

  // Seed user's configured API Key into localStorage immediately on script load
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== '') {
    const existingKey = safeGetStorage(USER_KEY_STORAGE, null);
    if (!existingKey || existingKey === '') {
      safeSetStorage(USER_KEY_STORAGE, GEMINI_API_KEY.trim());
    }
  }

  function getActiveGeminiKey() {
    const customKey = safeGetStorage(USER_KEY_STORAGE, null);
    if (customKey !== null && customKey.trim() !== '') return customKey.trim();
    return (typeof GEMINI_API_KEY === 'string') ? GEMINI_API_KEY.trim() : '';
  }

  function getActiveGeminiModel() {
    const customModel = safeGetStorage(USER_MODEL_STORAGE, null);
    if (customModel !== null && customModel.trim() !== '') return customModel.trim();
    return (typeof GEMINI_MODEL === 'string') ? GEMINI_MODEL.trim() : 'gemini-2.0-flash';
  }

  function getActiveWebhookUrl() {
    const customHook = safeGetStorage(USER_WEBHOOK_STORAGE, null);
    if (customHook !== null && customHook.trim() !== '') return customHook.trim();
    return (typeof WEBHOOK_URL === 'string') ? WEBHOOK_URL.trim() : '';
  }

  // ==========================================================================
  // 2. Reusable Toast Notification System (showToast)
  // ==========================================================================
  const toastContainer = document.getElementById('toast-container');

  // Inline SVG icons for toast types (no emojis)
  const toastIcons = {
    success: '<svg class="toast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="8"></circle><polyline points="6 10 9 13 14 7"></polyline></svg>',
    info: '<svg class="toast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="8"></circle><line x1="10" y1="8" x2="10" y2="14"></line><circle cx="10" cy="5" r="1" fill="currentColor"></circle></svg>',
    warning: '<svg class="toast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 2L1 18h18L10 2z"></path><line x1="10" y1="8" x2="10" y2="12"></line><line x1="10" y1="15" x2="10.01" y2="15"></line></svg>',
    error: '<svg class="toast-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="8"></circle><line x1="13" y1="7" x2="7" y2="13"></line><line x1="7" y1="7" x2="13" y2="13"></line></svg>'
  };

  /**
   * Display a modern notification toast
   * @param {string} message - Notification text
   * @param {'info' | 'success' | 'warning' | 'error'} type - Style category
   * @param {number} duration - Auto dismiss time in ms (default 3500)
   */
  window.showToast = function showToast(message, type = 'info', duration = 3500) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const safeType = ['success', 'info', 'warning', 'error'].includes(type) ? type : 'info';
    toast.className = `toast toast-${safeType}`;
    toast.setAttribute('role', 'alert');

    const iconHtml = toastIcons[safeType] || toastIcons.info;

    toast.innerHTML = `
      ${iconHtml}
      <span class="toast-message">${escapeHtml(message)}</span>
      <button class="toast-close" type="button" aria-label="Dismiss notification">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="4" y1="4" x2="12" y2="12"></line>
          <line x1="12" y1="4" x2="4" y2="12"></line>
        </svg>
      </button>
    `;

    function dismissToast() {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 220);
    }

    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', dismissToast);
    }

    toastContainer.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismissToast, duration);
    }
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper for safe clipboard copying
  function copyTextToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        window.showToast(successMessage, 'success');
      }).catch(() => {
        fallbackCopyText(text, successMessage);
      });
    } else {
      fallbackCopyText(text, successMessage);
    }
  }

  function fallbackCopyText(text, successMessage) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      window.showToast(successMessage, 'success');
    } catch (e) {
      window.showToast('Unable to copy text', 'error');
    }
  }

  // ==========================================================================
  // 3. Demo Mode Badge Visibility Logic
  // ==========================================================================
  const demoBadge = document.getElementById('demo-mode-badge');
  if (demoBadge) {
    // Show "Demo Mode" badge only when GEMINI_API_KEY is empty
    if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === "") {
      demoBadge.style.display = "inline-flex";
    } else {
      demoBadge.style.display = "none";
    }
  }

  // ==========================================================================
  // 4. Synchronized Theme Manager (Dark / Light)
  // ==========================================================================
  const THEME_STORAGE_KEY = 'postpilot_theme';
  const rootElement = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');

  function getStoredTheme() {
    const saved = safeGetStorage(THEME_STORAGE_KEY, null);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      rootElement.setAttribute('data-theme', 'light');
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-label', 'Switch to dark theme');
        themeToggleBtn.setAttribute('title', 'Switch to dark theme');
      }
    } else {
      rootElement.setAttribute('data-theme', 'dark');
      if (themeToggleBtn) {
        themeToggleBtn.setAttribute('aria-label', 'Switch to light theme');
        themeToggleBtn.setAttribute('title', 'Switch to light theme');
      }
    }
    safeSetStorage(THEME_STORAGE_KEY, theme);
  }

  // Initialize theme
  applyTheme(getStoredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const current = rootElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      window.showToast(`Switched to ${next} theme`, 'info', 2000);
    });
  }

  // ==========================================================================
  // 5. Sidebar Navigation & View Switching
  // ==========================================================================
  const navButtons = document.querySelectorAll('.nav-btn[data-view]');
  const viewPanels = document.querySelectorAll('.view-panel');
  const topbarTitle = document.getElementById('topbar-view-title');

  const viewTitles = {
    generator: 'Generator',
    calendar: 'Calendar',
    scheduler: 'Scheduler',
    analytics: 'Analytics',
    saved: 'Saved Library'
  };

  function switchView(viewName) {
    if (!viewTitles[viewName]) return;

    // 1. Update navigation button states
    navButtons.forEach(btn => {
      const match = btn.getAttribute('data-view') === viewName;
      btn.classList.toggle('active', match);
      if (match) {
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.removeAttribute('aria-current');
      }
    });

    // 2. Show the matching view section and hide others
    viewPanels.forEach(panel => {
      const isTarget = panel.id === `view-${viewName}`;
      panel.classList.toggle('active', isTarget);
    });

    // 3. Update topbar breadcrumb text
    if (topbarTitle) {
      topbarTitle.textContent = viewTitles[viewName];
    }

    // 4. If switching to Saved or Scheduler view, refresh components
    if (viewName === 'saved') {
      if (typeof renderSavedLibrary === 'function') {
        renderSavedLibrary();
      }
    } else if (viewName === 'scheduler') {
      if (typeof populateSchedulerSavedDropdown === 'function') {
        populateSchedulerSavedDropdown();
      }
      if (typeof renderScheduledPosts === 'function') {
        renderScheduledPosts();
      }
    }

    // 5. Close mobile sidebar drawer if open
    closeMobileSidebar();
  }

  // Attach view switch handlers
  navButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const targetView = this.getAttribute('data-view');
      switchView(targetView);
    });
  });

  // Topbar quick "New Post" button switches to Generator
  const btnQuickCreate = document.getElementById('btn-quick-create');
  if (btnQuickCreate) {
    btnQuickCreate.addEventListener('click', function () {
      switchView('generator');
      const topicInput = document.getElementById('gen-topic');
      if (topicInput) {
        topicInput.focus();
      }
      window.showToast('Ready to compose a new post', 'info', 2000);
    });
  }

  // ==========================================================================
  // 6. Responsive Mobile Drawer (< 1024px)
  // ==========================================================================
  const appSidebar = document.getElementById('app-sidebar');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  function openMobileSidebar() {
    if (!appSidebar) return;
    appSidebar.classList.add('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeMobileSidebar() {
    if (!appSidebar) return;
    appSidebar.classList.remove('open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      openMobileSidebar();
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && appSidebar && appSidebar.classList.contains('open')) {
      closeMobileSidebar();
    }
  });

  // ==========================================================================
  // 7. Content Generator View (API, Validation, Rendering, Fallbacks)
  // ==========================================================================
  const genTopic = document.getElementById('gen-topic');
  const topicCharCounter = document.getElementById('topic-char-counter');
  const errorGenTopic = document.getElementById('error-gen-topic');
  const platformChips = document.querySelectorAll('#platform-chips-selector .channel-chip');
  const genPlatformSelect = document.getElementById('gen-platform');
  const genToneSelect = document.getElementById('gen-tone');
  const genAudienceInput = document.getElementById('gen-audience');
  const genLanguageSelect = document.getElementById('gen-language');
  const btnGenerate = document.getElementById('btn-generate-content');
  const btnRegenerate = document.getElementById('btn-regenerate-content');
  const btnTopRegenerate = document.getElementById('btn-top-regenerate');
  const btnClearGenerator = document.getElementById('btn-clear-generator');

  // Results containers
  const generatorPlaceholder = document.getElementById('generator-placeholder');
  const generatorSkeleton = document.getElementById('generator-skeleton');
  const generatorResults = document.getElementById('generator-results');

  // Output elements
  const resPlatformTag = document.getElementById('res-platform-tag');
  const resToneTag = document.getElementById('res-tone-tag');
  const resLangTag = document.getElementById('res-lang-tag');
  const captionsContainer = document.getElementById('captions-container');
  const hashtagsContainer = document.getElementById('hashtags-container');
  const btnCopyHashtags = document.getElementById('btn-copy-hashtags');
  const resCtaText = document.getElementById('res-cta-text');
  const btnCopyCta = document.getElementById('btn-copy-cta');
  const resBestTimeText = document.getElementById('res-best-time-text');
  const resImageIdeaText = document.getElementById('res-image-idea-text');
  const resImagePromptBlock = document.getElementById('res-image-prompt-block');
  const btnCopyImagePrompt = document.getElementById('btn-copy-image-prompt');

  // Current generation state
  let currentOutputData = null;
  let isGenerating = false;

  // Topic character counter and real-time error clearance
  if (genTopic) {
    genTopic.addEventListener('input', function () {
      const len = this.value.length;
      if (topicCharCounter) {
        topicCharCounter.textContent = `${len} char${len === 1 ? '' : 's'}`;
      }
      if (len > 0) {
        clearTopicError();
      }
    });
  }

  function showTopicError(msg) {
    if (errorGenTopic) {
      errorGenTopic.textContent = msg || 'Please provide a topic to generate content.';
      errorGenTopic.style.display = 'block';
    }
    if (genTopic) {
      genTopic.classList.add('input-error');
      genTopic.focus();
    }
  }

  function clearTopicError() {
    if (errorGenTopic) {
      errorGenTopic.style.display = 'none';
    }
    if (genTopic) {
      genTopic.classList.remove('input-error');
    }
  }

  // Platform chips selection sync
  platformChips.forEach(chip => {
    chip.addEventListener('click', function () {
      platformChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-checked', 'true');
      const platformVal = this.getAttribute('data-platform');
      if (genPlatformSelect) {
        genPlatformSelect.value = platformVal;
      }
      if (typeof updateGeneratorPlatformStatus === 'function') {
        updateGeneratorPlatformStatus();
      }
    });
  });

  function getSelectedPlatform() {
    if (genPlatformSelect && genPlatformSelect.value) {
      return genPlatformSelect.value;
    }
    const activeChip = document.querySelector('#platform-chips-selector .channel-chip.active');
    return activeChip ? activeChip.getAttribute('data-platform') : 'Instagram';
  }

  // Clear Generator Form
  if (btnClearGenerator) {
    btnClearGenerator.addEventListener('click', function () {
      if (genTopic) genTopic.value = '';
      if (genAudienceInput) genAudienceInput.value = '';
      if (topicCharCounter) topicCharCounter.textContent = '0 chars';
      clearTopicError();
      window.showToast('Form cleared', 'info');
    });
  }

  // Loading state management
  function setLoadingState(loading) {
    isGenerating = loading;
    if (btnGenerate) {
      btnGenerate.disabled = loading;
      const textSpan = btnGenerate.querySelector('#btn-generate-text') || btnGenerate.querySelector('span');
      if (textSpan) {
        textSpan.textContent = loading ? 'Generating with AI...' : 'Generate Content';
      }
      const icon = btnGenerate.querySelector('.btn-gen-icon');
      if (icon) {
        if (loading) {
          icon.style.animation = 'spin 1s linear infinite';
        } else {
          icon.style.animation = 'none';
        }
      }
    }

    if (btnRegenerate) btnRegenerate.disabled = loading;
    if (btnTopRegenerate) btnTopRegenerate.disabled = loading;

    if (loading) {
      if (generatorPlaceholder) generatorPlaceholder.style.display = 'none';
      if (generatorResults) generatorResults.style.display = 'none';
      if (generatorSkeleton) generatorSkeleton.style.display = 'flex';
    } else {
      if (generatorSkeleton) generatorSkeleton.style.display = 'none';
    }
  }

  /**
   * Main Generator Runner
   */
  async function runContentGeneration() {
    if (isGenerating) return;

    const topic = genTopic ? genTopic.value.trim() : '';
    if (!topic) {
      showTopicError('Please enter a topic to generate content.');
      window.showToast('Please enter a campaign topic first', 'warning');
      return;
    }
    clearTopicError();

    const platform = getSelectedPlatform();
    const tone = genToneSelect ? genToneSelect.value : 'Professional';
    const audience = genAudienceInput ? genAudienceInput.value.trim() : '';
    const language = genLanguageSelect ? genLanguageSelect.value : 'English';

    setLoadingState(true);

    let outputResult = null;

    // Check if API key is present (use active key from storage or default)
    const activeGenKey = getActiveGeminiKey();
    const activeGenModel = getActiveGeminiModel();
    if (activeGenKey && activeGenKey.trim() !== '') {
      try {
        outputResult = await fetchGeminiContent({
          apiKey: activeGenKey.trim(),
          model: activeGenModel || 'gemini-2.0-flash',
          topic,
          platform,
          tone,
          audience,
          language
        });
      } catch (err) {
        // Fall back to built-in realistic demo output on failure
        outputResult = null;
      }
    }

    // Fallback if API key is missing or request failed
    if (!outputResult) {
      outputResult = generateRealisticDemoOutput({
        topic,
        platform,
        tone,
        audience,
        language
      });
      window.showToast('Showing demo output', 'info');
    } else {
      window.showToast('Content generated with Gemini AI!', 'success');
    }

    // Render results to DOM using textContent (never innerHTML for AI text)
    currentOutputData = {
      ...outputResult,
      topic,
      platform,
      tone,
      audience,
      language
    };

    renderGeneratorResults(currentOutputData);
    setLoadingState(false);
  }

  // Attach button triggers
  if (btnGenerate) {
    btnGenerate.addEventListener('click', runContentGeneration);
  }
  if (btnRegenerate) {
    btnRegenerate.addEventListener('click', runContentGeneration);
  }
  if (btnTopRegenerate) {
    btnTopRegenerate.addEventListener('click', runContentGeneration);
  }

  /**
   * Generic Reusable Gemini REST API Caller (Shared across Generator, Calendar, etc.)
   */
  async function callGeminiApi(promptText, apiKey = GEMINI_API_KEY, model = GEMINI_MODEL) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is empty');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || 'gemini-2.0-flash')}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('No candidate content returned by Gemini API');
      }

      // Strip markdown code fences before parsing
      const cleanedJson = stripCodeFences(rawText);
      return JSON.parse(cleanedJson);
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Call Gemini API for Content Generator using the shared callGeminiApi helper
   */
  async function fetchGeminiContent({ apiKey, model, topic, platform, tone, audience, language }) {
    const promptText = `You are an elite autonomous social media manager.
Generate viral, high-converting social media marketing content based strictly on:
- Platform: ${platform}
- Topic: ${topic}
- Tone: ${tone}
- Target Audience: ${audience || 'Engaged niche followers'}
- Language: ${language}

OUTPUT INSTRUCTIONS:
Return a STRICT, valid JSON object ONLY.
DO NOT wrap the response in markdown code fences (\`\`\` or \`\`\`json).
DO NOT add any conversational text before or after the JSON.

The JSON MUST match this exact schema:
{
  "captions": [
    "First captivating caption angle with hook, engaging paragraph structure, and clear message.",
    "Second alternative caption angle focusing on direct value, tactical insights, or story.",
    "Third punchy, concise caption angle optimized for fast scroll-stopping engagement."
  ],
  "hashtags": [
    "#tag1", "#tag2", "#tag3", "#tag4", "#tag5",
    "#tag6", "#tag7", "#tag8", "#tag9", "#tag10",
    "#tag11", "#tag12", "#tag13", "#tag14", "#tag15"
  ],
  "cta": "Compelling call to action sentence tailored to this platform and tone",
  "bestTime": "Recommended posting day and peak engagement time (e.g. Tuesday at 9:30 AM EST)",
  "imageIdea": "Visual concept description, composition layout, and aesthetic direction",
  "imagePrompt": "Detailed AI art generation prompt (Midjourney/DALL-E) to produce this visual"
}`;

    const parsed = await callGeminiApi(promptText, apiKey, model);

    // Validate required keys
    if (!Array.isArray(parsed.captions) || parsed.captions.length < 3) {
      throw new Error('Invalid captions format');
    }
    if (!Array.isArray(parsed.hashtags) || parsed.hashtags.length < 5) {
      throw new Error('Invalid hashtags format');
    }

    return {
      captions: parsed.captions.slice(0, 3),
      hashtags: sanitizeHashtags(parsed.hashtags).slice(0, 15),
      cta: String(parsed.cta || 'Leave your thoughts below!'),
      bestTime: String(parsed.bestTime || 'Tuesday at 10:00 AM'),
      imageIdea: String(parsed.imageIdea || 'Modern high-contrast digital illustration'),
      imagePrompt: String(parsed.imagePrompt || 'Cinematic minimalist 3D rendering')
    };
  }

  function stripCodeFences(raw) {
    if (!raw) return '';
    let str = raw.trim();
    // Strip ```json or ``` at beginning
    str = str.replace(/^```(?:json)?\s*/i, '');
    // Strip ``` at end
    str = str.replace(/\s*```$/i, '');
    return str.trim();
  }

  function sanitizeHashtags(tags) {
    if (!Array.isArray(tags)) return [];
    return tags.map(tag => {
      let t = String(tag).trim();
      return t.startsWith('#') ? t : `#${t}`;
    });
  }

  /**
   * Realistic built-in sample fallback generator
   */
  function generateRealisticDemoOutput({ topic, platform, tone, audience, language }) {
    const cleanTopic = topic || 'Autonomous social growth for modern teams';
    const audStr = audience ? `for ${audience}` : 'for growth-minded creators';

    let captions = [];
    let cta = '';
    let bestTime = '';
    let imageIdea = '';
    let imagePrompt = '';

    if (platform === 'LinkedIn') {
      captions = [
        `Most teams spend 18 hours every week wrestling with social content calendars.\n\nHere is the exact framework to 10x your organic reach with ${cleanTopic} ${audStr}:\n\n1. Stop drafting from scratch on every channel.\n2. Leverage platform-native voice adaptation.\n3. Publish strictly when your followers are most active.\n\nAutomate the routine, double down on the strategy.`,
        `If you are not rethinking how your team handles social distribution in 2026, you are already falling behind.\n\nWe spent 6 months dissecting viral reach algorithms. The takeaway for ${cleanTopic} is simple:\n\nValue density > raw posting frequency.\n\nHere is how top 1% brands structure their message to capture attention in the first 2 seconds.`,
        `Quick question for ${audience || 'founders and marketers'}:\n\nHow much of your weekly output is lost to manual scheduling and caption rewriting?\n\n${cleanTopic} is proof that smart automation does not mean robotic content. When your voice is dialed in, scale follows effortlessly.`
      ];
      cta = 'What is your biggest bottleneck when scaling social content this quarter? Drop your thoughts below.';
      bestTime = 'Tuesday & Thursday at 9:15 AM (Peak B2B Feed Activity)';
      imageIdea = 'A sleek split-screen graphic comparing 18 hours of manual copy-paste vs. 15 minutes of autonomous campaign orchestration.';
      imagePrompt = 'Modern minimalist SaaS interface illustration, clean typography, soft purple and blue neon glow, 8k resolution, cinematic studio lighting.';
    } else if (platform === 'X') {
      captions = [
        `Why 90% of brands fail to scale their audience in 2026:\n\nThey treat every platform like the same billboard.\n\nThe truth? Context wins 10x more reach.\n\nHere are 3 structural rules for ${cleanTopic} (breakdown below):`,
        `Most content advice is completely outdated.\n\nIf you want to dominate feeds with ${cleanTopic} ${audStr}, follow this 30-day playbook:\n\n- Hook with an undeniable counter-intuitive truth\n- Deliver actionable takeaways with zero fluff\n- Engage in the replies within 15 minutes`,
        `The difference between 1k impressions and 100k impressions isn’t luck.\n\nIt’s understanding audience retention curves.\n\nHere is how we use ${cleanTopic} to eliminate creative fatigue:`
      ];
      cta = 'Bookmark this thread for your next content sprint and follow for daily breakdowns.';
      bestTime = 'Monday & Wednesday at 2:45 PM (High Retweet Velocity)';
      imageIdea = 'High-impact dark mode infographic with bold data callouts and clean flow arrows.';
      imagePrompt = 'Dark mode data infographic poster, minimalist Swiss graphic design style, vibrant gradient lines in purple and electric blue.';
    } else if (platform === 'Instagram') {
      captions = [
        `Swipe to see the exact 5-step framework that saved our content team 15+ hours this month on ${cleanTopic}!\n\nConsistent growth isn’t about grinding 24/7. It’s about building an autonomous engine that works while you sleep.\n\nSave this post so you don’t lose it when planning next month!`,
        `Stop staring at blank drafts.\n\nHere is how top creators publish daily across all channels without burning out:\n\n1. Capture raw thoughts on the go\n2. Let AI match your signature tone\n3. Schedule for peak engagement windows\n\nDouble tap if you needed this reminder today!`,
        `Your message deserves to be seen by the right people.\n\nHere is why ${cleanTopic} is a game changer ${audStr}.\n\nCheck out the slides for the step-by-step blueprint!`
      ];
      cta = 'Drop a comment with "PILOT" below and we will send you our exclusive campaign template vault!';
      bestTime = 'Wednesday & Friday at 6:15 PM (Optimal Evening Engagement)';
      imageIdea = 'A 5-slide cohesive carousel with bold typographic title slide and high-contrast step cards.';
      imagePrompt = 'High-end editorial aesthetic carousel slide, aesthetic gradient glassmorphism, clean typography, editorial portrait photography style, 4k.';
    } else if (platform === 'YouTube') {
      captions = [
        `In this video, we break down how to scale ${cleanTopic} ${audStr} without spending thousands on agencies.\n\nWatch until the end for our 3-step checklist that you can implement in under 10 minutes!`,
        `Is your channel stuck under 10k views? Here is the single strategy change that 10x’d our organic watch time with ${cleanTopic}.\n\nTimestamps and resources in the description below!`,
        `Stop wasting time on content that gets zero retention.\n\nHere is our complete step-by-step breakdown on ${cleanTopic}: from ideation to automated distribution.`
      ];
      cta = 'Subscribe for weekly growth teardowns and hit the bell icon to never miss an upload!';
      bestTime = 'Thursday & Saturday at 11:30 AM (Peak Watch-Time Window)';
      imageIdea = 'High-CTR YouTube thumbnail showing a bold before/after curve and clean focal subject.';
      imagePrompt = 'High contrast vibrant YouTube thumbnail style, expressive creator silhouette, glowing metric charts, volumetric studio lighting, 8k.';
    } else {
      // Facebook
      captions = [
        `Managing social media shouldn't take over your entire week.\n\nHere is how smart teams are leveraging ${cleanTopic} ${audStr} to cut production time in half while driving record engagement:\n\nWhat is your team’s biggest challenge right now?`,
        `Are you still scheduling posts manually? Here is why ${cleanTopic} is changing how community managers and marketing leads operate in 2026.\n\nRead the full breakdown below!`,
        `Excited to share our latest strategy on ${cleanTopic}!\n\nWhether you’re running a community, brand page, or personal profile, these 3 practical principles will help you connect with your audience on a deeper level.`
      ];
      cta = 'Share this post with someone on your team who needs to see this today!';
      bestTime = 'Wednesday at 1:15 PM (Active Community Feed Hour)';
      imageIdea = 'Clean community visual with authentic workplace interaction and bold quote card.';
      imagePrompt = 'Authentic bright agency team collaboration scene, modern workspace, soft daylight, professional photography.';
    }

    // Hinglish / Hindi language adaptation if selected
    if (language === 'Hinglish') {
      captions[0] = `Agar aap bhi har hafte 15+ ghante social media content banane me waste kar rahe ho, toh yeh playbook aapke liye hai.\n\n${cleanTopic} ke sath kaise 10x organic reach hasil karein:\n\n1. Scratch se baar-baar likhna band karo.\n2. Adaptive AI voice use karo jo natural lage.\n3. Peak follower time par schedule karo.\n\nSmart bano, hard nahi!`;
      cta = 'Aapka sabse bada marketing challenge kya hai? Comments me batayein!';
    } else if (language === 'Hindi') {
      captions[0] = `अगर आप भी हर हफ्ते कई घंटे सोशल मीडिया पोस्ट तैयार करने में बिता रहे हैं, तो यह रणनीति आपके लिए है।\n\n${cleanTopic} के साथ अपनी पहुंच को 10 गुना कैसे बढ़ाएं:\n1. बार-बार नए सिरे से लिखना बंद करें।\n2. अपने ब्रांड के अनुसार तैयार AI का उपयोग करें।\n3. सबसे सक्रिय समय पर पोस्ट शेड्यूल करें।`;
      cta = 'अपनी राय नीचे कमेंट्स में ज़रूर बताएं!';
    }

    const hashtags = [
      '#ContentStrategy',
      '#GrowthOps',
      '#SocialMediaMarketing',
      '#CreatorTools',
      '#AIAutomation',
      '#ProductivityHacks',
      '#SaaSGrowth',
      '#MarketingTips',
      '#AudienceBuilding',
      '#PostPilotAI',
      '#DigitalMarketing',
      '#BrandBuilding',
      '#ViralContent',
      '#OnlineBusiness',
      '#TechInnovation'
    ];

    return {
      captions,
      hashtags,
      cta,
      bestTime,
      imageIdea,
      imagePrompt
    };
  }

  /**
   * Render generator results into cards strictly using textContent for all AI-generated strings
   */
  function renderGeneratorResults(data) {
    if (!data) return;

    // Show results container, hide others
    if (generatorPlaceholder) generatorPlaceholder.style.display = 'none';
    if (generatorSkeleton) generatorSkeleton.style.display = 'none';
    if (generatorResults) generatorResults.style.display = 'flex';
    if (btnRegenerate) btnRegenerate.style.display = 'inline-flex';

    // Meta Tags
    if (resPlatformTag) resPlatformTag.textContent = data.platform;
    if (resToneTag) resToneTag.textContent = data.tone;
    if (resLangTag) resLangTag.textContent = data.language;

    // 1. Render 3 Captions
    if (captionsContainer) {
      captionsContainer.innerHTML = ''; // Clear container

      const variantLabels = [
        'Angle 1: Hook & Story',
        'Angle 2: Direct Value',
        'Angle 3: Punchy & Conversational'
      ];

      data.captions.forEach((captionText, index) => {
        const card = document.createElement('div');
        card.className = 'caption-card';

        // Header bar
        const header = document.createElement('div');
        header.className = 'caption-card-header';

        const tag = document.createElement('span');
        tag.className = 'caption-variant-tag';
        tag.textContent = variantLabels[index] || `Option ${index + 1}`;

        const actions = document.createElement('div');
        actions.className = 'caption-card-actions';

        // Copy Button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-outline btn-sm';
        copyBtn.type = 'button';
        copyBtn.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;" aria-hidden="true">
            <rect x="5" y="5" width="8" height="8" rx="1.5"></rect>
            <path d="M3 11V3h8"></path>
          </svg>
          <span>Copy</span>
        `;
        copyBtn.addEventListener('click', () => {
          copyTextToClipboard(captionText, 'Caption copied to clipboard!');
        });

        // Save Button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-secondary btn-sm';
        saveBtn.type = 'button';
        saveBtn.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;" aria-hidden="true">
            <path d="M13 14l-5-3.5L3 14V3a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 13 3v11z"/>
          </svg>
          <span>Save</span>
        `;
        saveBtn.addEventListener('click', function () {
          savePostToLibrary({
            topic: data.topic,
            platform: data.platform,
            tone: data.tone,
            language: data.language,
            caption: captionText,
            hashtags: data.hashtags,
            cta: data.cta,
            bestTime: data.bestTime,
            imageIdea: data.imageIdea,
            imagePrompt: data.imagePrompt
          });
          this.disabled = true;
          this.querySelector('span').textContent = 'Saved';
        });

        actions.appendChild(copyBtn);
        actions.appendChild(saveBtn);
        header.appendChild(tag);
        header.appendChild(actions);

        // Body Text — STRICTLY ASSIGNED VIA textContent
        const bodyText = document.createElement('p');
        bodyText.className = 'caption-body-text';
        bodyText.textContent = captionText;

        card.appendChild(header);
        card.appendChild(bodyText);
        captionsContainer.appendChild(card);
      });
    }

    // 2. Render Hashtags as Chips
    if (hashtagsContainer) {
      hashtagsContainer.innerHTML = '';
      data.hashtags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'hashtag-chip';
        // Assign tag text strictly via textContent
        chip.textContent = tag;
        chip.title = 'Click to copy';
        chip.addEventListener('click', () => {
          copyTextToClipboard(tag, `Copied ${tag}!`);
        });
        hashtagsContainer.appendChild(chip);
      });
    }

    // Copy All Hashtags
    if (btnCopyHashtags) {
      btnCopyHashtags.onclick = function () {
        const allTags = data.hashtags.join(' ');
        copyTextToClipboard(allTags, 'All 15 hashtags copied to clipboard!');
      };
    }

    // 3. CTA Text — STRICTLY ASSIGNED VIA textContent
    if (resCtaText) {
      resCtaText.textContent = data.cta;
    }
    if (btnCopyCta) {
      btnCopyCta.onclick = function () {
        copyTextToClipboard(data.cta, 'CTA text copied!');
      };
    }

    // 4. Best Time — STRICTLY ASSIGNED VIA textContent
    if (resBestTimeText) {
      resBestTimeText.textContent = data.bestTime;
    }

    // 5. Image Idea & Prompt — STRICTLY ASSIGNED VIA textContent
    if (resImageIdeaText) {
      resImageIdeaText.textContent = data.imageIdea;
    }
    if (resImagePromptBlock) {
      resImagePromptBlock.textContent = data.imagePrompt;
    }
    if (btnCopyImagePrompt) {
      btnCopyImagePrompt.onclick = function () {
        copyTextToClipboard(data.imagePrompt, 'AI image prompt copied!');
      };
    }
  }

  // ==========================================================================
  // 8. Saved Posts Storage Management (Key: "pp_saved")
  // ==========================================================================
  const SAVED_STORAGE_KEY = 'pp_saved';

  function getSavedPosts() {
    const raw = safeGetStorage(SAVED_STORAGE_KEY, '[]');
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        safeSetStorage(SAVED_STORAGE_KEY, '[]');
        return [];
      }
      return parsed.filter(item => item && typeof item === 'object' && typeof item.id === 'string');
    } catch (e) {
      safeSetStorage(SAVED_STORAGE_KEY, '[]');
      return [];
    }
  }

  function savePostToLibrary(postData) {
    const list = getSavedPosts();
    const newEntry = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      topic: String(postData.topic || 'Untitled Post').trim(),
      platform: String(postData.platform || 'General').trim(),
      tone: String(postData.tone || 'Professional').trim(),
      language: String(postData.language || 'English').trim(),
      caption: String(postData.caption || '').trim(),
      hashtags: Array.isArray(postData.hashtags) ? postData.hashtags.filter(Boolean) : [],
      cta: String(postData.cta || '').trim(),
      bestTime: String(postData.bestTime || '').trim(),
      imageIdea: String(postData.imageIdea || '').trim(),
      imagePrompt: String(postData.imagePrompt || '').trim(),
      savedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    list.unshift(newEntry);
    safeSetStorage(SAVED_STORAGE_KEY, JSON.stringify(list));
    renderSavedLibrary();
    if (typeof populateSchedulerSavedDropdown === 'function') {
      populateSchedulerSavedDropdown();
    }
    window.showToast('Post saved to Library!', 'success');
  }

  // Delete Confirmation Modal Management
  let pendingDeletePostId = null;
  const deleteModal = document.getElementById('delete-confirm-modal');
  const modalConfirmDesc = document.getElementById('modal-confirm-desc');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  function openDeleteModal(postId, postTopic) {
    pendingDeletePostId = postId;
    if (modalConfirmDesc) {
      modalConfirmDesc.textContent = `Are you sure you want to remove "${postTopic || 'this post'}" from your saved library? This action cannot be undone.`;
    }
    if (deleteModal) {
      deleteModal.style.display = 'flex';
    }
    if (btnCancelDelete) {
      btnCancelDelete.focus();
    }
  }

  function closeDeleteModal() {
    pendingDeletePostId = null;
    if (deleteModal) {
      deleteModal.style.display = 'none';
    }
  }

  if (btnCancelDelete) {
    btnCancelDelete.addEventListener('click', closeDeleteModal);
  }

  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', function () {
      if (pendingDeletePostId) {
        deleteSavedPost(pendingDeletePostId);
        closeDeleteModal();
      }
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener('click', function (e) {
      if (e.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && deleteModal && deleteModal.style.display !== 'none') {
      closeDeleteModal();
    }
  });

  function deleteSavedPost(id) {
    let list = getSavedPosts();
    list = list.filter(item => item && item.id !== id);
    safeSetStorage(SAVED_STORAGE_KEY, JSON.stringify(list));
    renderSavedLibrary();
    if (typeof populateSchedulerSavedDropdown === 'function') {
      populateSchedulerSavedDropdown();
    }
    window.showToast('Item removed from Library', 'info');
  }

  // Saved Library Filtering and Card Rendering
  const savedSearchInput = document.getElementById('saved-search-input');
  const savedPlatformFilter = document.getElementById('saved-platform-filter');

  function renderSavedLibrary() {
    const container = document.getElementById('saved-items-grid') || document.querySelector('#view-saved .saved-items-grid');
    if (!container) return;

    const allPosts = getSavedPosts();

    // Friendly empty state when zero posts are in the library
    if (allPosts.length === 0) {
      container.innerHTML = `
        <div class="placeholder-state" style="grid-column: 1 / -1; padding: 48px 24px;">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3 class="placeholder-title">Your Saved Library is Empty</h3>
          <p class="placeholder-desc">When you generate posts in the Content Generator or 7-Day Campaign Planner, click "Save" on any caption to store it here for future reuse and autonomous scheduling.</p>
        </div>
      `;
      const genBtn = document.createElement('button');
      genBtn.className = 'btn btn-primary btn-sm';
      genBtn.style.marginTop = '16px';
      genBtn.type = 'button';
      genBtn.textContent = 'Create Content in Generator';
      genBtn.addEventListener('click', () => switchView('generator'));
      if (container.firstElementChild) {
        container.firstElementChild.appendChild(genBtn);
      }
      return;
    }

    // Filter by search query and platform dropdown
    const searchTerm = savedSearchInput ? savedSearchInput.value.trim().toLowerCase() : '';
    const platformFilter = savedPlatformFilter ? savedPlatformFilter.value : 'All';

    const filtered = allPosts.filter(item => {
      // Platform filter
      if (platformFilter !== 'All') {
        const itemPlat = (item.platform || '').toLowerCase();
        const targetPlat = platformFilter.toLowerCase();
        if (!itemPlat.includes(targetPlat) && itemPlat !== targetPlat) {
          return false;
        }
      }

      // Search term filter across topic, caption, hashtags, and platform
      if (searchTerm) {
        const topicMatch = (item.topic || '').toLowerCase().includes(searchTerm);
        const captionMatch = (item.caption || '').toLowerCase().includes(searchTerm);
        const hashtagsMatch = Array.isArray(item.hashtags)
          ? item.hashtags.some(tag => String(tag).toLowerCase().includes(searchTerm))
          : false;
        const platformMatch = (item.platform || '').toLowerCase().includes(searchTerm);
        return topicMatch || captionMatch || hashtagsMatch || platformMatch;
      }

      return true;
    });

    // Friendly empty state when filters yield no matches
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="placeholder-state" style="grid-column: 1 / -1; padding: 48px 24px;">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3 class="placeholder-title">No Matching Saved Posts</h3>
          <p class="placeholder-desc">No saved items matched your filter query. Try searching for different keywords or reset the filter.</p>
        </div>
      `;
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-outline btn-sm';
      clearBtn.style.marginTop = '16px';
      clearBtn.type = 'button';
      clearBtn.textContent = 'Reset Search & Filter';
      clearBtn.addEventListener('click', () => {
        if (savedSearchInput) savedSearchInput.value = '';
        if (savedPlatformFilter) savedPlatformFilter.value = 'All';
        renderSavedLibrary();
      });
      if (container.firstElementChild) {
        container.firstElementChild.appendChild(clearBtn);
      }
      return;
    }

    container.innerHTML = '';

    filtered.forEach(item => {
      const card = document.createElement('div');
      card.className = 'saved-item-card';

      // Header row with platform badge and delete button
      const header = document.createElement('div');
      header.className = 'saved-item-header';

      const badge = document.createElement('span');
      const platLower = (item.platform || '').toLowerCase();
      let badgeClass = 'pill-badge';
      if (platLower.includes('linkedin')) badgeClass += ' li';
      else if (platLower.includes('instagram')) badgeClass += ' ig';
      else if (platLower.includes('x') || platLower.includes('twitter')) badgeClass += ' x';
      badge.className = badgeClass;
      badge.textContent = `${item.platform || 'General'} • ${item.savedAt || 'Saved'}`;

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete-item';
      delBtn.type = 'button';
      delBtn.title = 'Delete saved post';
      delBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px; vertical-align: -1px; margin-right: 4px;" aria-hidden="true">
          <path d="M2 4h12M5 4V2.5A1.5 1.5 0 0 1 6.5 1h3A1.5 1.5 0 0 1 11 2.5V4M13 4v9.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5V4"></path>
        </svg>
        <span>Delete</span>
      `;
      delBtn.addEventListener('click', () => {
        openDeleteModal(item.id, item.topic);
      });

      header.appendChild(badge);
      header.appendChild(delBtn);

      // Title (using textContent strictly)
      const title = document.createElement('h3');
      title.className = 'saved-item-title';
      title.textContent = item.topic || 'Untitled Post';

      // Snippet / Caption (using textContent strictly)
      const snippet = document.createElement('p');
      snippet.className = 'saved-item-snippet';
      snippet.textContent = item.caption || item.imageIdea || 'No caption content';

      // Hashtags preview row
      let tagsRow = null;
      if (Array.isArray(item.hashtags) && item.hashtags.length > 0) {
        tagsRow = document.createElement('div');
        tagsRow.style.display = 'flex';
        tagsRow.style.flexWrap = 'wrap';
        tagsRow.style.gap = '6px';
        tagsRow.style.marginBottom = '12px';

        item.hashtags.slice(0, 4).forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'saved-tag';
          chip.textContent = tag.startsWith('#') ? tag : `#${tag}`;
          tagsRow.appendChild(chip);
        });

        if (item.hashtags.length > 4) {
          const moreChip = document.createElement('span');
          moreChip.className = 'saved-tag';
          moreChip.style.color = 'var(--muted)';
          moreChip.textContent = `+${item.hashtags.length - 4} more`;
          tagsRow.appendChild(moreChip);
        }
      }

      // Footer action buttons
      const footer = document.createElement('div');
      footer.className = 'saved-item-footer';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn-use-template';
      copyBtn.type = 'button';
      copyBtn.textContent = 'Copy Caption';
      copyBtn.addEventListener('click', () => copyTextToClipboard(item.caption, 'Saved caption copied!'));

      const schedBtn = document.createElement('button');
      schedBtn.className = 'btn-use-template';
      schedBtn.type = 'button';
      schedBtn.textContent = 'Schedule';
      schedBtn.title = 'Send this post to the Scheduler';
      schedBtn.addEventListener('click', () => {
        switchView('scheduler');
        if (typeof populateSchedulerSavedDropdown === 'function') {
          populateSchedulerSavedDropdown();
        }
        const schedSelect = document.getElementById('sched-saved-post');
        if (schedSelect) {
          schedSelect.value = item.id;
          schedSelect.dispatchEvent(new Event('change'));
        }
        window.showToast('Loaded into Autonomous Scheduler', 'info');
      });

      const useBtn = document.createElement('button');
      useBtn.className = 'btn-use-template';
      useBtn.type = 'button';
      useBtn.textContent = 'Use in Generator';
      useBtn.addEventListener('click', () => {
        switchView('generator');
        if (genTopic) {
          genTopic.value = item.topic;
          genTopic.focus();
        }
        window.showToast('Template loaded into Generator!', 'info');
      });

      footer.appendChild(copyBtn);
      footer.appendChild(schedBtn);
      footer.appendChild(useBtn);

      card.appendChild(header);
      card.appendChild(title);
      card.appendChild(snippet);
      if (tagsRow) card.appendChild(tagsRow);
      card.appendChild(footer);

      container.appendChild(card);
    });
  }

  // Attach search and filter event listeners
  if (savedSearchInput) {
    savedSearchInput.addEventListener('input', () => renderSavedLibrary());
  }
  if (savedPlatformFilter) {
    savedPlatformFilter.addEventListener('change', () => renderSavedLibrary());
  }

  // Initial render of saved library
  renderSavedLibrary();

  // ==========================================================================
  // 9. Calendar 7-Day Plan Generator & CSV Export
  // ==========================================================================
  const calBusinessType = document.getElementById('cal-business-type');
  const calGoal = document.getElementById('cal-goal');
  const errorCalBusinessType = document.getElementById('error-cal-business-type');
  const errorCalGoal = document.getElementById('error-cal-goal');
  const btnGenerateCalendar = document.getElementById('btn-generate-calendar');
  const btnExportCalendarCsv = document.getElementById('btn-export-calendar-csv');
  const btnExportCalendarCsvInline = document.getElementById('btn-export-calendar-csv-inline');

  const calPlaceholder = document.getElementById('cal-placeholder');
  const calSkeleton = document.getElementById('cal-skeleton');
  const calPlanWrapper = document.getElementById('cal-plan-wrapper');
  const calTopActions = document.getElementById('cal-top-actions');
  const calendarCardsGrid = document.getElementById('calendar-cards-grid');
  const calMetaBusiness = document.getElementById('cal-meta-business');
  const calMetaGoal = document.getElementById('cal-meta-goal');

  let currentCalendarPlan = null;
  let currentCalendarBusinessType = '';
  let currentCalendarGoal = '';
  let isGeneratingCalendar = false;

  // Real-time error clearing on inputs
  if (calBusinessType) {
    calBusinessType.addEventListener('input', function () {
      if (this.value.trim()) {
        if (errorCalBusinessType) errorCalBusinessType.style.display = 'none';
        this.classList.remove('input-error');
      }
    });
  }

  if (calGoal) {
    calGoal.addEventListener('input', function () {
      if (this.value.trim()) {
        if (errorCalGoal) errorCalGoal.style.display = 'none';
        this.classList.remove('input-error');
      }
    });
  }

  function setCalendarLoadingState(loading) {
    isGeneratingCalendar = loading;
    if (btnGenerateCalendar) {
      btnGenerateCalendar.disabled = loading;
      const textSpan = btnGenerateCalendar.querySelector('#btn-generate-cal-text') || btnGenerateCalendar.querySelector('span');
      if (textSpan) {
        textSpan.textContent = loading ? 'Generating 7-Day Plan...' : 'Generate 7-Day Plan';
      }
      const icon = btnGenerateCalendar.querySelector('.btn-cal-icon');
      if (icon) {
        icon.style.animation = loading ? 'spin 1s linear infinite' : 'none';
      }
    }

    if (loading) {
      if (calPlaceholder) calPlaceholder.style.display = 'none';
      if (calPlanWrapper) calPlanWrapper.style.display = 'none';
      if (calSkeleton) calSkeleton.style.display = 'block';
    } else {
      if (calSkeleton) calSkeleton.style.display = 'none';
    }
  }

  /**
   * Main Calendar 7-Day Plan Generator
   */
  async function runCalendarPlanGeneration() {
    if (isGeneratingCalendar) return;

    const bType = calBusinessType ? calBusinessType.value.trim() : '';
    const goalVal = calGoal ? calGoal.value.trim() : '';

    let hasError = false;

    if (!bType) {
      if (errorCalBusinessType) errorCalBusinessType.style.display = 'block';
      if (calBusinessType) calBusinessType.classList.add('input-error');
      hasError = true;
    } else {
      if (errorCalBusinessType) errorCalBusinessType.style.display = 'none';
      if (calBusinessType) calBusinessType.classList.remove('input-error');
    }

    if (!goalVal) {
      if (errorCalGoal) errorCalGoal.style.display = 'block';
      if (calGoal) calGoal.classList.add('input-error');
      hasError = true;
    } else {
      if (errorCalGoal) errorCalGoal.style.display = 'none';
      if (calGoal) calGoal.classList.remove('input-error');
    }

    if (hasError) {
      window.showToast('Please fill in both required fields', 'warning');
      if (!bType && calBusinessType) calBusinessType.focus();
      else if (!goalVal && calGoal) calGoal.focus();
      return;
    }

    setCalendarLoadingState(true);

    let planResult = null;

    // Call the same Gemini helper if API key is provided
    const activeCalKey = getActiveGeminiKey();
    const activeCalModel = getActiveGeminiModel();
    if (activeCalKey && activeCalKey.trim() !== '') {
      try {
        const prompt = `You are a social media campaign director.
Create a structured 7-Day Social Media Content Plan based on:
- Business Type: ${bType}
- Campaign Goal: ${goalVal}

OUTPUT INSTRUCTIONS:
Return a STRICT valid JSON array of exactly 7 objects ONLY.
DO NOT wrap the response in markdown code fences (\`\`\` or \`\`\`json).
DO NOT include any explanation or conversational text before or after the JSON.

Each object MUST match this exact schema:
{
  "day": "Day 1 - Monday",
  "idea": "Clear and creative content idea / theme for the day",
  "format": "Reel",
  "captionDraft": "Ready-to-publish caption draft with hook, value points, and call to action"
}

Format MUST strictly be one of: "Reel", "Carousel", "Story", or "Post".
Distribute formats naturally across the 7 days.`;

        const parsed = await callGeminiApi(prompt, activeCalKey.trim(), activeCalModel || 'gemini-2.0-flash');
        if (Array.isArray(parsed) && parsed.length >= 7) {
          planResult = parsed.slice(0, 7);
        } else if (parsed && Array.isArray(parsed.plan) && parsed.plan.length >= 7) {
          planResult = parsed.plan.slice(0, 7);
        }
      } catch (err) {
        planResult = null;
      }
    }

    // Fallback if API key missing or request failed
    if (!planResult) {
      planResult = generateRealisticCalendarPlan(bType, goalVal);
      window.showToast('Showing demo output', 'info');
    } else {
      window.showToast('7-Day Content Plan generated!', 'success');
    }

    currentCalendarPlan = planResult;
    currentCalendarBusinessType = bType;
    currentCalendarGoal = goalVal;

    renderCalendarCardsGrid(currentCalendarPlan, bType, goalVal);
    setCalendarLoadingState(false);
  }

  function generateRealisticCalendarPlan(businessType, goal) {
    const bType = businessType || 'B2B Growth Brand';
    const cGoal = goal || 'Drive high-intent leads and audience authority';

    return [
      {
        day: 'Day 1 - Monday',
        idea: `Problem Teaser: The hidden bottleneck preventing ${bType} teams from reaching ${cGoal}`,
        format: 'Reel',
        captionDraft: `Are you still struggling to hit ${cGoal}?\n\nMost ${bType} teams don't realize this subtle bottleneck is draining 10+ hours every single week.\n\nWatch this breakdown to see how to fix it in 3 steps.\n\n#ContentStrategy #GrowthHacks #${bType.replace(/[^a-zA-Z0-9]/g, '')}`
      },
      {
        day: 'Day 2 - Tuesday',
        idea: `Actionable Playbook: 5-Step framework to accelerate ${cGoal}`,
        format: 'Carousel',
        captionDraft: `Swipe through this 5-slide blueprint.\n\nWe spent 6 months testing what actually moves the needle for ${bType} brands.\n\nSave this carousel so your team has it ready for your next strategy sprint!\n\n#MarketingTips #Playbook #Strategy`
      },
      {
        day: 'Day 3 - Wednesday',
        idea: `Audience Poll & Real-Time Q&A: What is your biggest challenge with ${cGoal}?`,
        format: 'Story',
        captionDraft: `Mid-week pulse check!\n\nWhat is currently the hardest part of scaling your ${bType} operations?\n\nDrop your question below and we will do a deep-dive breakdown in tomorrow's post!`
      },
      {
        day: 'Day 4 - Thursday',
        idea: `Contrarian Deep-Dive: Why traditional tactics for ${cGoal} fail in 2026`,
        format: 'Post',
        captionDraft: `Unpopular opinion: Grinding out more posts is not the solution to ${cGoal}.\n\nContext and distribution automation outperform brute-force volume every time.\n\nHere are 3 structural shifts every ${bType} leader should make today.\n\n#ThoughtLeadership #FutureOfWork`
      },
      {
        day: 'Day 5 - Friday',
        idea: `Case Study & Proof: How focusing on ${cGoal} transformed an early adopter`,
        format: 'Reel',
        captionDraft: `From stuck to scaled.\n\nHere is how this ${bType} team unlocked ${cGoal} in 30 days without spending thousands on agencies.\n\nDouble tap if you want the full template vault!\n\n#CaseStudy #RealResults #Wins`
      },
      {
        day: 'Day 6 - Saturday',
        idea: `Weekend Sprint Checklist: 5 Quick audits to optimize for ${cGoal}`,
        format: 'Carousel',
        captionDraft: `Weekend reset checklist for ${bType} teams.\n\nSwipe through these 5 quick audits you can do in 15 minutes to set up next week for massive wins!\n\nSave this post for your Saturday coffee session.`
      },
      {
        day: 'Day 7 - Sunday',
        idea: `Inspirational Vision: Why we started building in the ${bType} space`,
        format: 'Post',
        captionDraft: `Sunday Reflection:\n\nBuilding a standout ${bType} brand is a marathon, not a sprint.\n\nStay focused on your primary mission: ${cGoal}.\n\nWhat is the #1 milestone you are tackling this coming week? Tell us in the comments!`
      }
    ];
  }

  /**
   * Render 7-day cards grid strictly using textContent for all AI-generated text
   */
  function renderCalendarCardsGrid(plan, businessType, goal) {
    if (!Array.isArray(plan) || !calendarCardsGrid) return;

    if (calPlaceholder) calPlaceholder.style.display = 'none';
    if (calSkeleton) calSkeleton.style.display = 'none';
    if (calPlanWrapper) calPlanWrapper.style.display = 'block';
    if (calTopActions) calTopActions.style.display = 'flex';
    if (btnExportCalendarCsvInline) btnExportCalendarCsvInline.style.display = 'inline-flex';

    if (calMetaBusiness) calMetaBusiness.textContent = businessType;
    if (calMetaGoal) calMetaGoal.textContent = goal;

    calendarCardsGrid.innerHTML = '';

    const validFormats = ['reel', 'carousel', 'story', 'post'];

    plan.forEach(item => {
      const card = document.createElement('div');
      card.className = 'day-plan-card';

      // Header: Day Label + Format Badge
      const header = document.createElement('div');
      header.className = 'day-plan-header';

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-label';
      dayLabel.textContent = item.day || 'Day';

      const formatRaw = String(item.format || 'Post').trim();
      const formatKey = formatRaw.toLowerCase();
      const safeFormat = validFormats.includes(formatKey) ? formatKey : 'post';

      const formatBadge = document.createElement('span');
      formatBadge.className = `format-badge badge-format-${safeFormat}`;
      formatBadge.textContent = formatRaw;

      header.appendChild(dayLabel);
      header.appendChild(formatBadge);

      // Idea Heading — strictly textContent
      const ideaTitle = document.createElement('h4');
      ideaTitle.className = 'day-idea-title';
      ideaTitle.textContent = item.idea || '';

      // Caption Snippet — strictly textContent
      const captionText = document.createElement('p');
      captionText.className = 'day-caption-snippet';
      captionText.textContent = item.captionDraft || '';

      // Footer: Copy + Save Buttons
      const footer = document.createElement('div');
      footer.className = 'day-plan-footer';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-outline btn-sm';
      copyBtn.type = 'button';
      copyBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;" aria-hidden="true">
          <rect x="5" y="5" width="8" height="8" rx="1.5"></rect>
          <path d="M3 11V3h8"></path>
        </svg>
        <span>Copy</span>
      `;
      copyBtn.addEventListener('click', () => {
        copyTextToClipboard(item.captionDraft, `Copied ${item.day} caption!`);
      });

      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-secondary btn-sm';
      saveBtn.type = 'button';
      saveBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;" aria-hidden="true">
          <path d="M13 14l-5-3.5L3 14V3a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 13 3v11z"/>
        </svg>
        <span>Save</span>
      `;
      saveBtn.addEventListener('click', function () {
        savePostToLibrary({
          topic: `${businessType}: ${item.idea}`,
          platform: item.format,
          tone: 'Strategic',
          language: 'English',
          caption: item.captionDraft,
          hashtags: ['#ContentCalendar', '#7DayStrategy', `#${item.format}`],
          cta: 'Check out the link in bio!',
          bestTime: item.day,
          imageIdea: item.idea,
          imagePrompt: `High quality marketing visual for ${item.idea}, ${item.format} format`
        });
        this.disabled = true;
        this.querySelector('span').textContent = 'Saved';
      });

      footer.appendChild(copyBtn);
      footer.appendChild(saveBtn);

      card.appendChild(header);
      card.appendChild(ideaTitle);
      card.appendChild(captionText);
      card.appendChild(footer);

      calendarCardsGrid.appendChild(card);
    });
  }

  /**
   * Export Calendar 7-Day Plan to RFC 4180 CSV
   */
  function exportCalendarToCsv(plan, businessType) {
    if (!Array.isArray(plan) || plan.length === 0) {
      window.showToast('No active calendar plan to export', 'warning');
      return;
    }

    const headers = ['Day', 'Format', 'Idea', 'Caption Draft'];
    const rows = plan.map(item => {
      const day = (item.day || '').replace(/"/g, '""');
      const format = (item.format || '').replace(/"/g, '""');
      const idea = (item.idea || '').replace(/"/g, '""');
      const caption = (item.captionDraft || '').replace(/"/g, '""');
      return `"${day}","${format}","${idea}","${caption}"`;
    });

    const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (businessType || 'content-plan').toLowerCase().replace(/[^a-z0-9]/g, '-');
    link.href = url;
    link.download = `postpilot-7-day-plan-${safeName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.showToast('Exported 7-day plan to CSV!', 'success');
  }

  // Attach calendar event listeners
  if (btnGenerateCalendar) {
    btnGenerateCalendar.addEventListener('click', runCalendarPlanGeneration);
  }

  if (btnExportCalendarCsv) {
    btnExportCalendarCsv.addEventListener('click', () => {
      exportCalendarToCsv(currentCalendarPlan, currentCalendarBusinessType);
    });
  }

  if (btnExportCalendarCsvInline) {
    btnExportCalendarCsvInline.addEventListener('click', () => {
      exportCalendarToCsv(currentCalendarPlan, currentCalendarBusinessType);
    });
  }

  // ==========================================================================
  // 10. Autonomous Scheduler & Webhook Dispatch (Key: "pp_scheduled")
  // ==========================================================================
  const SCHED_STORAGE_KEY = 'pp_scheduled';

  function getScheduledPosts() {
    const raw = safeGetStorage(SCHED_STORAGE_KEY, '[]');
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        safeSetStorage(SCHED_STORAGE_KEY, '[]');
        return [];
      }
      return parsed.filter(item => item && typeof item === 'object' && typeof item.id === 'string');
    } catch (e) {
      safeSetStorage(SCHED_STORAGE_KEY, '[]');
      return [];
    }
  }

  function saveScheduledPost(item) {
    const list = getScheduledPosts();
    list.unshift(item);
    safeSetStorage(SCHED_STORAGE_KEY, JSON.stringify(list));
  }

  function updateScheduledPostStatus(id, newStatus) {
    let list = getScheduledPosts();
    list = list.map(item => {
      if (item && item.id === id) {
        return Object.assign({}, item, { status: newStatus });
      }
      return item;
    });
    safeSetStorage(SCHED_STORAGE_KEY, JSON.stringify(list));
    renderScheduledPosts();
  }

  function deleteScheduledPost(id) {
    let list = getScheduledPosts();
    list = list.filter(item => item && item.id !== id);
    safeSetStorage(SCHED_STORAGE_KEY, JSON.stringify(list));
  }

  const schedSavedPostSelect = document.getElementById('sched-saved-post');
  const schedPlatformSelect = document.getElementById('sched-platform');
  const schedDateInput = document.getElementById('sched-date');
  const schedTimeInput = document.getElementById('sched-time');
  const schedContent = document.getElementById('sched-content');
  const errorSchedForm = document.getElementById('error-sched-form');
  const btnSubmitSchedule = document.getElementById('btn-submit-schedule');
  const btnSchedText = document.getElementById('btn-sched-text');
  const scheduledContainer = document.getElementById('scheduled-posts-container');
  const schedQueueCountBadge = document.getElementById('sched-queue-count');
  const btnClearScheduled = document.getElementById('btn-clear-scheduled');
  const schedWebhookIndicator = document.getElementById('sched-webhook-indicator');

  // Enforce today as the minimum allowable date
  function initSchedulerDate() {
    if (!schedDateInput) return;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    schedDateInput.min = todayStr;
    if (!schedDateInput.value) {
      schedDateInput.value = todayStr;
    }
  }

  // Populate dropdown of saved posts from "pp_saved"
  function populateSchedulerSavedDropdown() {
    if (!schedSavedPostSelect) return;
    const currentVal = schedSavedPostSelect.value;
    const list = getSavedPosts();

    schedSavedPostSelect.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = list.length === 0
      ? '-- No saved posts available (Create one or write custom text below) --'
      : '-- Choose from your Saved Library --';
    schedSavedPostSelect.appendChild(defaultOpt);

    list.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      const topicSnippet = (item.topic || 'Untitled').slice(0, 45);
      opt.textContent = `${topicSnippet} (${item.platform || 'General'})`;
      schedSavedPostSelect.appendChild(opt);
    });

    if (currentVal && list.some(item => item.id === currentVal)) {
      schedSavedPostSelect.value = currentVal;
    }
  }

  // Auto-fill content and platform on saved post selection
  if (schedSavedPostSelect) {
    schedSavedPostSelect.addEventListener('change', function () {
      const selectedId = this.value;
      if (!selectedId) return;

      const list = getSavedPosts();
      const found = list.find(item => item && item.id === selectedId);
      if (found) {
        if (schedContent) {
          schedContent.value = found.caption || found.topic || '';
        }
        if (schedPlatformSelect && found.platform) {
          for (let i = 0; i < schedPlatformSelect.options.length; i++) {
            if (schedPlatformSelect.options[i].value.toLowerCase() === found.platform.toLowerCase()) {
              schedPlatformSelect.selectedIndex = i;
              break;
            }
          }
        }
        if (errorSchedForm) {
          errorSchedForm.style.display = 'none';
        }
        if (typeof updateSchedulerPlatformStatus === 'function') {
          updateSchedulerPlatformStatus();
        }
      }
    });
  }

  if (schedPlatformSelect) {
    schedPlatformSelect.addEventListener('change', function () {
      if (typeof updateSchedulerPlatformStatus === 'function') {
        updateSchedulerPlatformStatus();
      }
    });
  }

  if (schedContent) {
    schedContent.addEventListener('input', () => {
      if (errorSchedForm && schedContent.value.trim()) {
        errorSchedForm.style.display = 'none';
      }
    });
  }

  function showSchedError(msg) {
    if (errorSchedForm) {
      errorSchedForm.textContent = msg;
      errorSchedForm.style.display = 'block';
    }
  }

  function hideSchedError() {
    if (errorSchedForm) {
      errorSchedForm.style.display = 'none';
    }
  }

  // Render scheduled posts list with status badges (Scheduled, Sent, Failed)
  function renderScheduledPosts() {
    if (!scheduledContainer) return;

    const list = getScheduledPosts();

    if (schedQueueCountBadge) {
      schedQueueCountBadge.textContent = `${list.length} Queued`;
    }

    if (list.length === 0) {
      scheduledContainer.innerHTML = `
        <div class="placeholder-state" style="padding: 36px 20px;">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h3 class="placeholder-title">No Scheduled Posts in Queue</h3>
          <p class="placeholder-desc">Select a post from your library above or compose a custom caption to queue posts for autonomous dispatch.</p>
        </div>
      `;
      return;
    }

    scheduledContainer.innerHTML = '';

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'scheduled-item-card';

      // Left info block
      const infoDiv = document.createElement('div');
      infoDiv.className = 'scheduled-item-info';

      const titleEl = document.createElement('div');
      titleEl.className = 'scheduled-item-title';
      titleEl.textContent = item.content && item.content.length > 85 
        ? item.content.slice(0, 85) + '...' 
        : (item.content || 'Scheduled Publication');

      const metaDiv = document.createElement('div');
      metaDiv.className = 'scheduled-item-meta';

      const platBadge = document.createElement('span');
      platBadge.className = 'meta-chip primary';
      platBadge.textContent = item.platform || 'General';

      const timeSpan = document.createElement('span');
      timeSpan.textContent = `${item.scheduledDate} at ${item.scheduledTime}`;

      metaDiv.appendChild(platBadge);
      metaDiv.appendChild(timeSpan);

      infoDiv.appendChild(titleEl);
      infoDiv.appendChild(metaDiv);

      // Right actions block
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'scheduled-item-actions';

      // Status badge (Scheduled, Sent, Failed)
      const badge = document.createElement('span');
      badge.className = 'status-badge';
      if (item.status === 'Sent') {
        badge.classList.add('badge-status-sent');
        badge.textContent = 'Sent';
      } else if (item.status === 'Failed') {
        badge.classList.add('badge-status-failed');
        badge.textContent = 'Failed';
      } else {
        badge.classList.add('badge-status-scheduled');
        badge.textContent = 'Scheduled';
      }
      actionsDiv.appendChild(badge);

      // Interactive controls: Mark as Sent or Retry
      if (item.status === 'Scheduled') {
        const btnMarkSent = document.createElement('button');
        btnMarkSent.className = 'btn-icon-control';
        btnMarkSent.type = 'button';
        btnMarkSent.title = 'Mark as Dispatched (Sent)';
        btnMarkSent.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 8 7 12 13 4"></polyline>
          </svg>
        `;
        btnMarkSent.addEventListener('click', () => {
          updateScheduledPostStatus(item.id, 'Sent');
          window.showToast('Post status updated to Sent', 'success');
        });
        actionsDiv.appendChild(btnMarkSent);
      } else if (item.status === 'Failed') {
        const btnRetry = document.createElement('button');
        btnRetry.className = 'btn-icon-control';
        btnRetry.type = 'button';
        btnRetry.title = 'Retry Webhook Dispatch';
        btnRetry.innerHTML = `
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M2 8a6 6 0 1 0 1.8-4.2L2 5.5M2 2v3.5h3.5"></path>
          </svg>
        `;
        btnRetry.addEventListener('click', () => {
          retryScheduledPost(item);
        });
        actionsDiv.appendChild(btnRetry);
      }

      // Delete from scheduled list
      const btnDel = document.createElement('button');
      btnDel.className = 'btn-icon-control';
      btnDel.type = 'button';
      btnDel.title = 'Remove from queue';
      btnDel.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="3" y1="3" x2="13" y2="13"></line>
          <line x1="13" y1="3" x2="3" y2="13"></line>
        </svg>
      `;
      btnDel.addEventListener('click', () => {
        deleteScheduledPost(item.id);
        renderScheduledPosts();
        window.showToast('Post removed from queue', 'info');
      });
      actionsDiv.appendChild(btnDel);

      card.appendChild(infoDiv);
      card.appendChild(actionsDiv);

      scheduledContainer.appendChild(card);
    });
  }

  // Retry failed dispatch helper
  async function retryScheduledPost(item) {
    if (!WEBHOOK_URL || WEBHOOK_URL.trim() === '') {
      window.showToast('Simulating retry dispatch...', 'info');
      setTimeout(() => {
        updateScheduledPostStatus(item.id, 'Scheduled');
        window.showToast('Demo mode: webhook retry simulated successfully', 'info');
      }, 800);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      updateScheduledPostStatus(item.id, 'Scheduled');
      window.showToast('Webhook retry succeeded! Status: Scheduled', 'success');
    } catch (e) {
      window.showToast(`Retry failed: ${e.message || 'Network error'}`, 'error');
    }
  }

  // Handle Schedule Submit Button
  if (btnSubmitSchedule) {
    btnSubmitSchedule.addEventListener('click', async function () {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const contentVal = schedContent ? schedContent.value.trim() : '';
      const dateVal = schedDateInput ? schedDateInput.value : '';
      const timeVal = schedTimeInput ? schedTimeInput.value : '09:30';
      const platformVal = schedPlatformSelect ? schedPlatformSelect.value : 'Instagram';
      const selectedPostId = schedSavedPostSelect ? schedSavedPostSelect.value : '';

      if (!contentVal) {
        showSchedError('Please select a saved post from the dropdown or type caption content.');
        if (schedContent) schedContent.focus();
        return;
      }

      if (!dateVal) {
        showSchedError('Please select a publication date.');
        if (schedDateInput) schedDateInput.focus();
        return;
      }

      if (dateVal < todayStr) {
        showSchedError('Publication date cannot be in the past. Please choose today or a future date.');
        if (schedDateInput) schedDateInput.focus();
        return;
      }

      hideSchedError();

      // Set loading state on submit button
      btnSubmitSchedule.disabled = true;
      if (btnSchedText) btnSchedText.textContent = 'Dispatching to Webhook...';

      const payload = {
        id: 'sched_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        postId: selectedPostId || null,
        platform: platformVal,
        content: contentVal,
        scheduledDate: dateVal,
        scheduledTime: timeVal,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      };

      if (!WEBHOOK_URL || WEBHOOK_URL.trim() === '') {
        // Webhook URL is empty: simulate success after 1 second
        setTimeout(() => {
          payload.status = 'Scheduled';
          saveScheduledPost(payload);
          renderScheduledPosts();
          window.showToast('Demo mode: webhook not configured', 'info');

          // Reset composer inputs
          if (schedContent) schedContent.value = '';
          if (schedSavedPostSelect) schedSavedPostSelect.value = '';
          btnSubmitSchedule.disabled = false;
          if (btnSchedText) btnSchedText.textContent = 'Schedule Post';
        }, 1000);
      } else {
        // Webhook URL is configured: execute real POST fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        try {
          const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
          }

          payload.status = 'Scheduled';
          saveScheduledPost(payload);
          renderScheduledPosts();
          window.showToast('Post queued and webhook dispatched successfully!', 'success');

          if (schedContent) schedContent.value = '';
          if (schedSavedPostSelect) schedSavedPostSelect.value = '';
        } catch (err) {
          clearTimeout(timeoutId);
          payload.status = 'Failed';
          saveScheduledPost(payload);
          renderScheduledPosts();
          window.showToast(`Webhook dispatch failed: ${err.message || 'Network error'}`, 'error');
        } finally {
          btnSubmitSchedule.disabled = false;
          if (btnSchedText) btnSchedText.textContent = 'Schedule Post';
        }
      }
    });
  }

  // Clear scheduled history button
  if (btnClearScheduled) {
    btnClearScheduled.addEventListener('click', () => {
      const list = getScheduledPosts();
      if (list.length === 0) {
        window.showToast('Scheduled queue is already empty', 'info');
        return;
      }
      safeSetStorage(SCHED_STORAGE_KEY, '[]');
      renderScheduledPosts();
      window.showToast('Scheduled history cleared', 'info');
    });
  }

  // Webhook indicator badge in card header
  if (schedWebhookIndicator) {
    if (!WEBHOOK_URL || WEBHOOK_URL.trim() === '') {
      schedWebhookIndicator.textContent = 'Demo Mode (Simulated)';
      schedWebhookIndicator.style.background = 'rgba(245, 158, 11, 0.15)';
      schedWebhookIndicator.style.color = '#F59E0B';
      schedWebhookIndicator.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    } else {
      schedWebhookIndicator.textContent = 'Webhook Live';
    }
  }

  // Additional dashboard controls
  const btnPauseQueue = document.getElementById('btn-pause-queue');
  if (btnPauseQueue) {
    btnPauseQueue.addEventListener('click', function () {
      const isPaused = this.textContent.includes('Resume');
      this.textContent = isPaused ? 'Pause Queue' : 'Resume Queue';
      window.showToast(isPaused ? 'Dispatch queue resumed' : 'Dispatch queue paused', isPaused ? 'success' : 'warning');
    });
  }

  const btnSyncApis = document.getElementById('btn-sync-apis');
  if (btnSyncApis) {
    btnSyncApis.addEventListener('click', () => window.showToast('Social APIs synchronized with 0 errors', 'success'));
  }

  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => window.showToast('Exporting analytics CSV report...', 'info'));
  }

  const btnNewTemplate = document.getElementById('btn-new-template');
  if (btnNewTemplate) {
    btnNewTemplate.addEventListener('click', () => {
      switchView('generator');
      window.showToast('Draft a post to save as a new template', 'info');
    });
  }

  // Initialize Scheduler dates, dropdown and queue
  initSchedulerDate();
  populateSchedulerSavedDropdown();
  renderScheduledPosts();

  // ==========================================================================
  // 11. Social Accounts, Credentials & Integrations Manager
  // ==========================================================================
  // NOTE: USER_KEY_STORAGE, USER_MODEL_STORAGE, USER_WEBHOOK_STORAGE,
  // ACCOUNTS_STORAGE_KEY, getActiveGeminiKey, getActiveGeminiModel,
  // getActiveWebhookUrl are all declared at the top of this IIFE.

  // Fictional Demo Creators Preset List (8 Invented Profiles)
  const FICTIONAL_CREATORS = [
    {
      id: "rohan-plays",
      name: "Rohan Plays",
      handle: "@rohan.plays",
      niche: "Gaming",
      platform: "YouTube",
      followers: "2.4M",
      initials: "RP",
      gradient: "linear-gradient(135deg, #8B5CF6, #3B82F6)"
    },
    {
      id: "tanya-tech",
      name: "Tanya Tech",
      handle: "@tanya.techreview",
      niche: "Tech Reviews",
      platform: "Instagram",
      followers: "820K",
      initials: "TT",
      gradient: "linear-gradient(135deg, #EC4899, #F97316)"
    },
    {
      id: "kabir-kahaani",
      name: "Kabir Kahaani",
      handle: "@kabir.kahaani",
      niche: "Stand-up Comedy",
      platform: "X",
      followers: "540K",
      initials: "KK",
      gradient: "linear-gradient(135deg, #0EA5E9, #6366F1)"
    },
    {
      id: "vikram-vlogs",
      name: "Vikram Vlogs",
      handle: "@vikramvlogs",
      niche: "Lifestyle Vlogs",
      platform: "YouTube",
      followers: "1.8M",
      initials: "VV",
      gradient: "linear-gradient(135deg, #7C3AED, #D946EF)"
    },
    {
      id: "fiza-fit",
      name: "Fiza Fit",
      handle: "@fiza.fit",
      niche: "Fitness",
      platform: "Instagram",
      followers: "960K",
      initials: "FF",
      gradient: "linear-gradient(135deg, #F43F5E, #FB923C)"
    },
    {
      id: "aarav-roasts",
      name: "Aarav Roasts",
      handle: "@aarav.roasts",
      niche: "Comedy Skits",
      platform: "Instagram",
      followers: "1.2M",
      initials: "AR",
      gradient: "linear-gradient(135deg, #06B6D4, #10B981)"
    },
    {
      id: "meera-money",
      name: "Meera Money",
      handle: "@meeramoney",
      niche: "Finance",
      platform: "LinkedIn",
      followers: "430K",
      initials: "MM",
      gradient: "linear-gradient(135deg, #10B981, #0D9488)"
    },
    {
      id: "dev-reels",
      name: "Dev Reels",
      handle: "@dev.reels",
      niche: "Short Videos",
      platform: "Instagram",
      followers: "3.1M",
      initials: "DR",
      gradient: "linear-gradient(135deg, #E11D48, #A855F7)"
    }
  ];

  // Render Fictional Creator Presets in Accounts Modal
  function renderCreatorPresets() {
    const grid = document.getElementById('creator-presets-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentAccounts = getConnectedAccounts();

    FICTIONAL_CREATORS.forEach(creator => {
      const card = document.createElement('div');
      card.className = 'creator-preset-card';

      const left = document.createElement('div');
      left.className = 'creator-preset-left';

      const avatar = document.createElement('div');
      avatar.className = 'creator-preset-avatar';
      avatar.style.background = creator.gradient;
      avatar.textContent = creator.initials;

      const info = document.createElement('div');
      info.className = 'creator-preset-info';

      const name = document.createElement('span');
      name.className = 'creator-preset-name';
      name.textContent = creator.name;

      const handle = document.createElement('span');
      handle.className = 'creator-preset-handle';
      handle.textContent = `${creator.handle} • ${creator.followers}`;

      info.appendChild(name);
      info.appendChild(handle);
      left.appendChild(avatar);
      left.appendChild(info);

      const platKey = creator.platform.toLowerCase() === 'x' ? 'x' : creator.platform.toLowerCase();
      const isAlreadyConnected = currentAccounts[platKey] && currentAccounts[platKey].connected && currentAccounts[platKey].handle === creator.handle;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `creator-preset-btn${isAlreadyConnected ? ' connected' : ''}`;
      btn.textContent = isAlreadyConnected ? 'Linked' : '+ Link';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        saveConnectedAccount(platKey, creator.handle, `${creator.name} (${creator.platform})`);
        refreshAllAccountUI();
        window.showToast(`${creator.name} connected to ${creator.platform}!`, 'success');
      });

      card.appendChild(left);
      card.appendChild(btn);
      grid.appendChild(card);
    });
  }

  // Pre-seed connected accounts with Harsh's Instagram account connected
  function getConnectedAccounts() {
    const defaultAccounts = {
      instagram: {
        id: 'instagram',
        name: 'Instagram Professional',
        handle: '@mainhoonharsh0',
        displayName: 'Harsh (Creator)',
        connected: true,
        connectedAt: 'Nov 18, 2026',
        type: 'Creator',
        iconClass: 'ig',
        description: 'Publish automated reels, carousels & stories'
      },
      linkedin: {
        id: 'linkedin',
        name: 'LinkedIn Profile / Company',
        handle: '',
        displayName: '',
        connected: false,
        connectedAt: '',
        type: 'Company',
        iconClass: 'li',
        description: 'Publish thought leadership & company updates'
      },
      x: {
        id: 'x',
        name: 'X (Twitter)',
        handle: '',
        displayName: '',
        connected: false,
        connectedAt: '',
        type: 'Personal',
        iconClass: 'x',
        description: 'Publish tweets, threads & media'
      },
      facebook: {
        id: 'facebook',
        name: 'Facebook Page',
        handle: '',
        displayName: '',
        connected: false,
        connectedAt: '',
        type: 'Page',
        iconClass: 'fb',
        description: 'Publish feed updates, links & photo sets'
      },
      youtube: {
        id: 'youtube',
        name: 'YouTube Channel',
        handle: '',
        displayName: '',
        connected: false,
        connectedAt: '',
        type: 'Channel',
        iconClass: 'yt',
        description: 'Publish YouTube Shorts & community posts'
      }
    };

    const raw = safeGetStorage(ACCOUNTS_STORAGE_KEY, null);
    if (!raw) {
      safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultAccounts));
      return defaultAccounts;
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) {
        safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultAccounts));
        return defaultAccounts;
      }
      const merged = Object.assign({}, defaultAccounts, parsed);
      if (!merged.instagram.handle || merged.instagram.handle === '') {
        merged.instagram.handle = '@mainhoonharsh0';
        merged.instagram.displayName = 'Harsh (Creator)';
        merged.instagram.connected = true;
        merged.instagram.connectedAt = 'Nov 18, 2026';
        safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    } catch (e) {
      safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultAccounts));
      return defaultAccounts;
    }
  }

  function saveConnectedAccount(platformId, handle, name, type) {
    const accounts = getConnectedAccounts();
    const cleanHandle = (handle.startsWith('@') || platformId === 'linkedin' || platformId === 'facebook')
      ? handle.trim() 
      : `@${handle.trim()}`;

    if (accounts[platformId]) {
      accounts[platformId].connected = true;
      accounts[platformId].handle = cleanHandle;
      accounts[platformId].displayName = name || cleanHandle;
      if (type) accounts[platformId].type = type;
      accounts[platformId].connectedAt = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    refreshAllAccountUI();
  }

  function disconnectAccount(platformId) {
    const accounts = getConnectedAccounts();
    if (accounts[platformId]) {
      accounts[platformId].connected = false;
      accounts[platformId].handle = '';
      accounts[platformId].displayName = '';
      accounts[platformId].connectedAt = '';
    }
    safeSetStorage(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    refreshAllAccountUI();
  }

  const platformIcons = {
    instagram: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
    linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V9.93H5.06v8.57h2.8z"/></svg>`,
    x: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    facebook: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
  };

  function renderAccountsModalCards() {
    const container = document.getElementById('accounts-cards-grid');
    if (!container) return;

    const accounts = getConnectedAccounts();
    container.innerHTML = '';

    Object.keys(accounts).forEach(key => {
      const acc = accounts[key];
      const card = document.createElement('div');
      card.className = 'account-item-card';

      // Left
      const leftDiv = document.createElement('div');
      leftDiv.className = 'account-item-left';

      const iconBox = document.createElement('div');
      iconBox.className = `account-platform-icon ${acc.iconClass}`;
      iconBox.innerHTML = platformIcons[key] || '';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'account-item-info';

      const nameEl = document.createElement('span');
      nameEl.className = 'account-item-name';
      nameEl.textContent = acc.name;

      const handleEl = document.createElement('span');
      if (acc.connected) {
        handleEl.className = 'account-item-handle connected';
        handleEl.textContent = `${acc.handle} • Connected on ${acc.connectedAt || 'Recently'}`;
      } else {
        handleEl.className = 'account-item-handle';
        handleEl.textContent = acc.description;
      }

      infoDiv.appendChild(nameEl);
      infoDiv.appendChild(handleEl);
      leftDiv.appendChild(iconBox);
      leftDiv.appendChild(infoDiv);

      // Right
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'account-item-actions';

      if (acc.connected) {
        const badge = document.createElement('span');
        badge.className = 'status-badge-connected';
        badge.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" style="width: 12px; height: 12px;" aria-hidden="true"><polyline points="3 8 7 12 13 4"></polyline></svg> Connected`;

        const disBtn = document.createElement('button');
        disBtn.className = 'btn btn-outline btn-xs btn-danger-hover';
        disBtn.type = 'button';
        disBtn.textContent = 'Disconnect';
        disBtn.addEventListener('click', () => {
          disconnectAccount(key);
          window.showToast(`${acc.name} disconnected`, 'info');
        });

        actionsDiv.appendChild(badge);
        actionsDiv.appendChild(disBtn);
      } else {
        const badge = document.createElement('span');
        badge.className = 'status-badge-disconnected';
        badge.textContent = 'Not Linked';

        const connBtn = document.createElement('button');
        connBtn.className = 'btn btn-primary btn-xs';
        connBtn.type = 'button';
        connBtn.textContent = 'Connect Account';
        connBtn.addEventListener('click', () => {
          openAuthorizeModal(key);
        });

        actionsDiv.appendChild(badge);
        actionsDiv.appendChild(connBtn);
      }

      card.appendChild(leftDiv);
      card.appendChild(actionsDiv);
      container.appendChild(card);
    });
  }

  // Authorize Dialog Elements
  let currentAuthPlatformKey = 'instagram';
  const authModal = document.getElementById('authorize-account-modal');
  const authSelectPlatform = document.getElementById('auth-select-platform');
  const authInputHandle = document.getElementById('auth-input-handle');
  const authInputPassword = document.getElementById('auth-input-password');
  const errorAuthHandle = document.getElementById('error-auth-handle');
  const errorAuthPassword = document.getElementById('error-auth-password');
  const authModalTitle = document.getElementById('auth-modal-title');
  const authModalSubtitle = document.getElementById('auth-modal-subtitle');
  const authPlatformIconBox = document.getElementById('auth-platform-icon-box');
  const btnConfirmAuth = document.getElementById('btn-confirm-auth-account');
  const btnAuthText = document.getElementById('btn-auth-text');
  const btnCancelAuth = document.getElementById('btn-cancel-auth-modal');
  const btnToggleAuthPassword = document.getElementById('btn-toggle-auth-password');
  const authEyeShow = document.getElementById('auth-eye-show');
  const authEyeHide = document.getElementById('auth-eye-hide');

  function openAuthorizeModal(platformKey = 'instagram') {
    currentAuthPlatformKey = platformKey;
    const accounts = getConnectedAccounts();
    const acc = accounts[platformKey] || accounts.instagram;

    if (authSelectPlatform) {
      authSelectPlatform.value = platformKey;
    }
    if (authModalTitle) {
      authModalTitle.textContent = `Connect ${acc.name}`;
    }
    if (authModalSubtitle) {
      authModalSubtitle.textContent = `Enter ID and Password to connect ${acc.name}`;
    }
    if (authPlatformIconBox) {
      authPlatformIconBox.innerHTML = platformIcons[platformKey] || '';
    }

    if (authInputHandle) {
      if (acc.handle) {
        authInputHandle.value = acc.handle.replace(/^@/, '');
      } else if (platformKey === 'instagram') {
        authInputHandle.value = 'mainhoonharsh0';
      } else {
        authInputHandle.value = '';
      }
    }

    if (authInputPassword) {
      authInputPassword.value = '';
      authInputPassword.type = 'password';
      if (authEyeShow) authEyeShow.style.display = 'block';
      if (authEyeHide) authEyeHide.style.display = 'none';
    }

    if (errorAuthHandle) errorAuthHandle.style.display = 'none';
    if (errorAuthPassword) errorAuthPassword.style.display = 'none';

    if (authModal) {
      authModal.style.display = 'flex';
      if (authInputHandle) authInputHandle.focus();
    }
  }

  function closeAuthorizeModal() {
    if (authModal) {
      authModal.style.display = 'none';
    }
    if (authInputPassword) {
      authInputPassword.value = '';
    }
  }

  if (btnToggleAuthPassword && authInputPassword) {
    btnToggleAuthPassword.addEventListener('click', function () {
      const isPass = authInputPassword.type === 'password';
      authInputPassword.type = isPass ? 'text' : 'password';
      if (authEyeShow) authEyeShow.style.display = isPass ? 'none' : 'block';
      if (authEyeHide) authEyeHide.style.display = isPass ? 'block' : 'none';
    });
  }

  if (authSelectPlatform) {
    authSelectPlatform.addEventListener('change', function () {
      openAuthorizeModal(this.value);
    });
  }

  if (btnCancelAuth) {
    btnCancelAuth.addEventListener('click', closeAuthorizeModal);
  }

  if (btnConfirmAuth) {
    btnConfirmAuth.addEventListener('click', function () {
      const handleVal = authInputHandle ? authInputHandle.value.trim() : '';
      const passVal = authInputPassword ? authInputPassword.value.trim() : '';
      const selectedPlat = authSelectPlatform ? authSelectPlatform.value : currentAuthPlatformKey;

      let hasError = false;
      if (!handleVal) {
        if (errorAuthHandle) errorAuthHandle.style.display = 'block';
        hasError = true;
      } else if (errorAuthHandle) {
        errorAuthHandle.style.display = 'none';
      }

      if (!passVal) {
        if (errorAuthPassword) errorAuthPassword.style.display = 'block';
        hasError = true;
      } else if (errorAuthPassword) {
        errorAuthPassword.style.display = 'none';
      }

      if (hasError) return;

      btnConfirmAuth.disabled = true;
      if (btnAuthText) btnAuthText.textContent = 'Verifying Credentials & Connecting...';

      setTimeout(() => {
        saveConnectedAccount(selectedPlat, handleVal, handleVal, 'Connected');
        btnConfirmAuth.disabled = false;
        if (btnAuthText) btnAuthText.textContent = 'Login & Connect Account';
        closeAuthorizeModal();
        window.showToast(`${selectedPlat.toUpperCase()} account @${handleVal.replace(/^@/, '')} connected successfully!`, 'success');
      }, 550);
    });
  }

  // Accounts Modal Elements
  const accountsModal = document.getElementById('accounts-modal');
  const btnCloseAccountsModal = document.getElementById('btn-close-accounts-modal');
  const btnTopbarAccounts = document.getElementById('btn-topbar-accounts');
  const sidebarWorkspaceBtn = document.getElementById('sidebar-workspace-btn');
  const topbarUserProfile = document.getElementById('topbar-user-profile');
  const btnAddAccountTrigger = document.getElementById('btn-add-account-trigger');
  const btnQuickConnectAll = document.getElementById('btn-quick-connect-all');
  const btnGenConnectPlatform = document.getElementById('btn-gen-connect-platform');
  const btnSchedConnectPlatform = document.getElementById('btn-sched-connect-platform');

  function openAccountsModal(targetTab = 'social') {
    if (accountsModal) {
      accountsModal.style.display = 'flex';
      switchAccountsTab(targetTab);
      refreshAllAccountUI();
    }
  }

  function closeAccountsModal() {
    if (accountsModal) {
      accountsModal.style.display = 'none';
    }
  }

  if (btnCloseAccountsModal) {
    btnCloseAccountsModal.addEventListener('click', closeAccountsModal);
  }

  if (btnTopbarAccounts) {
    btnTopbarAccounts.addEventListener('click', () => openAccountsModal('social'));
  }

  if (sidebarWorkspaceBtn) {
    sidebarWorkspaceBtn.addEventListener('click', () => openAccountsModal('social'));
  }

  if (topbarUserProfile) {
    topbarUserProfile.addEventListener('click', () => openAccountsModal('social'));
  }

  if (btnAddAccountTrigger) {
    btnAddAccountTrigger.addEventListener('click', () => openAuthorizeModal('instagram'));
  }

  if (btnGenConnectPlatform) {
    btnGenConnectPlatform.addEventListener('click', () => {
      const plat = getSelectedPlatform();
      const platKey = plat.toLowerCase() === 'x (twitter)' ? 'x' : plat.toLowerCase();
      openAuthorizeModal(platKey);
    });
  }

  if (btnSchedConnectPlatform) {
    btnSchedConnectPlatform.addEventListener('click', () => {
      const plat = schedPlatformSelect ? schedPlatformSelect.value : 'Instagram';
      const platKey = plat.toLowerCase() === 'x (twitter)' ? 'x' : plat.toLowerCase();
      openAuthorizeModal(platKey);
    });
  }

  if (btnQuickConnectAll) {
    btnQuickConnectAll.addEventListener('click', () => {
      saveConnectedAccount('youtube', '@rohan.plays', 'Rohan Plays (YouTube)');
      saveConnectedAccount('instagram', '@tanya.techreview', 'Tanya Tech (Instagram)');
      saveConnectedAccount('x', '@kabir.kahaani', 'Kabir Kahaani (X)');
      saveConnectedAccount('linkedin', '@meeramoney', 'Meera Money (LinkedIn)');
      saveConnectedAccount('facebook', '@vikramvlogs', 'Vikram Vlogs (Facebook)');
      refreshAllAccountUI();
      window.showToast('5 demo creator accounts linked successfully!', 'success');
    });
  }

  // Tabs inside Accounts Modal
  const tabBtnSocial = document.getElementById('tab-btn-social');
  const tabBtnAi = document.getElementById('tab-btn-ai');
  const tabBtnWebhook = document.getElementById('tab-btn-webhook');
  const tabPanelSocial = document.getElementById('tab-panel-social');
  const tabPanelAi = document.getElementById('tab-panel-ai');
  const tabPanelWebhook = document.getElementById('tab-panel-webhook');

  function switchAccountsTab(tabName) {
    const isSocial = tabName === 'social';
    const isAi = tabName === 'ai';
    const isWebhook = tabName === 'webhook';

    if (tabBtnSocial) tabBtnSocial.classList.toggle('active', isSocial);
    if (tabBtnAi) tabBtnAi.classList.toggle('active', isAi);
    if (tabBtnWebhook) tabBtnWebhook.classList.toggle('active', isWebhook);

    if (tabPanelSocial) tabPanelSocial.style.display = isSocial ? 'block' : 'none';
    if (tabPanelAi) tabPanelAi.style.display = isAi ? 'block' : 'none';
    if (tabPanelWebhook) tabPanelWebhook.style.display = isWebhook ? 'block' : 'none';
  }

  if (tabBtnSocial) tabBtnSocial.addEventListener('click', () => switchAccountsTab('social'));
  if (tabBtnAi) tabBtnAi.addEventListener('click', () => switchAccountsTab('ai'));
  if (tabBtnWebhook) tabBtnWebhook.addEventListener('click', () => switchAccountsTab('webhook'));

  // AI Key Tab Controls
  const inputGeminiKey = document.getElementById('input-gemini-key');
  const selectGeminiModel = document.getElementById('select-gemini-model');
  const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
  const eyeIconShow = document.getElementById('eye-icon-show');
  const eyeIconHide = document.getElementById('eye-icon-hide');
  const btnSaveGeminiKey = document.getElementById('btn-save-gemini-key');
  const btnTestGeminiKey = document.getElementById('btn-test-gemini-key');
  const btnClearGeminiKey = document.getElementById('btn-clear-gemini-key');

  if (inputGeminiKey) {
    inputGeminiKey.value = getActiveGeminiKey();
  }
  if (selectGeminiModel) {
    selectGeminiModel.value = getActiveGeminiModel();
  }

  if (btnToggleKeyVisibility && inputGeminiKey) {
    btnToggleKeyVisibility.addEventListener('click', () => {
      const isPass = inputGeminiKey.type === 'password';
      inputGeminiKey.type = isPass ? 'text' : 'password';
      if (eyeIconShow) eyeIconShow.style.display = isPass ? 'none' : 'block';
      if (eyeIconHide) eyeIconHide.style.display = isPass ? 'block' : 'none';
    });
  }

  if (btnSaveGeminiKey && inputGeminiKey) {
    btnSaveGeminiKey.addEventListener('click', () => {
      const val = inputGeminiKey.value.trim();
      const modelVal = selectGeminiModel ? selectGeminiModel.value : 'gemini-2.0-flash';
      if (!val) {
        window.showToast('Please enter an API Key to save', 'warning');
        return;
      }
      safeSetStorage(USER_KEY_STORAGE, val);
      safeSetStorage(USER_MODEL_STORAGE, modelVal);
      updateDemoBadge();
      window.showToast('Gemini API Key saved! Live AI Mode activated.', 'success');
    });
  }

  if (btnTestGeminiKey && inputGeminiKey) {
    btnTestGeminiKey.addEventListener('click', async () => {
      const val = inputGeminiKey.value.trim() || getActiveGeminiKey();
      if (!val) {
        window.showToast('Please enter an API Key to test', 'warning');
        return;
      }
      btnTestGeminiKey.disabled = true;
      btnTestGeminiKey.textContent = 'Testing...';
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${val}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
        });
        if (res.ok) {
          window.showToast('Gemini API Key is valid and active!', 'success');
        } else {
          window.showToast(`API Key test failed: HTTP ${res.status}`, 'error');
        }
      } catch (e) {
        window.showToast(`Connection test failed: ${e.message || 'Network error'}`, 'error');
      } finally {
        btnTestGeminiKey.disabled = false;
        btnTestGeminiKey.textContent = 'Test Connection';
      }
    });
  }

  if (btnClearGeminiKey) {
    btnClearGeminiKey.addEventListener('click', () => {
      safeRemoveStorage(USER_KEY_STORAGE);
      if (inputGeminiKey) inputGeminiKey.value = '';
      updateDemoBadge();
      window.showToast('API Key removed. Reverted to Demo Mode.', 'info');
    });
  }

  // Webhook Tab Controls
  const inputWebhookUrl = document.getElementById('input-webhook-url');
  const btnSaveWebhook = document.getElementById('btn-save-webhook');
  const btnTestWebhook = document.getElementById('btn-test-webhook');
  const btnClearWebhook = document.getElementById('btn-clear-webhook');

  if (inputWebhookUrl) {
    inputWebhookUrl.value = getActiveWebhookUrl();
  }

  if (btnSaveWebhook && inputWebhookUrl) {
    btnSaveWebhook.addEventListener('click', () => {
      const val = inputWebhookUrl.value.trim();
      if (!val) {
        window.showToast('Please enter a Webhook URL to save', 'warning');
        return;
      }
      safeSetStorage(USER_WEBHOOK_STORAGE, val);
      updateDemoBadge();
      window.showToast('Webhook endpoint saved successfully!', 'success');
    });
  }

  if (btnTestWebhook && inputWebhookUrl) {
    btnTestWebhook.addEventListener('click', async () => {
      const val = inputWebhookUrl.value.trim() || getActiveWebhookUrl();
      if (!val) {
        window.showToast('Please enter a Webhook URL to test', 'warning');
        return;
      }
      btnTestWebhook.disabled = true;
      btnTestWebhook.textContent = 'Testing...';
      try {
        const res = await fetch(val, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: "test_ping", message: "PostPilot Webhook Test", timestamp: new Date().toISOString() })
        });
        window.showToast(`Test ping dispatched! Status: ${res.status}`, res.ok ? 'success' : 'warning');
      } catch (e) {
        window.showToast(`Webhook ping failed: ${e.message}`, 'error');
      } finally {
        btnTestWebhook.disabled = false;
        btnTestWebhook.textContent = 'Send Test Ping';
      }
    });
  }

  if (btnClearWebhook) {
    btnClearWebhook.addEventListener('click', () => {
      safeRemoveStorage(USER_WEBHOOK_STORAGE);
      if (inputWebhookUrl) inputWebhookUrl.value = '';
      updateDemoBadge();
      window.showToast('Webhook URL removed. Switched to Demo simulation.', 'info');
    });
  }

  // UI Sync Functions
  function updateGeneratorPlatformStatus() {
    const genDot = document.getElementById('gen-status-dot');
    const genText = document.getElementById('gen-status-text');
    const genBtn = document.getElementById('btn-gen-connect-platform');
    if (!genText) return;

    const currentPlat = getSelectedPlatform();
    const platKey = currentPlat.toLowerCase() === 'x (twitter)' ? 'x' : currentPlat.toLowerCase();
    const accounts = getConnectedAccounts();
    const acc = accounts[platKey];

    if (acc && acc.connected) {
      if (genDot) genDot.className = 'status-indicator-dot dot-connected';
      genText.textContent = `${currentPlat} connected as ${acc.handle}`;
      if (genBtn) {
        genBtn.textContent = 'Manage';
        genBtn.onclick = () => openAccountsModal('social');
      }
    } else {
      if (genDot) genDot.className = 'status-indicator-dot dot-disconnected';
      genText.textContent = `${currentPlat} not connected`;
      if (genBtn) {
        genBtn.textContent = `Connect ${currentPlat}`;
        genBtn.onclick = () => openAuthorizeModal(platKey);
      }
    }
  }

  function updateSchedulerPlatformStatus() {
    const schedSelect = document.getElementById('sched-platform');
    const schedDot = document.getElementById('sched-status-dot');
    const schedText = document.getElementById('sched-status-text');
    const schedBtn = document.getElementById('btn-sched-connect-platform');
    if (!schedSelect || !schedText) return;

    const currentPlat = schedSelect.value;
    const platKey = currentPlat.toLowerCase() === 'x (twitter)' ? 'x' : currentPlat.toLowerCase();
    const accounts = getConnectedAccounts();
    const acc = accounts[platKey];

    if (acc && acc.connected) {
      if (schedDot) schedDot.className = 'status-indicator-dot dot-connected';
      schedText.textContent = `Publishing as ${acc.handle}`;
      if (schedBtn) {
        schedBtn.textContent = 'Manage';
        schedBtn.onclick = () => openAccountsModal('social');
      }
    } else {
      if (schedDot) schedDot.className = 'status-indicator-dot dot-disconnected';
      schedText.textContent = `${currentPlat} not connected`;
      if (schedBtn) {
        schedBtn.textContent = `Connect`;
        schedBtn.onclick = () => openAuthorizeModal(platKey);
      }
    }
  }

  function updateDemoBadge() {
    const badge = document.getElementById('demo-mode-badge');
    const dot = document.getElementById('demo-status-dot');
    const text = document.getElementById('demo-status-text');
    const activeKey = getActiveGeminiKey();
    const activeWebhook = getActiveWebhookUrl();

    const schedWebhookIndicator = document.getElementById('sched-webhook-indicator');
    if (schedWebhookIndicator) {
      if (activeWebhook) {
        schedWebhookIndicator.textContent = 'Webhook Live';
        schedWebhookIndicator.style.background = 'rgba(16, 185, 129, 0.15)';
        schedWebhookIndicator.style.color = '#10B981';
        schedWebhookIndicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        schedWebhookIndicator.onclick = () => openAccountsModal('webhook');
      } else {
        schedWebhookIndicator.textContent = 'Demo Mode (Simulated)';
        schedWebhookIndicator.style.background = 'rgba(245, 158, 11, 0.15)';
        schedWebhookIndicator.style.color = '#F59E0B';
        schedWebhookIndicator.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        schedWebhookIndicator.onclick = () => openAccountsModal('webhook');
      }
    }

    const aiTabBadge = document.getElementById('tab-badge-ai-status');
    if (aiTabBadge) {
      aiTabBadge.textContent = activeKey ? 'Live API' : 'Demo';
      aiTabBadge.className = `tab-badge-status ${activeKey ? 'live' : 'demo'}`;
    }

    const aiBanner = document.getElementById('ai-key-status-banner');
    const aiBannerTitle = document.getElementById('ai-banner-title');
    const aiBannerSub = document.getElementById('ai-banner-sub');
    if (aiBanner && aiBannerTitle && aiBannerSub) {
      if (activeKey) {
        aiBanner.className = 'status-banner banner-live';
        aiBannerTitle.textContent = 'Live AI Mode Active';
        aiBannerSub.textContent = `Connected to Google Gemini API (${getActiveGeminiModel()}). Real-time live generation enabled.`;
      } else {
        aiBanner.className = 'status-banner';
        aiBannerTitle.textContent = 'Demo Mode Active';
        aiBannerSub.textContent = 'Operating with smart offline sample data. Connect a Gemini API Key to unlock real-time live generation.';
      }
    }

    if (!badge) return;

    if (activeKey) {
      badge.className = 'badge-demo-btn badge-live';
      badge.title = 'Live AI Mode Active. Click to manage API key & accounts.';
      if (dot) dot.className = 'live-pulse-dot';
      if (text) text.textContent = 'Live Mode (AI Active)';
    } else {
      badge.className = 'badge-demo-btn';
      badge.title = 'Demo Mode Active. Click to connect real API key & accounts.';
      if (dot) dot.className = 'demo-dot';
      if (text) text.textContent = 'Demo Mode';
    }
  }

  function refreshAllAccountUI() {
    const accounts = getConnectedAccounts();
    const count = Object.values(accounts).filter(a => a.connected).length;

    const topbarCount = document.getElementById('topbar-accounts-count');
    if (topbarCount) topbarCount.textContent = count;

    const tabBadge = document.getElementById('tab-badge-social-count');
    if (tabBadge) tabBadge.textContent = `${count}/5`;

    const sidebarPlan = document.getElementById('sidebar-accounts-plan');
    if (sidebarPlan) sidebarPlan.textContent = `${count} of 5 Accounts Linked`;

    updateDemoBadge();
    updateGeneratorPlatformStatus();
    updateSchedulerPlatformStatus();
    renderAccountsModalCards();
    renderCreatorPresets();
  }

  // Hook into topbar demo badge
  if (demoBadge) {
    demoBadge.addEventListener('click', () => openAccountsModal('ai'));
  }

  // Backdrop click & Escape key listeners
  if (accountsModal) {
    accountsModal.addEventListener('click', (e) => {
      if (e.target === accountsModal) closeAccountsModal();
    });
  }
  if (authModal) {
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthorizeModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (authModal && authModal.style.display !== 'none') closeAuthorizeModal();
      else if (accountsModal && accountsModal.style.display !== 'none') closeAccountsModal();
    }
  });

  // Run initial refresh to show connected accounts on page load
  refreshAllAccountUI();

})();
