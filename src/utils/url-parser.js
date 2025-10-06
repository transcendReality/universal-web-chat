/**
 * URL-based Room Management Utility
 * 
 * This utility handles room management based on URL patterns.
 * It determines which room a user should join based on the current URL.
 */

/**
 * Parse the current URL to determine the appropriate chat room
 * @param {Object} options - Configuration options
 * @returns {string} - Room identifier
 */
export const parseUrlForRoom = (options = {}) => {
  const {
    useFullUrl = false,
    usePathOnly = false,
    useHostOnly = true,
    customRoomPrefix = 'room_'
  } = options;
  
  // Get the current URL
  const url = new URL(window.location.href);
  
  // Determine room based on options
  if (useFullUrl) {
    // Use the full URL (excluding hash and search params)
    return `${customRoomPrefix}${url.origin}${url.pathname}`;
  } else if (usePathOnly) {
    // Use only the path
    return `${customRoomPrefix}${url.pathname}`;
  } else if (useHostOnly) {
    // Use only the hostname (default)
    return `${customRoomPrefix}${url.hostname}`;
  }
  
  // Default fallback
  return `${customRoomPrefix}${url.hostname}`;
};

/**
 * Check if two URLs should be in the same chat room
 * @param {string} url1 - First URL
 * @param {string} url2 - Second URL
 * @param {Object} options - Configuration options
 * @returns {boolean} - Whether the URLs belong to the same room
 */
export const isSameRoom = (url1, url2, options = {}) => {
  try {
    const parsedUrl1 = new URL(url1);
    const parsedUrl2 = new URL(url2);
    
    const {
      useFullUrl = false,
      usePathOnly = false,
      useHostOnly = true
    } = options;
    
    if (useFullUrl) {
      // Compare origin + path
      return (
        parsedUrl1.origin === parsedUrl2.origin &&
        parsedUrl1.pathname === parsedUrl2.pathname
      );
    } else if (usePathOnly) {
      // Compare only path
      return parsedUrl1.pathname === parsedUrl2.pathname;
    } else if (useHostOnly) {
      // Compare only hostname (default)
      return parsedUrl1.hostname === parsedUrl2.hostname;
    }
    
    // Default comparison
    return parsedUrl1.hostname === parsedUrl2.hostname;
  } catch (error) {
    console.error('Error comparing URLs:', error);
    return false;
  }
};

/**
 * Get a list of subrooms based on the current URL
 * This allows for more granular room organization
 * @returns {Array<string>} - List of possible subrooms
 */
export const getSubRooms = () => {
  const url = new URL(window.location.href);
  const pathSegments = url.pathname.split('/').filter(segment => segment);
  
  // Generate subrooms based on path depth
  const subRooms = [];
  let currentPath = '';
  
  // Add hostname as the base room
  subRooms.push(url.hostname);
  
  // Add progressively more specific paths
  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    subRooms.push(`${url.hostname}${currentPath}`);
  }
  
  return subRooms;
};

export default {
  parseUrlForRoom,
  isSameRoom,
  getSubRooms
};
