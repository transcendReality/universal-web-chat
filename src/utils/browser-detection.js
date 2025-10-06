/**
 * Browser Detection Utility
 * 
 * This utility detects the current browser and its capabilities.
 * It helps with implementing browser-specific features and workarounds.
 */

/**
 * Get information about the current browser
 * @returns {Object} - Browser information
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = 'unknown';
  let isChromium = false;
  let isFirefox = false;
  let isEdge = false;
  let isBrave = false;
  
  // Detect browser type
  if (userAgent.indexOf('Firefox') !== -1) {
    browserName = 'firefox';
    isFirefox = true;
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgent.indexOf('Edg') !== -1) {
    browserName = 'edge';
    isEdge = true;
    isChromium = true;
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  } else if (userAgent.indexOf('Chrome') !== -1) {
    // Note: Brave also includes "Chrome" in user agent
    browserName = 'chrome';
    isChromium = true;
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    if (match) {
      browserVersion = match[1];
    }
    
    // Additional check for Brave
    // This is an async operation, but we'll return a synchronous result
    // and update it later if needed
    checkBraveBrowser().then(isBraveBrowser => {
      if (isBraveBrowser) {
        browserName = 'brave';
        isBrave = true;
      }
    });
  } else if (userAgent.indexOf('Safari') !== -1) {
    browserName = 'safari';
    const match = userAgent.match(/Safari\/([0-9.]+)/);
    if (match) {
      browserVersion = match[1];
    }
  }
  
  // Determine environment helpers (window may be undefined in workers)
  const hasWindow = typeof window !== 'undefined';
  const hasHTMLElement = typeof HTMLElement !== 'undefined';
  
  // Detect features
  const features = {
    webRTC: typeof RTCPeerConnection !== 'undefined',
    webSockets: typeof WebSocket !== 'undefined',
    serviceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    shadowDOM: hasHTMLElement && !!HTMLElement.prototype.attachShadow,
    localStorage: hasWindow && !!window.localStorage,
    notifications: typeof Notification !== 'undefined'
  };
  
  return {
    name: browserName,
    version: browserVersion,
    isChromium,
    isFirefox,
    isEdge,
    isBrave,
    features,
    userAgent
  };
};

/**
 * Check if the browser is Brave
 * @returns {Promise<boolean>} - Whether the browser is Brave
 */
async function checkBraveBrowser() {
  // Brave has a specific navigator property
  if (navigator.brave && await navigator.brave.isBrave()) {
    return true;
  }
  
  // Older method: check for specific Brave behavior
  try {
    // Brave blocks certain tracking APIs
    const test = navigator.plugins.length === 0 && 
                 navigator.mimeTypes.length === 0 &&
                 /Chrome/.test(navigator.userAgent);
                 
    // Additional check for Brave's shields
    const response = await fetch('https://brave.com/');
    const braveHeaders = response.headers.get('permissions-policy') || 
                         response.headers.get('referrer-policy');
                         
    return test && !!braveHeaders;
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current browser supports Manifest V3
 * @returns {boolean} - Whether Manifest V3 is supported
 */
export const supportsManifestV3 = () => {
  const browserInfo = getBrowserInfo();
  
  // Firefox doesn't fully support Manifest V3 yet
  if (browserInfo.isFirefox) {
    return false;
  }
  
  // Chrome, Edge, and Brave support Manifest V3
  return browserInfo.isChromium;
};

/**
 * Get the appropriate API namespace based on the browser
 * Handles differences between chrome.* and browser.* APIs
 * @param {string} apiName - Name of the API (e.g., 'runtime', 'storage')
 * @returns {Object} - The API object
 */
export const getBrowserAPI = (apiName) => {
  // Firefox uses browser.* namespace, others use chrome.*
  if (typeof browser !== 'undefined' && browser[apiName]) {
    return browser[apiName];
  }
  
  if (typeof chrome !== 'undefined' && chrome[apiName]) {
    return chrome[apiName];
  }
  
  // Fallback
  console.warn(`API ${apiName} not found in browser or chrome namespace`);
  return null;
};

export default {
  getBrowserInfo,
  supportsManifestV3,
  getBrowserAPI
};
