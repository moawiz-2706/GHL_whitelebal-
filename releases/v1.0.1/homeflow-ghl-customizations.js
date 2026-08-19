/**
 * HomeFlow HighLevel Customizations
 * Release: v1.0.1
 * 
 * Unified async route controller for HighLevel CRM web application.
 * Handles subaccount exclusions, route redirections, layout adjustments,
 * and location-scoped sidebar/header styling without dependencies.
 */
(function () {
  'use strict';

  /* ─────────────────────────────
     1. CONFIGURATION & CONSTANTS
  ───────────────────────────── */
  // Main customization excluded subaccount location IDs
  const MAIN_EXCLUDED_LOCATIONS = [
    "3hxU86Tlg4Hj231eATmo",
    "wU0QPFEzdTl7CpndxylS"
  ];

  // HomeFlow specific target location ID
  const HOMEFLOW_TARGET_LOCATION = "XzzLQ42sqJR43o30CP34";

  // Managed Style Element IDs
  const STYLE_IDS = {
    SIDEBAR_GLOBAL: "custom-sidebar-global-layout",
    REVIEWS: "custom-review-layout-test",
    WIDGET: "custom-widget-layout-test",
    SOCIAL_PLANNER: "custom-social-planner-layout-test",
    REPUTATION_INTEGRATIONS: "custom-reputation-integrations-layout-test",
    REVIEWS_AI: "custom-reviews-ai-layout-test",
    HOMEFLOW_HEADER: "hide-header-templates-emails"
  };

  /* ─────────────────────────────
     2. ASYNC LOCATION LOOKUP (WITH FALLBACK PRIORITY)
  ───────────────────────────── */
  async function getLocationId() {
    // Priority 1: HighLevel native AppUtils API (v3) - treated as asynchronous
    if (
      window.AppUtils &&
      window.AppUtils.Utilities &&
      typeof window.AppUtils.Utilities.getCurrentLocation === 'function'
    ) {
      try {
        const loc = await window.AppUtils.Utilities.getCurrentLocation();
        if (loc && loc.id) {
          return loc.id;
        }
      } catch (e) {
        // Fall through gracefully if AppUtils is temporarily uninitialized or fails
      }
    }

    // Priority 2: Extract location ID from standard URL path (/v2/location/{LOCATION_ID}/...)
    const pathMatch = window.location.pathname.match(/\/v2\/location\/([^\/]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }

    // Priority 3: Query search parameters fallback (location_id / loc)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryLoc = searchParams.get("location_id") || searchParams.get("loc");
      if (queryLoc) {
        return queryLoc;
      }
    } catch (e) {
      // Fall through
    }

    return null;
  }

  /* ─────────────────────────────
     3. ROUTE CHECKS & HELPERS
  ───────────────────────────── */
  function getCurrentTab() {
    try {
      return new URLSearchParams(window.location.search).get("tab");
    } catch (e) {
      return null;
    }
  }

  function isOverviewPage(pathname) {
    return pathname.includes("/reputation/overview");
  }

  function isReviewsPage(pathname) {
    return pathname.includes("/reputation/reviews");
  }

  function isWidgetPage(pathname) {
    return pathname.includes("/reputation/widget");
  }

  function isSocialPlannerPage(pathname) {
    return pathname.includes("/marketing/social-planner");
  }

  function isReputationSettingsPage(pathname) {
    return pathname.includes("/reputation/settings");
  }

  function isReputationIntegrationsPage(pathname) {
    return isReputationSettingsPage(pathname) && getCurrentTab() === "reputationIntegrations";
  }

  function isReviewsAIPage(pathname) {
    return isReputationSettingsPage(pathname) && getCurrentTab() === "reviewsAI";
  }

  function isConversationTemplatesPage(pathname) {
    return pathname.includes("/conversations/templates");
  }

  function isMarketingEmailsPage(pathname) {
    return pathname.includes("/marketing/emails");
  }

  /* ─────────────────────────────
     4. EFFICIENT DOM STYLE MANAGEMENT
  ───────────────────────────── */
  function injectStyle(id, cssContent) {
    let styleEl = document.getElementById(id);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      styleEl.innerHTML = cssContent;
      (document.head || document.documentElement).appendChild(styleEl);
    } else if (styleEl.innerHTML !== cssContent) {
      styleEl.innerHTML = cssContent;
    }
  }

  function removeStyle(id) {
    const el = document.getElementById(id);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  function removeStyles(ids) {
    ids.forEach(removeStyle);
  }

  function removeAllStyles() {
    Object.values(STYLE_IDS).forEach(removeStyle);
  }

  /* ─────────────────────────────
     5. CSS TEMPLATES & GENERATORS
  ───────────────────────────── */
  function getSidebarGlobalCss(locId) {
    return `
      /* ── MOVE CUSTOM LINKS UP ── */
      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='78ae8e45-8a17-4905-8a5e-ff819d60eed6'] {
        order: 4 !important;
      }
      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='77fece63-4fcd-40e0-be67-35132d26ebde'] {
        order: 4 !important;
      }

      /* ── HIDE SIDEBAR ITEMS (scoped to current location) ── */
      .sidebar-v2-location.${locId} #sb_import-data,
      .sidebar-v2-location.${locId} #sb_custom-values,
      .sidebar-v2-location.${locId} #sb_contacts,
      .sidebar-v2-location.${locId} #sb_manage-preferences,
      .sidebar-v2-location.${locId} #\\36 7d04f019b961eb53460bcdc {
        display: none !important;
      }
    `;
  }

  const REVIEWS_CSS = `
    /* Hide top header bar */
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    /* Hide the reputation sub-menu tabs */
    .reputation-tabs,
    .hl_tab-nav,
    [class*="reputation"] > nav,
    .tab-navigation,
    .nav-tabs {
      display: none !important;
    }

    /* Hide Add Reviews button */
    #add-reviews-button {
      display: none !important;
    }

    /* Hide Send Review Request button */
    #send-review-request-button {
      display: none !important;
    }

    /* Full width layout */
    #app,
    .hl_wrapper,
    .hl_main,
    main {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;

  const WIDGET_AND_SOCIAL_PLANNER_CSS = `
    /* Hide top header/menu bar */
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    /* Specific selector for the top bar flex row */
    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

    /* Full width layout */
    #app,
    .hl_wrapper,
    .hl_main,
    main {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
  `;

  function getReputationSettingsCss(locId) {
    const locPrefix = locId ? `.sidebar-v2-location.${locId} ` : "";
    return `
      /* Hide top header/menu bar broadly */
      header.hl_header,
      .hl_header,
      .hl-topbar {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      /* Extra specific top-header selectors for the settings pages */
      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row,
      ${locPrefix}#app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      ${locPrefix}#app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      /* Remove space left behind by hidden header */
      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }

      /* Hide the Reputation Settings internal left tab/sidebar */
      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content,
      ${locPrefix}#reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        overflow: hidden !important;
      }

      /* Collapse the internal tab-nav wrapper */
      #reputation-settings-container .hr-tabs-nav--left,
      #reputation-settings-container .hr-tabs-nav-scroll-wrapper,
      #reputation-settings-container .hr-tabs-nav-y-scroll {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        overflow: hidden !important;
      }

      /* Expand settings content after internal left tab menu is hidden */
      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type,
      ${locPrefix}#reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type {
        width: 100% !important;
      }

      #reputation-settings-container .hr-tabs-content-holder,
      ${locPrefix}#reputation-settings-container .hr-tabs-content-holder {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
  }

  const HOMEFLOW_HEADER_CSS = `
    /* Hide top header */
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
    }

    /* Hide header flex row */
    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

    /* Remove top spacing (corrected margin-top syntax) */
    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  `;

  /* ─────────────────────────────
     6. CENTRAL ASYNC ROUTE CONTROLLER
  ───────────────────────────── */
  let currentRunToken = 0;

  async function runController() {
    // Generate a unique token for this invocation sequence
    const runToken = ++currentRunToken;

    const pathname = window.location.pathname;
    const currentLocId = await getLocationId();

    // Race Condition Guard: If another navigation event occurred while awaiting location, abort.
    if (runToken !== currentRunToken) {
      return;
    }

    const isMainAllowed = Boolean(currentLocId && !MAIN_EXCLUDED_LOCATIONS.includes(currentLocId));

    /* ── A. REPUTATION OVERVIEW REDIRECT ── */
    if (isMainAllowed && isOverviewPage(pathname)) {
      if (currentLocId) {
        const reviewsUrl = `/v2/location/${currentLocId}/reputation/reviews`;
        if (window.location.pathname !== reviewsUrl) {
          // Use HighLevel / Browser SPA routing without hard reloads
          window.history.replaceState(null, "", reviewsUrl);
          window.dispatchEvent(new PopStateEvent("popstate"));
          return;
        }
      }
    }

    /* ── B. MAIN CUSTOMIZATION LOGIC ── */
    if (!isMainAllowed) {
      // Remove all main customization styles if excluded or location unknown
      removeStyles([
        STYLE_IDS.SIDEBAR_GLOBAL,
        STYLE_IDS.REVIEWS,
        STYLE_IDS.WIDGET,
        STYLE_IDS.SOCIAL_PLANNER,
        STYLE_IDS.REPUTATION_INTEGRATIONS,
        STYLE_IDS.REVIEWS_AI
      ]);
    } else {
      // Apply sidebar global styles for allowed locations
      injectStyle(STYLE_IDS.SIDEBAR_GLOBAL, getSidebarGlobalCss(currentLocId));

      const pageStyleIds = [
        STYLE_IDS.REVIEWS,
        STYLE_IDS.WIDGET,
        STYLE_IDS.SOCIAL_PLANNER,
        STYLE_IDS.REPUTATION_INTEGRATIONS,
        STYLE_IDS.REVIEWS_AI
      ];

      if (isReviewsPage(pathname)) {
        removeStyles(pageStyleIds.filter(id => id !== STYLE_IDS.REVIEWS));
        injectStyle(STYLE_IDS.REVIEWS, REVIEWS_CSS);
      } else if (isWidgetPage(pathname)) {
        removeStyles(pageStyleIds.filter(id => id !== STYLE_IDS.WIDGET));
        injectStyle(STYLE_IDS.WIDGET, WIDGET_AND_SOCIAL_PLANNER_CSS);
      } else if (isSocialPlannerPage(pathname)) {
        removeStyles(pageStyleIds.filter(id => id !== STYLE_IDS.SOCIAL_PLANNER));
        injectStyle(STYLE_IDS.SOCIAL_PLANNER, WIDGET_AND_SOCIAL_PLANNER_CSS);
      } else if (isReputationIntegrationsPage(pathname)) {
        removeStyles(pageStyleIds.filter(id => id !== STYLE_IDS.REPUTATION_INTEGRATIONS));
        injectStyle(STYLE_IDS.REPUTATION_INTEGRATIONS, getReputationSettingsCss(currentLocId));
      } else if (isReviewsAIPage(pathname)) {
        removeStyles(pageStyleIds.filter(id => id !== STYLE_IDS.REVIEWS_AI));
        injectStyle(STYLE_IDS.REVIEWS_AI, getReputationSettingsCss(currentLocId));
      } else {
        removeStyles(pageStyleIds);
      }
    }

    /* ── C. HOMEFLOW CUSTOMIZATION LOGIC ── */
    const isHomeflowAllowed = Boolean(
      currentLocId === HOMEFLOW_TARGET_LOCATION &&
      (isConversationTemplatesPage(pathname) || isMarketingEmailsPage(pathname))
    );

    if (isHomeflowAllowed) {
      injectStyle(STYLE_IDS.HOMEFLOW_HEADER, HOMEFLOW_HEADER_CSS);
    } else {
      removeStyle(STYLE_IDS.HOMEFLOW_HEADER);
    }
  }

  /* ─────────────────────────────
     7. SINGLE CENTRALIZED NAVIGATION LISTENER & SCHEDULER
  ───────────────────────────── */
  let isScheduled = false;

  function scheduleRun() {
    if (isScheduled) return;
    isScheduled = true;
    Promise.resolve().then(() => {
      isScheduled = false;
      runController();
    });
  }

  // 1. Initial invocation
  scheduleRun();

  // 2. Official HighLevel SPA Lifecycle Events
  window.addEventListener('routeLoaded', scheduleRun);
  window.addEventListener('routeChangeEvent', scheduleRun);

  // 3. Intercept History API (PushState / ReplaceState / PopState)
  const origPushState = history.pushState;
  const origReplaceState = history.replaceState;

  if (typeof origPushState === 'function') {
    history.pushState = function () {
      const result = origPushState.apply(this, arguments);
      scheduleRun();
      return result;
    };
  }

  if (typeof origReplaceState === 'function') {
    history.replaceState = function () {
      const result = origReplaceState.apply(this, arguments);
      scheduleRun();
      return result;
    };
  }

  window.addEventListener('popstate', scheduleRun);

  // 4. Single MutationObserver + 250ms URL Fallback
  let lastUrl = location.href;

  function checkUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      scheduleRun();
    }
  }

  const observer = new MutationObserver(checkUrlChange);

  function startObserver() {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  window.addEventListener('load', () => {
    startObserver();
    scheduleRun();
  });

  // Single fallback interval for non-standard URL changes
  setInterval(checkUrlChange, 250);

})();
