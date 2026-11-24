/**
 * PostPilot AI — Modern Vanilla JavaScript (Creator Economy Edition)
 * Zero Frameworks • Accessible • Performant • Zero Console Errors
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Fictional Demo Creators Dataset (8 Invented Creator Profiles)
  // No real people, no real photos — only gradient initials & illustrated badges
  // ==========================================================================
  const FICTIONAL_CREATORS = [
    {
      id: "rohan-plays",
      name: "Rohan Plays",
      handle: "@rohan.plays",
      niche: "Gaming",
      platform: "YouTube",
      followers: "2.4M",
      growth: "+18.4% this month",
      initials: "RP",
      gradient: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
      platformClass: "yt",
      platformBadge: "YouTube Partner",
      stats: {
        reach: "4.8M",
        posts: 14,
        engagement: "8.6%",
        chartBars: [45, 62, 58, 75, 84, 92, 98],
        chartNote: "Peak reach window detected: Tuesday & Saturday 6:00 PM - 9:30 PM."
      },
      scheduledQueue: [
        { title: "God of War Ragnarök final boss no-damage run", time: "Tomorrow, 6:00 PM • YouTube Longform" },
        { title: "Top 5 graphics settings every PC gamer must tweak", time: "Friday, 4:30 PM • YouTube Shorts" },
        { title: "Live Stream: Community Custom Lobby Matches", time: "Sunday, 8:00 PM • YouTube Live" }
      ],
      captionDraft: "We spent 48 hours grinding the hardest boss in Elden Ring so you don't have to break your controller. Drop your favorite build in the comments below!"
    },
    {
      id: "tanya-tech",
      name: "Tanya Tech",
      handle: "@tanya.techreview",
      niche: "Tech Reviews",
      platform: "Instagram",
      followers: "820K",
      growth: "+24.1% this month",
      initials: "TT",
      gradient: "linear-gradient(135deg, #EC4899, #F97316)",
      platformClass: "ig",
      platformBadge: "Instagram Verified",
      stats: {
        reach: "1.9M",
        posts: 18,
        engagement: "7.2%",
        chartBars: [35, 52, 65, 78, 72, 88, 94],
        chartNote: "Peak reach window detected: Weekdays at 11:30 AM & 7:15 PM."
      },
      scheduledQueue: [
        { title: "iPhone 16 Pro vs S25 Ultra camera blind test comparison", time: "Today, 7:15 PM • Instagram Reel" },
        { title: "5 AI tools that replaced my entire design stack", time: "Tomorrow, 11:00 AM • Carousel (8 Slides)" },
        { title: "Weekend Desk Setup Tour & Ergonomic Cable Management", time: "Saturday, 6:00 PM • Story Series" }
      ],
      captionDraft: "I tested both flagship cameras side-by-side in low light for 7 days. You won't guess which sensor won night mode. Swipe for RAW crops!"
    },
    {
      id: "kabir-kahaani",
      name: "Kabir Kahaani",
      handle: "@kabir.kahaani",
      niche: "Stand-up Comedy",
      platform: "X",
      followers: "540K",
      growth: "+14.8% this month",
      initials: "KK",
      gradient: "linear-gradient(135deg, #0EA5E9, #6366F1)",
      platformClass: "x",
      platformBadge: "X Creator",
      stats: {
        reach: "1.2M",
        posts: 26,
        engagement: "9.4%",
        chartBars: [50, 55, 68, 72, 85, 90, 86],
        chartNote: "Peak reach window detected: Thursday & Friday evenings 8:00 PM - 11:00 PM."
      },
      scheduledQueue: [
        { title: "Why does every HR email sound like a ransom note? A thread.", time: "Today, 9:00 PM • X Thread" },
        { title: "Weekend plans vs Reality (illustrated with graphs)", time: "Friday, 1:00 PM • Micro Post" }
      ],
      captionDraft: "Nobody: Absolutely nobody: Middle management scheduling a 9 AM Monday alignment call about why meetings are unproductive."
    },
    {
      id: "vikram-vlogs",
      name: "Vikram Vlogs",
      handle: "@vikramvlogs",
      niche: "Lifestyle Vlogs",
      platform: "YouTube",
      followers: "1.8M",
      growth: "+22.5% this month",
      initials: "VV",
      gradient: "linear-gradient(135deg, #7C3AED, #D946EF)",
      platformClass: "yt",
      platformBadge: "YouTube Partner",
      stats: {
        reach: "3.6M",
        posts: 12,
        engagement: "8.1%",
        chartBars: [40, 58, 62, 78, 86, 92, 95],
        chartNote: "Peak reach window detected: Sunday afternoons 4:00 PM - 7:00 PM."
      },
      scheduledQueue: [
        { title: "Solo camping in Spiti Valley at -15°C. Full 4K documentary.", time: "Sunday, 5:00 PM • YouTube Premiere" }
      ],
      captionDraft: "30 days in the trans-Himalayas changed my entire view on minimalism. Here are the 5 life lessons I brought back down to the city."
    },
    {
      id: "fiza-fit",
      name: "Fiza Fit",
      handle: "@fiza.fit",
      niche: "Fitness",
      platform: "Instagram",
      followers: "960K",
      growth: "+31.2% this month",
      initials: "FF",
      gradient: "linear-gradient(135deg, #F43F5E, #FB923C)",
      platformClass: "ig",
      platformBadge: "Instagram Creator",
      stats: {
        reach: "2.8M",
        posts: 21,
        engagement: "11.2%",
        chartBars: [55, 65, 75, 82, 88, 95, 100],
        chartNote: "Peak reach window detected: Early mornings 6:30 AM - 8:30 AM & lunchtime."
      },
      scheduledQueue: [
        { title: "15-minute kettlebell burner for creators who sit all day", time: "Today, 8:00 AM • Instagram Reel" },
        { title: "Vegetarian high-protein meal prep under 20 mins", time: "Wednesday, 12:30 PM • Carousel (6 Slides)" },
        { title: "Morning mobility routine for tight hips & lower back", time: "Friday, 7:00 AM • Instagram Reel" }
      ],
      captionDraft: "Sitting at a desk editing video for 10 hours straight destroys your hip flexors. Do these 3 simple stretches before you sleep tonight!"
    },
    {
      id: "aarav-roasts",
      name: "Aarav Roasts",
      handle: "@aarav.roasts",
      niche: "Comedy Skits",
      platform: "Instagram",
      followers: "1.2M",
      growth: "+19.0% this month",
      initials: "AR",
      gradient: "linear-gradient(135deg, #06B6D4, #10B981)",
      platformClass: "ig",
      platformBadge: "Instagram Creator",
      stats: {
        reach: "3.1M",
        posts: 24,
        engagement: "12.8%",
        chartBars: [60, 70, 75, 85, 90, 96, 92],
        chartNote: "Peak reach window detected: Daily 8:00 PM - 10:30 PM."
      },
      scheduledQueue: [
        { title: "Types of people in a Zoom meeting when someone says 'Can you hear me?'", time: "Tonight, 8:30 PM • Instagram Reel" }
      ],
      captionDraft: "Tag that one coworker whose microphone sounds like they are broadcasting live from inside a wind tunnel."
    },
    {
      id: "meera-money",
      name: "Meera Money",
      handle: "@meeramoney",
      niche: "Finance",
      platform: "LinkedIn",
      followers: "430K",
      growth: "+27.4% this month",
      initials: "MM",
      gradient: "linear-gradient(135deg, #10B981, #0D9488)",
      platformClass: "li",
      platformBadge: "Top Voice",
      stats: {
        reach: "980K",
        posts: 15,
        engagement: "6.8%",
        chartBars: [40, 52, 60, 72, 80, 85, 90],
        chartNote: "Peak reach window detected: Tuesday - Thursday mornings 7:45 AM - 9:30 AM."
      },
      scheduledQueue: [
        { title: "The 3 biggest tax deductions Indian freelance creators miss out on", time: "Tomorrow, 8:00 AM • LinkedIn Article" }
      ],
      captionDraft: "Most digital creators pay 20% more tax than they legally owe simply because they don't claim home office hardware and software subscriptions."
    },
    {
      id: "dev-reels",
      name: "Dev Reels",
      handle: "@dev.reels",
      niche: "Short Videos",
      platform: "Instagram",
      followers: "3.1M",
      growth: "+38.5% this month",
      initials: "DR",
      gradient: "linear-gradient(135deg, #E11D48, #A855F7)",
      platformClass: "ig",
      platformBadge: "Instagram Creator",
      stats: {
        reach: "6.4M",
        posts: 32,
        engagement: "14.1%",
        chartBars: [70, 75, 82, 89, 94, 98, 100],
        chartNote: "Peak reach window detected: Daily 6:00 PM - 9:00 PM."
      },
      scheduledQueue: [
        { title: "How to edit cinematic reels on your phone without expensive gear", time: "Today, 6:00 PM • Instagram Reel" }
      ],
      captionDraft: "Stop shooting flat video. Here is the 3-point lighting formula I use to get 1M+ views on mobile video edits with just a window."
    }
  ];

  // Expose fictional creators globally for app.js sync
  window.FICTIONAL_CREATORS = FICTIONAL_CREATORS;

  // ==========================================================================
  // 2. Theme Management (Dark / Light)
  // ==========================================================================
  const THEME_STORAGE_KEY = 'postpilot_theme';
  const rootElement = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');

  function getPreferredTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch (e) {}
    return 'dark'; // Dark cinematic default
  }

  function setTheme(theme) {
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
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {}
  }

  const initialTheme = getPreferredTheme();
  setTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function () {
      const currentTheme = rootElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      setTheme(nextTheme);
    });
  }

  // ==========================================================================
  // 3. Mobile Navigation Drawer (Hamburger Menu)
  // ==========================================================================
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  function openNavMenu() {
    if (!navMenu || !hamburgerBtn) return;
    navMenu.classList.add('open');
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeNavMenu() {
    if (!navMenu || !hamburgerBtn) return;
    navMenu.classList.remove('open');
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) closeNavMenu();
      else openNavMenu();
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', closeNavMenu);
    });

    document.addEventListener('click', function (e) {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeNavMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeNavMenu();
        hamburgerBtn.focus();
      }
    });
  }

  // ==========================================================================
  // 4. Sample Creator Dashboards Interactive Tab Switcher
  // ==========================================================================
  const creatorTabButtons = document.querySelectorAll('.creator-tab-btn');
  const previewWorkspaceTitle = document.getElementById('preview-workspace-title');
  const previewAvatar = document.getElementById('preview-avatar');
  const previewCreatorName = document.getElementById('preview-creator-name');
  const previewPlatformBadge = document.getElementById('preview-platform-badge');
  const previewCreatorHandle = document.getElementById('preview-creator-handle');
  const previewGrowthVal = document.getElementById('preview-growth-val');
  const statReachVal = document.getElementById('stat-reach-val');
  const statPostsVal = document.getElementById('stat-posts-val');
  const statEngVal = document.getElementById('stat-eng-val');
  const mockupChartBars = document.getElementById('mockup-chart-bars');
  const chartFooterCaption = document.getElementById('chart-footer-caption');
  const queueMiniList = document.getElementById('queue-mini-list');
  const previewCaptionDraft = document.getElementById('preview-caption-draft');

  function updateSampleDashboard(creatorId) {
    const creator = FICTIONAL_CREATORS.find(c => c.id === creatorId);
    if (!creator) return;

    // Update Tab states
    creatorTabButtons.forEach(btn => {
      const isCurrent = btn.getAttribute('data-creator') === creatorId;
      btn.classList.toggle('active', isCurrent);
      btn.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    // Animate preview transition
    const previewWrapper = document.getElementById('dashboard-preview-panel');
    if (previewWrapper) {
      previewWrapper.style.opacity = '0.5';
      previewWrapper.style.transform = 'scale(0.99)';
    }

    setTimeout(() => {
      if (previewWorkspaceTitle) {
        previewWorkspaceTitle.textContent = `PostPilot Workspace — ${creator.name} (${creator.platform})`;
      }
      if (previewAvatar) {
        previewAvatar.textContent = creator.initials;
        previewAvatar.style.background = creator.gradient;
      }
      if (previewCreatorName) previewCreatorName.textContent = creator.name;
      if (previewPlatformBadge) {
        previewPlatformBadge.textContent = creator.platformBadge;
        previewPlatformBadge.className = `preview-platform-badge ${creator.platformClass}`;
      }
      if (previewCreatorHandle) {
        previewCreatorHandle.textContent = `${creator.handle} • ${creator.niche} Niche • ${creator.followers} ${creator.platform === 'YouTube' ? 'Subscribers' : 'Followers'}`;
      }
      if (previewGrowthVal) previewGrowthVal.textContent = creator.growth;
      if (statReachVal) statReachVal.textContent = creator.stats.reach;
      if (statPostsVal) statPostsVal.textContent = creator.stats.posts;
      if (statEngVal) statEngVal.textContent = creator.stats.engagement;
      if (chartFooterCaption) chartFooterCaption.textContent = creator.stats.chartNote;
      if (previewCaptionDraft) previewCaptionDraft.textContent = `"${creator.captionDraft}"`;

      // Update Chart bars
      if (mockupChartBars && Array.isArray(creator.stats.chartBars)) {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        mockupChartBars.innerHTML = '';
        creator.stats.chartBars.forEach((pct, idx) => {
          const group = document.createElement('div');
          const isHighest = pct === Math.max(...creator.stats.chartBars);
          group.className = `chart-bar-group${isHighest ? ' active' : ''}`;

          const fill = document.createElement('div');
          fill.className = 'chart-bar-fill';
          fill.style.height = `${pct}%`;

          const label = document.createElement('span');
          label.className = 'chart-bar-day';
          label.textContent = days[idx] || '';

          group.appendChild(fill);
          group.appendChild(label);
          mockupChartBars.appendChild(group);
        });
      }

      // Update Scheduled Queue
      if (queueMiniList && Array.isArray(creator.scheduledQueue)) {
        queueMiniList.innerHTML = '';
        creator.scheduledQueue.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.className = 'queue-mini-item';

          const dot = document.createElement('div');
          dot.className = 'queue-status-dot scheduled';

          const content = document.createElement('div');
          content.className = 'queue-item-content';

          const title = document.createElement('span');
          title.className = 'queue-item-title';
          title.textContent = item.title;

          const time = document.createElement('span');
          time.className = 'queue-item-time';
          time.textContent = item.time;

          content.appendChild(title);
          content.appendChild(time);
          itemEl.appendChild(dot);
          itemEl.appendChild(content);
          queueMiniList.appendChild(itemEl);
        });
      }

      if (previewWrapper) {
        previewWrapper.style.opacity = '1';
        previewWrapper.style.transform = 'scale(1)';
        previewWrapper.style.transition = 'opacity 300ms ease, transform 300ms ease';
      }
    }, 120);
  }

  creatorTabButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const creatorId = this.getAttribute('data-creator');
      if (creatorId) updateSampleDashboard(creatorId);
    });
  });

  // ==========================================================================
  // 5. Watch Demo Button Handler (Smooth scroll & highlight)
  // ==========================================================================
  const btnHeroWatchDemo = document.getElementById('btn-hero-watch-demo');
  if (btnHeroWatchDemo) {
    btnHeroWatchDemo.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.getElementById('sample-dashboards');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const frame = target.querySelector('.mockup-frame');
        if (frame) {
          frame.style.boxShadow = '0 0 50px rgba(168, 85, 247, 0.6)';
          setTimeout(() => {
            frame.style.boxShadow = '';
          }, 1800);
        }
      }
    });
  }

  // ==========================================================================
  // 6. Smooth 3D Card Tilt Micro-Interaction
  // ==========================================================================
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const tiltElements = document.querySelectorAll('[data-tilt]');

    tiltElements.forEach(el => {
      el.addEventListener('mousemove', function (e) {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        const rotateX = -deltaY * 6; // max 6 deg
        const rotateY = deltaX * 6;

        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
        el.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
      });

      el.addEventListener('mouseenter', function () {
        el.style.transition = 'transform 100ms ease-out';
      });
    });
  }

  // ==========================================================================
  // 7. Scroll-Triggered Fade-In Animations (IntersectionObserver)
  // ==========================================================================
  const fadeElements = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach(function (el) {
      scrollObserver.observe(el);
    });
  } else {
    fadeElements.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // ==========================================================================
  // 8. FAQ Accordion (Accessible & Smooth Collapse/Expand)
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const trigger = item.querySelector('.faq-trigger');
    const content = item.querySelector('.faq-content');

    if (!trigger || !content) return;

    trigger.addEventListener('click', function () {
      const isAlreadyActive = item.classList.contains('active');

      // Close other accordion items
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          const otherTrigger = otherItem.querySelector('.faq-trigger');
          const otherContent = otherItem.querySelector('.faq-content');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
          if (otherContent) otherContent.style.maxHeight = '0px';
        }
      });

      if (isAlreadyActive) {
        item.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        content.style.maxHeight = '0px';
      } else {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });

  window.addEventListener('resize', function () {
    const activeFaq = document.querySelector('.faq-item.active .faq-content');
    if (activeFaq) {
      activeFaq.style.maxHeight = activeFaq.scrollHeight + 'px';
    }
  });

  // ==========================================================================
  // 9. Smooth Scrolling for Internal Hash Anchors
  // ==========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const navbarHeight = document.getElementById('top-navbar') ? document.getElementById('top-navbar').offsetHeight : 70;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 16;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

})();
