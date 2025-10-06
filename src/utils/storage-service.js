/**
 * Storage Service
 * 
 * This utility provides a consistent interface for storing and retrieving data
 * across different browsers. It handles the differences between Chrome's and Firefox's
 * storage APIs and provides promise-based methods for easier async usage.
 */

/**
 * Get the appropriate storage API based on the browser
 * @param {string} type - Storage type ('sync' or 'local')
 * @returns {Object} - Storage API object
 */
const getStorageAPI = (type = 'sync') => {
  // Check if browser API is available (Firefox)
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage[type];
  }
  
  // Check if chrome API is available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage[type];
  }
  
  // Fallback to localStorage for development/testing
  return {
    get: (keys) => {
      return new Promise((resolve) => {
        const result = {};
        if (typeof keys === 'string') {
          result[keys] = localStorage.getItem(keys);
          if (result[keys]) {
            try {
              result[keys] = JSON.parse(result[keys]);
            } catch (e) {
              // Not JSON, use as is
            }
          }
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = localStorage.getItem(key);
            if (result[key]) {
              try {
                result[key] = JSON.parse(result[key]);
              } catch (e) {
                // Not JSON, use as is
              }
            }
          });
        } else if (keys === null) {
          // Get all items
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            result[key] = localStorage.getItem(key);
            if (result[key]) {
              try {
                result[key] = JSON.parse(result[key]);
              } catch (e) {
                // Not JSON, use as is
              }
            }
          }
        }
        resolve(result);
      });
    },
    set: (items) => {
      return new Promise((resolve) => {
        Object.keys(items).forEach(key => {
          const value = items[key];
          localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
        });
        resolve();
      });
    },
    remove: (keys) => {
      return new Promise((resolve) => {
        if (typeof keys === 'string') {
          localStorage.removeItem(keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(key => localStorage.removeItem(key));
        }
        resolve();
      });
    },
    clear: () => {
      return new Promise((resolve) => {
        localStorage.clear();
        resolve();
      });
    }
  };
};

/**
 * Get data from storage
 * @param {string|Array|Object} keys - Key(s) to get
 * @param {string} type - Storage type ('sync' or 'local')
 * @returns {Promise<Object>} - Promise resolving to an object with the requested data
 */
export const getData = (keys, type = 'sync') => {
  const storage = getStorageAPI(type);
  
  return new Promise((resolve, reject) => {
    storage.get(keys)
      .then(result => resolve(result))
      .catch(error => {
        console.error('Error getting data from storage:', error);
        reject(error);
      });
  });
};

/**
 * Save data to storage
 * @param {Object} items - Object with key-value pairs to save
 * @param {string} type - Storage type ('sync' or 'local')
 * @returns {Promise<void>} - Promise resolving when data is saved
 */
export const saveData = (items, type = 'sync') => {
  const storage = getStorageAPI(type);
  
  return new Promise((resolve, reject) => {
    storage.set(items)
      .then(() => resolve())
      .catch(error => {
        console.error('Error saving data to storage:', error);
        reject(error);
      });
  });
};

/**
 * Remove data from storage
 * @param {string|Array} keys - Key(s) to remove
 * @param {string} type - Storage type ('sync' or 'local')
 * @returns {Promise<void>} - Promise resolving when data is removed
 */
export const removeData = (keys, type = 'sync') => {
  const storage = getStorageAPI(type);
  
  return new Promise((resolve, reject) => {
    storage.remove(keys)
      .then(() => resolve())
      .catch(error => {
        console.error('Error removing data from storage:', error);
        reject(error);
      });
  });
};

/**
 * Clear all data from storage
 * @param {string} type - Storage type ('sync' or 'local')
 * @returns {Promise<void>} - Promise resolving when data is cleared
 */
export const clearData = (type = 'sync') => {
  const storage = getStorageAPI(type);
  
  return new Promise((resolve, reject) => {
    storage.clear()
      .then(() => resolve())
      .catch(error => {
        console.error('Error clearing storage:', error);
        reject(error);
      });
  });
};

export default {
  getData,
  saveData,
  removeData,
  clearData
};
