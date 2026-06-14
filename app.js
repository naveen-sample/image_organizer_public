class GalleryApp {
  constructor(config) {
    this.config = config;
    this.state = this.initializeState();
    this.api = null;
    this.uploadManager = null;
    this.currentScreen = 'login';
    this.init();
  }

  initializeState() {
    return {
      auth: {
        token: null,
        isAuthenticated: false,
        user: null
      },
      albums: {
        all: [],
        selected: null,
        loading: false,
        error: null
      },
      media: {
        all: [],
        selected: null,
        loading: false,
        cache: {},
        blobUrls: {}
      },
      upload: {
        files: [],
        selectedAlbum: null,
        inProgress: false,
        progress: 0,
        completed: [],
        errors: []
      },
      ui: {
        theme: localStorage.getItem('theme') || 'light',
        mobileMenuOpen: false,
        lightboxOpen: false,
        currentModal: null,
        searchQuery: ''
      }
    };
  }

  async init() {
    this.applyTheme(this.state.ui.theme);
    Storage.CacheManager.clearBlobCache();

    const token = Auth.getToken();
    if (token) {
      const validation = await Auth.validateToken(token);
      if (validation.valid) {
        this.state.auth.token = token;
        this.state.auth.isAuthenticated = true;
        this.state.auth.user = validation.user;
        this.api = new GitHubAPI(token, this.config.owner, this.config.privateRepo);
        this.setupAPIEvents();
        this.uploadManager = new UploadManager(this.api, this.state);
        await this.showHomeScreen();
      } else {
        Auth.logout();
        UI.renderLoginScreen();
      }
    } else {
      UI.renderLoginScreen();
    }

    this.setupGlobalEventListeners();
    UI.Notify.init();
  }

  setupAPIEvents() {
    this.api.on('auth-error', (msg) => {
      Auth.logout();
      UI.Notify.error('Authentication failed. Please login again.');
      UI.renderLoginScreen();
    });

    this.api.on('rate-limit-warning', (data) => {
      UI.Notify.warning(`Rate limit low: ${data.remaining} requests remaining`);
    });

    this.api.on('rate-limit', (data) => {
      const resetDate = new Date(data.resetTime * 1000);
      UI.Notify.error(`Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
    });

    this.api.on('network-error', (msg) => {
      UI.Notify.error('Network error. Please check your connection.');
    });
  }

  setupGlobalEventListeners() {
    document.addEventListener('click', (e) => {
      const albumCard = e.target.closest('.album-card');
      if (albumCard && albumCard.dataset.album) {
        this.showAlbum(albumCard.dataset.album);
        return;
      }

      if (albumCard && albumCard.id === 'createAlbumBtn') {
        this.createNewAlbum();
        return;
      }

      const imageCard = e.target.closest('.image-card');
      if (imageCard && imageCard.dataset.index !== undefined) {
        this.showLightbox(parseInt(imageCard.dataset.index));
        return;
      }
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-action]');
      if (link && link.dataset.action) {
        const action = link.dataset.action;
        if (this.state.ui.mobileMenuOpen) this.toggleMobileMenu();
        switch (action) {
          case 'home':
            this.showHomeScreen();
            return;
          case 'logout':
            this.logout();
            return;
        }
      }
    });

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[id]');
      if (!btn) return;
      const id = btn.id;

      switch (id) {
        case 'authenticateBtn':
          this.handleLogin();
          break;
        case 'learnMoreBtn':
          this.showLearnMore();
          break;
        case 'menuBtn':
        case 'closeMenuBtn':
        case 'mobileMenuOverlay':
          this.toggleMobileMenu();
          break;
        case 'themeBtn':
          this.toggleTheme();
          break;
        case 'uploadBtn':
          this.showUploadModal();
          break;
        case 'refreshBtn':
        case 'refreshHomeBtn':
        case 'refreshAlbumBtn':
          this.refreshCurrentScreen();
          break;
        case 'backToHomeBtn':
          this.showHomeScreen();
          break;
        case 'prevImageBtn':
          this.prevImage();
          break;
        case 'nextImageBtn':
          this.nextImage();
          break;
        case 'closeLightboxBtn':
        case 'lightboxOverlay':
          this.closeLightbox();
          break;
        case 'downloadLightboxBtn':
          this.downloadCurrentImage();
          break;
        case 'shareLightboxBtn':
          this.shareCurrentImage();
          break;
        case 'deleteLightboxBtn':
          this.deleteCurrentImage();
          break;
        case 'closeUploadModal':
        case 'uploadModalOverlay':
          this.closeUploadModal();
          break;
        case 'cancelUploadBtn':
          this.closeUploadModal();
          break;
        case 'continueUploadBtn':
          this.proceedToAlbumSelection();
          break;
        case 'closeSettingsModal':
        case 'settingsModalOverlay':
          this.closeSettingsModal();
          break;
        case 'saveSettingsBtn':
          this.saveSettings();
          break;
        case 'resetSettingsBtn':
          this.resetSettings();
          break;
        case 'confirmActionBtn':
          {
            const dialog = document.getElementById('confirmDialog');
            if (dialog && dialog._onConfirm) {
              dialog._onConfirm();
            }
          }
          break;
        case 'cancelConfirmBtn':
          document.getElementById('confirmDialog')?.close();
          break;
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'fileInput') {
        this.handleFileSelect(e.target.files);
      }
    });

    document.addEventListener('input', Utils.debounce((e) => {
      if (e.target.id === 'globalSearch') {
        this.state.ui.searchQuery = e.target.value;
        this.filterCurrentView();
      }
    }, 300));

    document.addEventListener('keydown', (e) => {
      if (this.state.ui.lightboxOpen) {
        if (e.key === 'ArrowLeft') { this.prevImage(); e.preventDefault(); }
        if (e.key === 'ArrowRight') { this.nextImage(); e.preventDefault(); }
        if (e.key === 'Escape') { this.closeLightbox(); e.preventDefault(); }
      }
    });

    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    document.addEventListener('dragenter', (e) => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone && dropzone.contains(e.target)) {
        dropzone.classList.add('upload-dropzone--active');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone && dropzone.contains(e.target)) {
        dropzone.classList.remove('upload-dropzone--active');
      }
    });

    document.addEventListener('drop', (e) => {
      const dropzone = document.getElementById('dropzone');
      if (dropzone && dropzone.contains(e.target)) {
        e.preventDefault();
        dropzone.classList.remove('upload-dropzone--active');
        if (e.dataTransfer.files.length > 0) {
          this.handleFileSelect(e.dataTransfer.files);
        }
      }
    });

    document.addEventListener('click', (e) => {
      const dropzone = document.getElementById('dropzone');
      const fileInput = document.getElementById('fileInput');
      if (dropzone && dropzone.contains(e.target) && fileInput) {
        fileInput.click();
      }
    });
  }

  async handleLogin() {
    const tokenInput = document.getElementById('tokenInput');
    if (!tokenInput) return;

    const token = tokenInput.value.trim();
    if (!token) {
      UI.Notify.error('Please enter a GitHub token');
      return;
    }

    const result = await Auth.login(token);
    if (result.success) {
      this.state.auth.token = token;
      this.state.auth.isAuthenticated = true;
      this.state.auth.user = result.user;
      this.api = new GitHubAPI(token, this.config.owner, this.config.privateRepo);
      this.setupAPIEvents();
      this.uploadManager = new UploadManager(this.api, this.state);
      UI.Notify.success(`Welcome, ${result.user.login}!`);
      await this.showHomeScreen();
    } else {
      UI.Notify.error(result.error || 'Authentication failed. Please check your token.');
    }
  }

  showLearnMore() {
    UI.Notify.info('Visit GitHub Settings → Developer Settings → Personal Access Tokens to create a token.', 6000);
  }

  async showHomeScreen() {
    this.currentScreen = 'home';
    const screen = document.getElementById('homeScreen');
    UI.showLoading(screen, 'Loading albums...');

    try {
      this.state.albums.loading = true;
      const albums = await this.api.listAlbums();

      const albumData = albums.map(album => {
        const cached = Storage.CacheManager.get(`album:${album.name}`);
        return {
          name: album.name,
          displayName: Utils.formatAlbumName(album.name),
          path: album.path,
          lastUpdated: album.updated_at || new Date().toISOString(),
          mediaCount: cached ? (cached.mediaCount || cached.imageCount || 0) : 0,
          sha: album.sha,
          thumbnailUrl: null
        };
      });

      this.state.albums.all = albumData;

      UI.showLoading(screen, 'Loading previews...');
      await this.loadAlbumThumbnails();

      this.state.albums.loading = false;
      Storage.CacheManager.set('albums', albumData, CONFIG.cache.albumsTTL);
      UI.renderHomeScreen(albumData);

      this.updateHeaderVisibility(true);
    } catch (error) {
      this.state.albums.loading = false;
      UI.Notify.error(error.message || 'Failed to load albums');
      UI.showError(screen, error.message || 'Failed to load albums');
    }
  }

  async showAlbum(albumName) {
    this.currentScreen = 'album';
    this.state.albums.selected = albumName;

    const screen = document.getElementById('albumScreen');

    this.revokeMediaBlobUrls();

    try {
      const mediaItems = await this.api.listMedia(albumName);

      const mediaData = mediaItems.map(item => ({
        name: item.name,
        path: item.path,
        size: item.size,
        download_url: item.download_url,
        sha: item.sha,
        type: item.type,
        blobUrl: null
      }));

      this.state.media.all = mediaData;
      this.state.media.selected = null;

      Storage.CacheManager.set(`media:${albumName}`, mediaData, CONFIG.cache.imagesTTL);
      UI.renderAlbumScreen(mediaData, albumName);

      this.loadMediaBlobUrls();

      const album = this.state.albums.all.find(a => a.name === albumName);
      if (album) {
        album.mediaCount = mediaData.length;
        Storage.CacheManager.set(`album:${albumName}`, { mediaCount: mediaData.length }, CONFIG.cache.albumsTTL);
      }
    } catch (error) {
      UI.Notify.error(error.message || 'Failed to load files');
      UI.showError(screen, error.message || 'Failed to load files');
    }
  }

  async loadMediaBlobUrls() {
    const albumName = this.state.albums.selected;
    for (let i = 0; i < this.state.media.all.length; i++) {
      const item = this.state.media.all[i];
      const cacheKey = `blob:${albumName}/${item.name}`;
      const cached = this.state.media.blobUrls[cacheKey];
      if (cached) {
        item.blobUrl = cached;
        this.updateMediaCard(i, cached);
        continue;
      }
      this.loadSingleBlobUrl(i, item, albumName, cacheKey);
    }
  }

  async loadSingleBlobUrl(index, item, albumName, cacheKey) {
    try {
      const blobUrl = await this.api.getMediaBlobUrl(albumName, item.name);
      item.blobUrl = blobUrl;
      this.state.media.blobUrls[cacheKey] = blobUrl;
      this.updateMediaCard(index, blobUrl);
      this.updateLightboxMedia(item);
    } catch {
      console.warn(`Failed to load: ${item.name}`);
    }
  }

  updateLightboxMedia(item) {
    if (!this.state.ui.lightboxOpen) return;
    const current = this.state.media.all[this.state.media.selected];
    if (!current || current.name !== item.name) return;
    const isVideo = Utils.isVideoFile(item.name);
    const el = document.querySelector(isVideo ? '.lightbox__video' : '.lightbox__image');
    if (el) {
      el.src = item.blobUrl;
      if (isVideo) el.load();
    }
  }

  updateMediaCard(index, blobUrl) {
    const card = document.querySelector(`.image-card[data-index="${index}"]`);
    if (!card) return;
    const item = this.state.media.all[index];
    if (!item) return;
    const isVideo = Utils.isVideoFile(item.name);
    const mediaEl = card.querySelector(isVideo ? 'video' : 'img');
    if (mediaEl) {
      mediaEl.src = blobUrl;
      mediaEl.classList.add('card__image--loaded');
    }
  }

  revokeMediaBlobUrls() {
    Object.values(this.state.media.blobUrls).forEach(url => {
      try { URL.revokeObjectURL(url); } catch {}
    });
    this.state.media.blobUrls = {};
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith('cache:blob:')) {
        localStorage.removeItem(k);
      }
    });
  }

  async loadAlbumThumbnails() {
    const promises = this.state.albums.all.map(async (album) => {
      try {
        const media = await this.api.listMedia(album.name);
        if (media.length === 0) return;
        const first = media[0];
        if (Utils.isVideoFile(first.name)) return;
        album.thumbnailUrl = await this.api.getMediaDataUrl(album.name, first.name);
      } catch (e) {
        console.warn(`Thumbnail failed for ${album.name}:`, e);
      }
    });
    await Promise.all(promises);
  }

  showLightbox(mediaIndex) {
    const mediaItems = this.state.media.all;
    if (!mediaItems || mediaItems.length === 0) return;

    this.state.media.selected = mediaIndex;
    this.state.ui.lightboxOpen = true;
    UI.renderLightbox(mediaIndex, mediaItems, this.state.albums.selected);

    const item = mediaItems[mediaIndex];
    if (item && !item.blobUrl) {
      const albumName = this.state.albums.selected;
      const cacheKey = `blob:${albumName}/${item.name}`;
      this.loadSingleBlobUrl(mediaIndex, item, albumName, cacheKey);
    }
  }

  prevImage() {
    const current = this.state.media.selected;
    if (current > 0) {
      this.showLightbox(current - 1);
    }
  }

  nextImage() {
    const current = this.state.media.selected;
    if (current < this.state.media.all.length - 1) {
      this.showLightbox(current + 1);
    }
  }

  closeLightbox() {
    this.state.ui.lightboxOpen = false;
    const video = document.querySelector('.lightbox__video');
    if (video) video.pause();
    this.state.media.selected = null;
    document.getElementById('lightboxScreen').classList.add('hidden');
    document.getElementById('albumScreen').classList.remove('hidden');
    this.currentScreen = 'album';
  }

  async downloadCurrentImage() {
    const item = this.state.media.all[this.state.media.selected];
    if (!item) return;

    if (!CONFIG.features.downloadEnabled) {
      UI.Notify.info('Download is disabled');
      return;
    }

    try {
      let blobUrl = item.blobUrl;
      if (!blobUrl) {
        const albumName = this.state.albums.selected;
        blobUrl = await this.api.getMediaBlobUrl(albumName, item.name);
        item.blobUrl = blobUrl;
      }

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      UI.Notify.success('Download started');
    } catch (err) {
      UI.Notify.error('Download failed: ' + (err.message || 'Unknown error'));
    }
  }

  shareCurrentImage() {
    if (!CONFIG.features.shareEnabled) {
      UI.Notify.info('Sharing is disabled');
      return;
    }

    const item = this.state.media.all[this.state.media.selected];
    if (!item) return;

    const shareUrl = `${window.location.origin}${window.location.pathname}?album=${encodeURIComponent(this.state.albums.selected)}&media=${encodeURIComponent(item.name)}`;

    if (navigator.share) {
      navigator.share({ title: item.name, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        UI.Notify.success('Link copied to clipboard');
      }).catch(() => {
        UI.Notify.error('Failed to copy link');
      });
    }
  }

  deleteCurrentImage() {
    if (!CONFIG.features.deleteEnabled) {
      UI.Notify.info('Delete is disabled');
      return;
    }

    const item = this.state.media.all[this.state.media.selected];
    if (!item) return;

    UI.showConfirmDialog(`Delete "${item.name}"? This cannot be undone.`, async () => {
      document.getElementById('confirmDialog')?.close();
      UI.showLoaderOverlay('Deleting...');

      try {
        await this.api.deleteImage(this.state.albums.selected, item.name, item.sha);
      } catch (error) {
        UI.hideLoaderOverlay();
        UI.Notify.error(error.message || 'Failed to delete file');
        return;
      }

      setTimeout(() => {
        UI.hideLoaderOverlay();
        this.revokeMediaBlobUrls();
        this.closeLightbox();
        this.showAlbum(this.state.albums.selected);
      }, 60000);
    });
  }

  async showUploadModal() {
    if (!CONFIG.features.uploadEnabled) {
      UI.Notify.info('Upload is disabled');
      return;
    }
    this.state.upload.files = [];
    this.state.upload.errors = [];
    UI.renderUploadModal(this.state.albums.all);
  }

  closeUploadModal() {
    document.getElementById('uploadModal')?.close();
    this.state.upload.files = [];
    this.state.upload.errors = [];
  }

  handleFileSelect(files) {
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      if (file.size > CONFIG.files.maxFileSize) {
        errors.push(`${file.name} is too large (max 50MB)`);
        continue;
      }

      const ext = Utils.getFileExtension(file.name);
      if (!CONFIG.files.supportedFormats.includes(ext)) {
        errors.push(`${file.name} is not a supported format`);
        continue;
      }

      validFiles.push(file);
    }

    this.state.upload.files = validFiles;
    this.state.upload.errors = errors;

    const continueBtn = document.getElementById('continueUploadBtn');
    if (continueBtn) {
      continueBtn.disabled = validFiles.length === 0;
    }

    this.renderUploadPreview(validFiles, errors);
  }

  renderUploadPreview(files, errors) {
    const preview = document.getElementById('uploadPreview');
    if (!preview) return;

    let html = `<p class="upload-count">${files.length} file(s) selected</p>`;

    if (files.length > 0) {
      html += '<div class="upload-file-list">';
      files.forEach(file => {
        html += `
          <div class="upload-file-item">
            <span class="upload-file-name">${Utils.escapeHtml(file.name)}</span>
            <span class="upload-file-size">${Utils.formatFileSize(file.size)}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    if (errors.length > 0) {
      html += '<div class="upload-errors">';
      errors.forEach(err => {
        html += `<p class="upload-error">${Utils.escapeHtml(err)}</p>`;
      });
      html += '</div>';
    }

    preview.innerHTML = html;
  }

  proceedToAlbumSelection() {
    const step1 = document.getElementById('uploadStep1');
    if (!step1) return;

    const albums = this.state.albums.all;
    step1.innerHTML = `
      <div class="upload-step" id="uploadStep2">
        <h3>Select Album</h3>

        <div class="form-group">
          <label for="albumSelect">Choose an album</label>
          <select id="albumSelect" class="form-control">
            <option value="">-- Select Album --</option>
            ${albums.map(a => `<option value="${Utils.escapeHtml(a.name)}">${Utils.escapeHtml(a.displayName)}</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label>Or create a new album</label>
          <input type="text" id="newAlbumName" class="form-control" placeholder="New album name">
        </div>

        <div class="upload-preview">
          <p>${this.state.upload.files.length} file(s) to upload</p>
          <div class="upload-file-list">
            ${this.state.upload.files.map(f => `
              <div class="upload-file-item">
                <span class="upload-file-name">${Utils.escapeHtml(f.name)}</span>
                <span class="upload-file-size">${Utils.formatFileSize(f.size)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="modal__footer">
          <button class="btn btn--secondary" id="backToStep1Btn">Back</button>
          <button class="btn btn--primary" id="startUploadBtn">Upload</button>
        </div>
      </div>
    `;

    document.getElementById('backToStep1Btn').addEventListener('click', () => this.showUploadModal());
    document.getElementById('startUploadBtn').addEventListener('click', () => this.startUpload());
  }

  async startUpload() {
    const albumSelect = document.getElementById('albumSelect');
    const newAlbumName = document.getElementById('newAlbumName');
    let albumName = albumSelect?.value;

    if (!albumName && newAlbumName?.value.trim()) {
      albumName = newAlbumName.value.trim().replace(/\s+/g, '_');
    }

    if (!albumName) {
      UI.Notify.error('Please select or create an album');
      return;
    }

    const step2 = document.getElementById('uploadStep2');
    if (!step2) return;

    step2.innerHTML = `
      <div class="upload-step" id="uploadStep3">
        <h3>Uploading to: ${Utils.escapeHtml(Utils.formatAlbumName(albumName))}</h3>
        <div class="upload-progress-container" id="uploadProgressContainer">
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" id="uploadProgressFill" style="width: 0%"></div>
          </div>
          <p class="upload-progress-text" id="uploadProgressText">Starting upload...</p>
        </div>
        <div class="upload-file-list" id="uploadFileProgress">
          ${this.state.upload.files.map(f => `
            <div class="upload-file-item" data-filename="${Utils.escapeHtml(f.name)}">
              <span class="upload-file-name">${Utils.escapeHtml(f.name)}</span>
              <span class="upload-file-status pending">Pending</span>
            </div>
          `).join('')}
        </div>
        <div class="upload-actions" id="uploadActions">
          <button class="btn btn--secondary btn--full" id="cancelUploadProcessBtn">Cancel Upload</button>
        </div>
      </div>
    `;

    const cancelBtn = document.getElementById('cancelUploadProcessBtn');
    cancelBtn.addEventListener('click', () => {
      this.closeUploadModal();
      UI.Notify.info('Upload cancelled');
    });

    try {
      const result = await this.uploadManager.uploadFiles(this.state.upload.files, albumName, (filename, status, progress) => {
        this.updateUploadProgress(filename, status, progress);
      });

      const errors = this.uploadManager.uploadQueue.filter(t => t.status === 'error');
      const succeeded = this.uploadManager.uploadQueue.filter(t => t.status === 'completed');

      const actions = document.getElementById('uploadActions');
      if (actions) {
        cancelBtn.remove();
        const doneBtn = document.createElement('button');
        doneBtn.className = 'btn btn--primary btn--full';
        doneBtn.textContent = 'Done';
        doneBtn.addEventListener('click', () => {
          this.closeUploadModal();
          if (this.currentScreen === 'album' && this.state.albums.selected === albumName) {
            this.showAlbum(albumName);
          } else {
            this.showHomeScreen();
          }
        });
        actions.appendChild(doneBtn);
      }

      if (errors.length > 0) {
        const errorList = errors.map(e => `<div class="upload-error">${Utils.escapeHtml(e.file.name)}: ${Utils.escapeHtml(e.error || 'Failed')}</div>`).join('');
        const summary = document.getElementById('uploadFileProgress');
        if (summary) {
          summary.innerHTML += `<div class="upload-errors"><p class="upload-error" style="font-weight:600;margin-bottom:6px">${errors.length} file(s) failed:</p>${errorList}</div>`;
        }
      }

      if (succeeded.length > 0) {
        UI.Notify.success(`${succeeded.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      UI.Notify.error(error.message || 'Upload failed');
    }
  }

  updateUploadProgress(filename, status, progress) {
    const items = document.querySelectorAll('.upload-file-item');
    items.forEach(item => {
      if (item.dataset.filename === filename) {
        const statusEl = item.querySelector('.upload-file-status');
        if (statusEl) {
          statusEl.textContent = status;
          statusEl.className = `upload-file-status ${status}`;
        }
      }
    });

    const fill = document.getElementById('uploadProgressFill');
    const text = document.getElementById('uploadProgressText');
    if (fill && text) {
      fill.style.width = `${Math.min(progress, 100)}%`;
      text.textContent = `${Math.round(progress)}% complete`;
    }
  }

  toggleTheme() {
    const newTheme = this.state.ui.theme === 'light' ? 'dark' : 'light';
    this.state.ui.theme = newTheme;
    this.applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    UI.Notify.info(`Switched to ${newTheme} mode`);
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  toggleMobileMenu(forceClose) {
    this.state.ui.mobileMenuOpen = forceClose !== undefined ? !forceClose : !this.state.ui.mobileMenuOpen;
    const menu = document.getElementById('mobileMenu');
    if (menu) {
      menu.classList.toggle('open', this.state.ui.mobileMenuOpen);
      document.body.classList.toggle('mobile-menu-open', this.state.ui.mobileMenuOpen);
    }
  }

  showSettingsModal() {
    UI.renderSettingsModal();
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
    document.getElementById('resetSettingsBtn').addEventListener('click', () => this.resetSettings());
  }

  closeSettingsModal() {
    document.getElementById('settingsModal')?.close();
  }

  saveSettings() {
    const theme = document.getElementById('settingsTheme')?.value;
    const viewMode = document.getElementById('settingsViewMode')?.value;
    const sortBy = document.getElementById('settingsSort')?.value;
    const autoRefresh = document.getElementById('settingsAutoRefresh')?.checked;

    if (theme) {
      this.state.ui.theme = theme;
      this.applyTheme(theme);
    }

    Storage.setPreferences({ theme, viewMode, sortBy, imagesPerPage: 24 });
    Storage.setConfig({ ...Storage.getConfig(), autoRefresh });

    this.closeSettingsModal();
    UI.Notify.success('Settings saved');
  }

  resetSettings() {
    localStorage.removeItem('preferences');
    localStorage.removeItem('config');
    localStorage.removeItem('theme');
    this.state.ui.theme = 'light';
    this.applyTheme('light');
    this.closeSettingsModal();
    UI.Notify.info('Settings reset to defaults');
  }

  async createNewAlbum() {
    const name = prompt('Enter album name:');
    if (!name || !name.trim()) return;

    const albumName = name.trim().replace(/\s+/g, '_');

    try {
      await this.api.createAlbum(albumName);
      UI.Notify.success(`Album '${name.trim()}' created`);
      await this.showHomeScreen();
    } catch (error) {
      UI.Notify.error(error.message || 'Failed to create album');
    }
  }

  async refreshCurrentScreen() {
    Storage.CacheManager.clear();
    if (this.currentScreen === 'home') {
      await this.showHomeScreen();
    } else if (this.currentScreen === 'album' && this.state.albums.selected) {
      await this.showAlbum(this.state.albums.selected);
    }
  }

  filterCurrentView() {
    const query = this.state.ui.searchQuery.toLowerCase();
    if (this.currentScreen === 'home') {
      const filtered = this.state.albums.all.filter(a =>
        a.name.toLowerCase().includes(query) ||
        Utils.formatAlbumName(a.name).toLowerCase().includes(query)
      );
      UI.renderHomeScreen(filtered);
    } else if (this.currentScreen === 'album') {
      const filtered = this.state.media.all.filter(item =>
        item.name.toLowerCase().includes(query)
      );
      UI.renderAlbumScreen(filtered, this.state.albums.selected);
    }
  }

  updateHeaderVisibility(isAuthenticated) {
    const header = document.getElementById('header');
    if (header) {
      header.classList.toggle('header--hidden', !isAuthenticated);
    }
  }

  async logout() {
    Auth.logout();
    this.state = this.initializeState();
    this.api = null;
    this.uploadManager = null;
    this.updateHeaderVisibility(false);
    UI.renderLoginScreen();
    UI.Notify.info('Logged out successfully');
  }
}

class UploadManager {
  constructor(api, appState) {
    this.api = api;
    this.appState = appState;
    this.uploadQueue = [];
    this.currentUploads = new Map();
    this.maxConcurrent = CONFIG.upload.maxConcurrentUploads || 3;
  }

  async uploadFiles(files, albumName, progressCallback) {
    const albumExists = this.appState.albums.all.find(a => a.name === albumName);
    if (!albumExists) {
      await this.createAlbum(albumName);
    }

    this.uploadQueue = files.map(file => ({
      file,
      albumName,
      progress: 0,
      status: 'pending',
      error: null
    }));

    return this.processUploadQueue(progressCallback);
  }

  async processUploadQueue(progressCallback) {
    const totalFiles = this.uploadQueue.length;
    let completedCount = 0;
    let errorCount = 0;

    while (this.uploadQueue.length > 0 || this.currentUploads.size > 0) {
      while (this.uploadQueue.length > 0 && this.currentUploads.size < this.maxConcurrent) {
        const task = this.uploadQueue.shift();
        this.uploadSingleFile(task, progressCallback).catch(() => {});
      }

      if (this.currentUploads.size > 0) {
        const results = await Promise.race(Array.from(this.currentUploads.entries()).map(async ([id, promise]) => {
          try {
            await promise;
            return { id, status: 'ok' };
          } catch {
            return { id, status: 'error' };
          }
        }));
        if (results) {
          this.currentUploads.delete(results.id);
          if (results.status === 'ok') completedCount++;
          else errorCount++;
        }
      }

      if (progressCallback) {
        const doneCount = completedCount + errorCount;
        const overallProgress = totalFiles === 0 ? 100 : (doneCount / totalFiles) * 100;
        progressCallback('all', 'uploading', overallProgress);
      }
    }
    return { completedCount, errorCount };
  }

  async uploadSingleFile(task, progressCallback) {
    const taskId = Utils.generateId();
    const promise = this.doUpload(task, taskId, progressCallback);
    this.currentUploads.set(taskId, promise);
    await promise;
  }

  async doUpload(task, taskId, progressCallback) {
    try {
      task.status = 'uploading';
      if (progressCallback) {
        progressCallback(task.file.name, 'Uploading...', 0);
      }

      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(task.file);
      });

      if (progressCallback) {
        progressCallback(task.file.name, 'Encoding...', 50);
      }

      const filename = Utils.sanitizeFilename(task.file.name);

      await this.api.uploadImage(task.albumName, filename, data);

      task.status = 'completed';
      task.progress = 100;

      if (progressCallback) {
        progressCallback(task.file.name, 'Completed', 100);
      }
    } catch (error) {
      task.status = 'error';
      task.error = error.message;
      if (progressCallback) {
        progressCallback(task.file.name, error.message || 'Failed', 0);
      }
      throw error;
    }
  }

  async createAlbum(name) {
    try {
      await this.api.createAlbum(name);
      this.appState.albums.all.push({
        name,
        displayName: Utils.formatAlbumName(name),
        imageCount: 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      if (error.message.includes('Conflict')) {
        return;
      }
      throw new Error(`Failed to create album: ${error.message}`);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new GalleryApp(CONFIG);
});

window.addEventListener('popstate', () => {
  if (window.app) {
    const params = new URLSearchParams(window.location.search);
    const album = params.get('album');
    const image = params.get('image');

    if (image && album) {
      window.app.showAlbum(album);
      setTimeout(() => {
        const idx = window.app.state.media.all.findIndex(i => i.name === image);
        if (idx !== -1) window.app.showLightbox(idx);
      }, 500);
    } else if (album) {
      window.app.showAlbum(album);
    } else {
      window.app.showHomeScreen();
    }
  }
});
