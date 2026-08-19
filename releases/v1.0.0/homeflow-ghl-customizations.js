(function () {
  "use strict";

  /* =========================================================
     CONFIGURATION
  ========================================================= */

  const EXCLUDED_LOCATION_IDS = [
    "3hxU86Tlg4Hj231eATmo",
    "wU0QPFEzdTl7CpndxylS"
  ];

  const HOMEFLOW_LOCATION_ID = "XzzLQ42sqJR43o30CP34";

  const STYLE_IDS = {
    SIDEBAR: "custom-sidebar-global-layout",
    REVIEWS: "custom-review-layout-test",
    WIDGET: "custom-widget-layout-test",
    SOCIAL_PLANNER: "custom-social-planner-layout-test",
    REPUTATION_INTEGRATIONS: "custom-reputation-integrations-layout-test",
    REVIEWS_AI: "custom-reviews-ai-layout-test",
    HOMEFLOW: "hide-header-templates-emails"
  };

  const ALL_STYLE_IDS = Object.values(STYLE_IDS);

  let scheduled = false;
  let running = false;
  let rerunRequested = false;
  let runSequence = 0;
  let lastAppliedStateKey = null;
  let lastObservedUrl = window.location.href;

  /* =========================================================
     SHARED LOCATION RESOLVER
     HighLevel getCurrentLocation() is async.
  ========================================================= */

  async function getLocationId() {
    try {
      if (
        window.AppUtils &&
        window.AppUtils.Utilities &&
        typeof window.AppUtils.Utilities.getCurrentLocation === "function"
      ) {
        const loc = await window.AppUtils.Utilities.getCurrentLocation();

        if (loc && loc.id) {
          return loc.id;
        }
      }
    } catch (error) {
      // Fall back to URL detection below.
    }

    const match = window.location.pathname.match(
      /\/v2\/location\/([^/]+)/
    );

    return match ? match[1] : null;
  }

  /* =========================================================
     ROUTE / PAGE HELPERS
  ========================================================= */

  function getCurrentPathname() {
    return window.location.pathname;
  }

  function getCurrentTab() {
    return new URLSearchParams(window.location.search).get("tab");
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

  function isReputationIntegrationsPage(pathname, tab) {
    return (
      isReputationSettingsPage(pathname) &&
      tab === "reputationIntegrations"
    );
  }

  function isReviewsAIPage(pathname, tab) {
    return (
      isReputationSettingsPage(pathname) &&
      tab === "reviewsAI"
    );
  }

  function isConversationTemplatesPage(pathname) {
    return pathname.includes("/conversations/templates");
  }

  function isMarketingEmailsPage(pathname) {
    return pathname.includes("/marketing/emails");
  }

  /* =========================================================
     STATE BUILDER
  ========================================================= */

  async function buildState() {
    const locationId = await getLocationId();
    const pathname = getCurrentPathname();
    const tab = getCurrentTab();

    return {
      url: window.location.href,
      pathname,
      tab,
      locationId,

      isExcluded:
        !locationId ||
        EXCLUDED_LOCATION_IDS.includes(locationId),

      isOverviewPage: isOverviewPage(pathname),
      isReviewsPage: isReviewsPage(pathname),
      isWidgetPage: isWidgetPage(pathname),
      isSocialPlannerPage: isSocialPlannerPage(pathname),

      isReputationIntegrationsPage:
        isReputationIntegrationsPage(pathname, tab),

      isReviewsAIPage:
        isReviewsAIPage(pathname, tab),

      isHomeFlowTemplatesPage:
        locationId === HOMEFLOW_LOCATION_ID &&
        isConversationTemplatesPage(pathname),

      isHomeFlowEmailsPage:
        locationId === HOMEFLOW_LOCATION_ID &&
        isMarketingEmailsPage(pathname)
    };
  }

  function getStateKey(state) {
    return [
      state.url,
      state.locationId || "",
      state.isExcluded,
      state.isOverviewPage,
      state.isReviewsPage,
      state.isWidgetPage,
      state.isSocialPlannerPage,
      state.isReputationIntegrationsPage,
      state.isReviewsAIPage,
      state.isHomeFlowTemplatesPage,
      state.isHomeFlowEmailsPage
    ].join("|");
  }

  /* =========================================================
     STYLE MANAGER
  ========================================================= */

  function ensureStyle(styleId, css, shouldExist) {
    const existing = document.getElementById(styleId);

    if (!shouldExist) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    if (existing) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function removeStyle(styleId) {
    const element = document.getElementById(styleId);

    if (element) {
      element.remove();
    }
  }

  function removeAllLayouts() {
    ALL_STYLE_IDS.forEach(removeStyle);
  }

  /* =========================================================
     CSS BUILDERS
  ========================================================= */

  function getSidebarGlobalCss(locId) {
    return `
      /* ── MOVE CUSTOM LINKS UP ── */

      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='78ae8e45-8a17-4905-8a5e-ff819d60eed6'] {
        order: 4 !important;
      }

      div#app div.sidebar-v2-location #sidebar-v2 div.hl_nav-header nav.w-full a[id='77fece63-4fcd-40e0-be67-35132d26ebde'] {
        order: 4 !important;
      }

      /* ── HIDE SIDEBAR ITEMS ── */

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
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    .reputation-tabs,
    .hl_tab-nav,
    [class*="reputation"] > nav,
    .tab-navigation,
    .nav-tabs {
      display: none !important;
    }

    #add-reviews-button,
    #send-review-request-button {
      display: none !important;
    }

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

  const WIDGET_CSS = `
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

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

  const SOCIAL_PLANNER_CSS = `
    header.hl_header,
    .hl_header,
    .hl-topbar {
      display: none !important;
    }

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

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
    return `
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

      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row,
      .sidebar-v2-location.${locId} #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.container-fluid.\\!justify-end,
      .sidebar-v2-location.${locId} #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        min-height: 0 !important;
        max-height: 0 !important;
        overflow: hidden !important;
      }

      #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
        padding-top: 0 !important;
        margin-top: 0 !important;
      }

      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content,
      .sidebar-v2-location.${locId} #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type > div.hr-tabs-nav--bar-type.hr-tabs-nav--left > div.hr-tabs-nav-scroll-wrapper > div.hr-tabs-nav-y-scroll > div.hr-tabs-nav-scroll-content {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        min-width: 0 !important;
        max-width: 0 !important;
        overflow: hidden !important;
      }

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

      #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type,
      .sidebar-v2-location.${locId} #reputation-settings-container > div.hr-wrapper-container.reputationApp > div.hr-config-provider.font-sans > div.flex.min-h-0 > div.hr-tabs.hr-tabs--bar-type {
        width: 100% !important;
      }

      #reputation-settings-container .hr-tabs-content-holder,
      .sidebar-v2-location.${locId} #reputation-settings-container .hr-tabs-content-holder {
        margin-left: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
  }

  const HOMEFLOW_CSS = `
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

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) > header.hl_header > div.flex.flex-row {
      display: none !important;
    }

    #app > div:nth-child(2) > div:nth-child(1) > div.flex.v2-open > div:nth-child(2) {
      margin-top: 0 !important;
      padding-top: 0 !important;
    }
  `;

  /* =========================================================
     REDIRECT
  ========================================================= */

  async function redirectToReviews(state) {
    if (
      state.isExcluded ||
      !state.locationId ||
      !state.isOverviewPage
    ) {
      return;
    }

    const reviewsPath =
      "/v2/location/" +
      state.locationId +
      "/reputation/reviews";

    if (window.location.pathname === reviewsPath) {
      return;
    }

    try {
      if (
        window.AppUtils &&
        window.AppUtils.RouteHelper &&
        typeof window.AppUtils.RouteHelper.navigate === "function"
      ) {
        await window.AppUtils.RouteHelper.navigate({
          path: reviewsPath,
          replace: true
        });

        return;
      }
    } catch (error) {
      // Fall back to browser navigation.
    }

    window.history.replaceState(null, "", reviewsPath);
    window.dispatchEvent(new PopStateEvent("popstate"));

    setTimeout(function () {
      if (window.location.pathname.includes("/reputation/overview")) {
        window.location.href = reviewsPath;
      }
    }, 300);
  }

  /* =========================================================
     APPLY STATE
  ========================================================= */

  async function applyState(state) {
    if (state.isExcluded) {
      removeAllLayouts();
      return;
    }

    if (state.isOverviewPage) {
      removeAllLayouts();
      await redirectToReviews(state);
      return;
    }

    ensureStyle(
      STYLE_IDS.SIDEBAR,
      getSidebarGlobalCss(state.locationId),
      true
    );

    ensureStyle(
      STYLE_IDS.REVIEWS,
      REVIEWS_CSS,
      state.isReviewsPage
    );

    ensureStyle(
      STYLE_IDS.WIDGET,
      WIDGET_CSS,
      state.isWidgetPage
    );

    ensureStyle(
      STYLE_IDS.SOCIAL_PLANNER,
      SOCIAL_PLANNER_CSS,
      state.isSocialPlannerPage
    );

    ensureStyle(
      STYLE_IDS.REPUTATION_INTEGRATIONS,
      getReputationSettingsCss(state.locationId),
      state.isReputationIntegrationsPage
    );

    ensureStyle(
      STYLE_IDS.REVIEWS_AI,
      getReputationSettingsCss(state.locationId),
      state.isReviewsAIPage
    );

    ensureStyle(
      STYLE_IDS.HOMEFLOW,
      HOMEFLOW_CSS,
      state.isHomeFlowTemplatesPage ||
      state.isHomeFlowEmailsPage
    );
  }

  /* =========================================================
     CENTRAL ASYNC CONTROLLER
  ========================================================= */

  async function run() {
    if (running) {
      rerunRequested = true;
      return;
    }

    running = true;
    const thisRun = ++runSequence;

    try {
      const state = await buildState();

      if (thisRun !== runSequence) {
        return;
      }

      const stateKey = getStateKey(state);

      if (stateKey === lastAppliedStateKey) {
        return;
      }

      await applyState(state);

      if (thisRun === runSequence) {
        lastAppliedStateKey = stateKey;
      }
    } catch (error) {
      console.error(
        "[GHL White Label Customizations] Runtime error:",
        error
      );
    } finally {
      running = false;

      if (rerunRequested) {
        rerunRequested = false;
        scheduleRun();
      }
    }
  }

  function scheduleRun() {
    if (scheduled) {
      return;
    }

    scheduled = true;

    setTimeout(function () {
      scheduled = false;
      run();
    }, 0);
  }

  /* =========================================================
     ROUTE EVENTS
  ========================================================= */

  window.addEventListener("routeLoaded", scheduleRun);
  window.addEventListener("routeChangeEvent", scheduleRun);
  window.addEventListener("popstate", scheduleRun);

  /* =========================================================
     SINGLE HISTORY API FALLBACK
  ========================================================= */

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    const result = originalPushState.apply(this, arguments);
    scheduleRun();
    return result;
  };

  history.replaceState = function () {
    const result = originalReplaceState.apply(this, arguments);
    scheduleRun();
    return result;
  };

  /* =========================================================
     SINGLE MUTATION OBSERVER
     Only used as a route-change fallback.
  ========================================================= */

  let observerStarted = false;

  function startObserver() {
    if (observerStarted || !document.body) {
      return;
    }

    observerStarted = true;

    const observer = new MutationObserver(function () {
      const currentUrl = window.location.href;

      if (currentUrl !== lastObservedUrl) {
        lastObservedUrl = currentUrl;
        scheduleRun();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /* =========================================================
     INITIALIZATION
  ========================================================= */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        startObserver();
        scheduleRun();
      },
      { once: true }
    );
  } else {
    startObserver();
    scheduleRun();
  }

  window.addEventListener(
    "load",
    function () {
      startObserver();
      scheduleRun();
    },
    { once: true }
  );

})();