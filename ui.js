const UI = {
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.remove('hidden');
  },

  showLoading(container, message = 'Loading...') {
    container.innerHTML = `<div class="loading"><div class="loading__spinner"></div><p>${message}</p></div>`;
  },

  showError(container, message) {
    container.innerHTML = `<div class="error"><p>${Utils.escapeHtml(message)}</p></div>`;
  },

  renderLoginScreen() {
    const screen = document.getElementById('loginScreen');
    screen.innerHTML = `
      <div class="login-container">
        <div class="login__logo">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
        <h1 class="login__title">Welcome to Gallery</h1>
        <p class="login__subtitle">To get started, authenticate with GitHub</p>

        <div class="form-group">
          <label for="tokenInput">GitHub Personal Access Token</label>
          <input type="password" id="tokenInput" class="form-control" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" autocomplete="off">
          <small>Create a token: GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)</small>
        </div>

        <button class="btn btn--primary btn--full" id="authenticateBtn">Authenticate</button>
        <button class="btn btn--secondary btn--full" id="learnMoreBtn">Learn More</button>

        <div class="info-box">
          <p>🔒 Your token is stored locally in your browser only.</p>
          <p>Never shared or sent to external servers.</p>
        </div>
      </div>
    `;
    this.showScreen('loginScreen');
  },

  renderHomeScreen(albums) {
    const screen = document.getElementById('homeScreen');
    screen.innerHTML = `
      <div class="screen-header">
        <h2>Albums</h2>
        <div class="screen-header__actions">
          <button class="btn btn--secondary" id="refreshHomeBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
            Refresh
          </button>
        </div>
      </div>

      ${albums.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <h3>No albums yet</h3>
          <p>Create your first album to get started</p>
        </div>
      ` : `
        <div class="grid grid--albums">
          ${albums.map(album => `
            <div class="card album-card" data-album="${album.name.replace(/"/g, '&quot;')}">
              <div class="card__image-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
              </div>
              <h3 class="card__title">${Utils.escapeHtml(album.displayName || Utils.formatAlbumName(album.name))}</h3>
              <div class="card__meta">
                <span>${Utils.pluralize(album.mediaCount || 0, 'file')}</span>
                <span>${Utils.formatDate(album.lastUpdated)}</span>
              </div>
            </div>
          `).join('')}

          <div class="card album-card album-card--new" id="createAlbumBtn">
            <div class="card__image-placeholder card__image-placeholder--new">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <h3 class="card__title card__title--new">New Album</h3>
          </div>
        </div>
      `}
    `;
    this.showScreen('homeScreen');
  },

  renderAlbumScreen(media, albumName) {
    const screen = document.getElementById('albumScreen');
    screen.innerHTML = `
      <div class="screen-header">
        <button class="btn btn--secondary" id="backToHomeBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back
        </button>
        <h2>${Utils.escapeHtml(Utils.formatAlbumName(albumName))}</h2>
        <span class="screen-header__count">${media.length} ${Utils.pluralize(media.length, 'file')}</span>
      </div>

      ${media.length === 0 ? `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <h3>No files in this album</h3>
          <p>Upload images and videos to get started</p>
        </div>
      ` : `
        <div class="grid grid--images">
          ${media.map((item, idx) => {
            const isVideo = Utils.isVideoFile(item.name);
            return `
            <div class="card image-card" data-index="${idx}">
              <div class="card__image-wrapper">
                ${isVideo ? `
                  <div class="card__video-overlay">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10,8 16,12 10,16" fill="white" stroke="none"/>
                    </svg>
                  </div>
                  <video class="card__image" preload="none"></video>
                ` : `
                  <img alt="${Utils.escapeHtml(item.name)}" class="card__image" loading="lazy">
                `}
              </div>
              <div class="image-card__info">
                <p class="card__title">${Utils.escapeHtml(item.name)}</p>
                <span class="card__meta">${Utils.formatFileSize(item.size)}</span>
              </div>
            </div>
          `}).join('')}
        </div>
      `}
    `;
    this.showScreen('albumScreen');
  },

  renderLightbox(mediaIndex, media, albumName) {
    const item = media[mediaIndex];
    const isVideo = Utils.isVideoFile(item.name);
    const screen = document.getElementById('lightboxScreen');

    screen.innerHTML = `
      <div class="lightbox-overlay" id="lightboxOverlay"></div>
      <div class="lightbox">
        <div class="lightbox__header">
          <span class="lightbox__position">${mediaIndex + 1} of ${media.length}</span>
          <button class="lightbox__btn" id="downloadLightboxBtn" title="Download">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          <button class="lightbox__btn" id="shareLightboxBtn" title="Share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          </button>
          <button class="lightbox__btn" id="closeLightboxBtn" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="lightbox__body">
          <button class="lightbox__nav lightbox__nav--prev" id="prevImageBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <div class="lightbox__image-container">
            ${isVideo ? `
              <video${item.blobUrl ? ` src="${item.blobUrl}"` : ''} class="lightbox__video" controls autoplay></video>
            ` : `
              <img${item.blobUrl ? ` src="${item.blobUrl}"` : ''} alt="${Utils.escapeHtml(item.name)}" class="lightbox__image">
            `}
          </div>

          <button class="lightbox__nav lightbox__nav--next" id="nextImageBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        <div class="lightbox__footer">
          <div class="lightbox__info">
            <strong>${Utils.escapeHtml(item.name)}</strong>
            <span>${Utils.formatFileSize(item.size)}</span>
          </div>
          <div class="lightbox__actions">
            <button class="btn btn--primary" id="deleteLightboxBtn">Delete</button>
          </div>
        </div>
      </div>
    `;
    this.showScreen('lightboxScreen');
  },

  renderUploadModal(albums) {
    const modal = document.getElementById('uploadModal');
    modal.innerHTML = `
      <div class="modal__overlay" id="uploadModalOverlay"></div>
      <div class="modal__content">
        <div class="modal__header">
          <h2>Upload Files</h2>
          <button class="modal__close" id="closeUploadModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="upload-step" id="uploadStep1">
          <div class="upload-dropzone" id="dropzone">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#007AFF" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <p>Click to select or drag and drop files here</p>
            <small>Supported: Images (JPG, PNG, GIF, WebP, BMP, SVG) & Videos (MP4, MOV, WebM, AVI, MKV) - max 50MB each</small>
            <input type="file" id="fileInput" multiple accept="image/*,video/*" hidden>
          </div>

          <div class="upload-preview" id="uploadPreview"></div>

          <div class="modal__footer">
            <button class="btn btn--secondary" id="cancelUploadBtn">Cancel</button>
            <button class="btn btn--primary" id="continueUploadBtn" disabled>Continue</button>
          </div>
        </div>
      </div>
    `;
    modal.showModal();
  },

  renderSettingsModal() {
    const prefs = Storage.getPreferences();
    const config = Storage.getConfig();

    const modal = document.getElementById('settingsModal');
    modal.innerHTML = `
      <div class="modal__overlay" id="settingsModalOverlay"></div>
      <div class="modal__content">
        <div class="modal__header">
          <h2>Settings</h2>
          <button class="modal__close" id="closeSettingsModal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="settings-form">
          <div class="form-group">
            <label for="settingsTheme">Theme</label>
            <select id="settingsTheme" class="form-control">
              <option value="light" ${prefs.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${prefs.theme === 'dark' ? 'selected' : ''}>Dark</option>
            </select>
          </div>

          <div class="form-group">
            <label for="settingsViewMode">Default View</label>
            <select id="settingsViewMode" class="form-control">
              <option value="grid" ${prefs.viewMode === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="list" ${prefs.viewMode === 'list' ? 'selected' : ''}>List</option>
            </select>
          </div>

          <div class="form-group">
            <label for="settingsSort">Sort By</label>
            <select id="settingsSort" class="form-control">
              <option value="date" ${prefs.sortBy === 'date' ? 'selected' : ''}>Date</option>
              <option value="name" ${prefs.sortBy === 'name' ? 'selected' : ''}>Name</option>
              <option value="size" ${prefs.sortBy === 'size' ? 'selected' : ''}>Size</option>
            </select>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="settingsAutoRefresh" ${config.autoRefresh ? 'checked' : ''}>
              Auto-refresh
            </label>
          </div>

          <div class="modal__footer">
            <button class="btn btn--secondary" id="resetSettingsBtn">Reset</button>
            <button class="btn btn--primary" id="saveSettingsBtn">Save</button>
          </div>
        </div>
      </div>
    `;
    modal.showModal();
  },

  showConfirmDialog(message, onConfirm) {
    const dialog = document.getElementById('confirmDialog');
    dialog.innerHTML = `
      <div class="modal__overlay"></div>
      <div class="modal__content modal__content--small">
        <div class="confirm-dialog">
          <p>${Utils.escapeHtml(message)}</p>
          <div class="modal__footer">
            <button class="btn btn--secondary" id="cancelConfirmBtn">Cancel</button>
            <button class="btn btn--danger" id="confirmActionBtn">Confirm</button>
          </div>
        </div>
      </div>
    `;
    dialog.showModal();
  },

  Notify: {
    container: null,

    init() {
      this.container = document.getElementById('notificationContainer');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
      }
    },

    show(message, type = 'info', duration = 3000) {
      this.init();
      const notification = document.createElement('div');
      notification.className = `notification notification--${type}`;
      notification.innerHTML = `
        <span>${message}</span>
        <button class="notification__close">&times;</button>
      `;

      notification.querySelector('.notification__close').addEventListener('click', () => {
        notification.classList.add('notification--removing');
        setTimeout(() => notification.remove(), 200);
      });

      this.container.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('notification--removing');
        setTimeout(() => notification.remove(), 200);
      }, duration);
    },

    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration || 5000); },
    info(message, duration) { this.show(message, 'info', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); }
  }
};
