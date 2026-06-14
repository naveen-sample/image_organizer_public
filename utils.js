const Utils = {
  formatAlbumName(name) {
    return name
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  },

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  sanitizeFilename(filename) {
    let cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = cleaned.substring(0, cleaned.lastIndexOf('.'));
    const ext = cleaned.substring(cleaned.lastIndexOf('.') + 1);
    if (name && ext) {
      return `${name}_${Date.now()}.${ext}`;
    }
    return `file_${Date.now()}.jpg`;
  },

  getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
  },

  isImageFile(filename) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
  },

  isVideoFile(filename) {
    return /\.(mp4|mov|webm|avi|mkv)$/i.test(filename);
  },

  isMediaFile(filename) {
    return this.isImageFile(filename) || this.isVideoFile(filename);
  },

  getMediaType(filename) {
    if (this.isVideoFile(filename)) return 'video';
    if (this.isImageFile(filename)) return 'image';
    return 'other';
  },

  debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's');
  }
};
