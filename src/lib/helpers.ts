/**
 * Utility helper functions for the application
 */

/**
 * Format a number as Vietnamese currency (VND)
 * @param value - The number to format
 * @returns Formatted currency string (e.g., 1.000.000đ)
 */
export const formatCurrency = (value: number): string => {
  return `${value.toLocaleString('vi-VN')}đ`;
};

/**
 * Format a date string to dd/mm/yyyy
 * @param dateStr - ISO date string or existing dd/mm/yyyy string
 * @returns Formatted date string or '---' if invalid
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '---';
  // If it's already in dd/mm/yyyy format, return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Convert a date string to yyyy-mm-dd for HTML date inputs
 * @param dateStr - dd/mm/yyyy or ISO date string
 * @returns Formatted date string for input or empty string if invalid
 */
export const toDateInputFormat = (dateStr: string): string => {
  if (!dateStr) return '';
  // If it's in dd/mm/yyyy format, convert to yyyy-mm-dd
  const ddmmyyyyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    return `${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`;
  }
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Get initials from a full name
 * @param fullName - The full name to get initials from
 * @returns 1-2 uppercase initials
 */
export const getInitials = (fullName: string): string => {
  if (!fullName) return '??';
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

/**
 * Download a file from an authenticated API endpoint
 * @param url - The full API URL
 * @param token - The Bearer token
 * @param filename - The name to save the file as
 */
export const downloadFileWithAuth = async (
  url: string | string[],
  token: string,
  filename: string
): Promise<boolean> => {
  const urls = Array.isArray(url) ? url : [url];

  try {
    for (const candidateUrl of urls) {
      const response = await fetch(candidateUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        return true;
      }

      if (response.status !== 404) {
        console.error('Download failed:', response.statusText);
        return false;
      }
    }

    console.error('Download failed: all fallback URLs returned 404');
    return false;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
};

/**
 * Copy text to clipboard and return success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
