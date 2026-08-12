/**
 * Helper function to download blob as file
 * @param {Blob} blob - The file blob to download
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get file extension based on format
 * @param {string} format - 'csv' or 'excel'
 * @returns {string} File extension
 */
export const getFileExtension = (format) => {
  return format === 'excel' ? 'xlsx' : 'csv';
};

/**
 * Get MIME type based on format
 * @param {string} format - 'csv' or 'excel'
 * @returns {string} MIME type
 */
export const getMimeType = (format) => {
  return format === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv';
};

/**
 * Generate filename with timestamp
 * @param {string} reportType - Type of report (stock, production, wastage)
 * @param {string} format - 'csv' or 'excel'
 * @returns {string} Filename with timestamp
 */
export const generateFilename = (reportType, format = 'csv') => {
  const date = new Date().toISOString().split('T')[0];
  const extension = getFileExtension(format);
  return `${reportType}-report-${date}.${extension}`;
};

