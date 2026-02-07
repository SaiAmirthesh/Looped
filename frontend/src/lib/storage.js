/**
 * localStorage utilities with automatic JSON serialization/deserialization
 */

/**
 * Get data from localStorage
 * @param {string} key - Storage key
 * @param {any} fallback - Default value if key not found
 * @returns {any} Parsed data or fallback
 */
export const getData = (key, fallback = null) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return fallback;
  }
};

/**
 * Set data in localStorage
 * @param {string} key - Storage key
 * @param {any} value - Value to store (will be JSON stringified)
 */
export const setData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
export const removeData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
};

/**
 * Clear all Looped data from localStorage
 */
export const clearAllLoopedData = () => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('looped:'));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing Looped data:', error);
  }
};

/**
 * Generate storage key scoped to user
 * @param {string} userId - User ID or email
 * @param {string} feature - Feature name (habits, quests, xp, etc.)
 * @returns {string} Formatted key
 */
export const generateKey = (userId, feature) => {
  return `looped:${userId}:${feature}`;
};
