/**
 * Manifest Generator Utility
 * 
 * This utility generates browser-specific manifest files based on the browser type.
 * It handles differences between Manifest V2 (Firefox) and Manifest V3 (Chrome/Edge/Brave).
 */

/**
 * Generate a manifest file based on browser type
 * @param {string} browser - Browser type (chrome, firefox, edge, brave)
 * @returns {Object} - Manifest object
 */
export function generateManifest(browser) {
  // Common manifest properties
  const manifest = {
    name: "Universal Web Chat",
    description: "Chat on any website with P2P technology",
    version: "1.0.0",
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "64": "icons/icon-64.png",
      "128": "icons/icon-64.png"
    }
  };
  
  // Browser-specific configurations
  switch (browser) {
    case 'firefox':
      return generateFirefoxManifest(manifest);
    case 'edge':
      return generateEdgeManifest(manifest);
    case 'brave':
      return generateBraveManifest(manifest);
    case 'chrome':
    default:
      return generateChromeManifest(manifest);
  }
}

/**
 * Generate Chrome-specific manifest (Manifest V3)
 * @param {Object} baseManifest - Base manifest object
 * @returns {Object} - Chrome manifest
 */
function generateChromeManifest(baseManifest) {
  return {
    ...baseManifest,
    manifest_version: 3,
    permissions: [
      "storage",
      "tabs"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    action: {
      default_popup: "popup.html",
      default_icon: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "64": "icons/icon-64.png"
      }
    },
    background: {
      service_worker: "background.js",
      type: "module"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_idle"
      }
    ]
  };
}

/**
 * Generate Firefox-specific manifest (Manifest V2)
 * @param {Object} baseManifest - Base manifest object
 * @returns {Object} - Firefox manifest
 */
function generateFirefoxManifest(baseManifest) {
  return {
    ...baseManifest,
    manifest_version: 2,
    permissions: [
      "storage",
      "tabs",
      "<all_urls>"
    ],
    browser_action: {
      default_popup: "popup.html",
      default_icon: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
        "64": "icons/icon-64.png"
      }
    },
    background: {
      scripts: ["background.js"],
      type: "module"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        run_at: "document_idle"
      }
    ],
    browser_specific_settings: {
      gecko: {
        id: "universal-web-chat@example.com",
        strict_min_version: "67.0"
      }
    }
  };
}

/**
 * Generate Edge-specific manifest (Manifest V3)
 * @param {Object} baseManifest - Base manifest object
 * @returns {Object} - Edge manifest
 */
function generateEdgeManifest(baseManifest) {
  // Edge uses the same manifest format as Chrome
  return generateChromeManifest(baseManifest);
}

/**
 * Generate Brave-specific manifest (Manifest V3)
 * @param {Object} baseManifest - Base manifest object
 * @returns {Object} - Brave manifest
 */
function generateBraveManifest(baseManifest) {
  // Brave uses the same manifest format as Chrome
  return generateChromeManifest(baseManifest);
}

export default generateManifest;
