class GitHubAPI {
  constructor(token, owner, privateRepo) {
    this.token = token;
    this.owner = owner;
    this.privateRepo = privateRepo;
    this.baseURL = 'https://api.github.com';
    this.rateLimitRemaining = 5000;
    this.rateLimitReset = 0;
    this.eventHandlers = {};
  }

  on(event, handler) {
    if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
    this.eventHandlers[event].push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers[event] || [];
    handlers.forEach(handler => handler(data));
    document.dispatchEvent(new CustomEvent(`github-api:${event}`, { detail: data }));
  }

  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;

    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      this.rateLimitRemaining = parseInt(
        response.headers.get('X-RateLimit-Remaining') || '5000'
      );
      this.rateLimitReset = parseInt(
        response.headers.get('X-RateLimit-Reset') || '0'
      );

      if (this.rateLimitRemaining < CONFIG.rateLimit.warningThreshold) {
        this.emit('rate-limit-warning', { remaining: this.rateLimitRemaining });
      }

      if (response.status === 401) {
        this.emit('auth-error', 'Token invalid or revoked');
        throw new Error('Unauthorized: Token invalid or revoked');
      }

      if (response.status === 403) {
        if (this.rateLimitRemaining === 0) {
          const resetDate = new Date(this.rateLimitReset * 1000);
          this.emit('rate-limit', { resetTime: this.rateLimitReset });
          throw new Error(`Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Forbidden');
      }

      if (response.status === 404) {
        throw new Error('Not found');
      }

      if (response.status === 409) {
        throw new Error('Conflict: File may already exist');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        this.emit('network-error', 'Network request failed');
        throw new Error('Network error: Check your internet connection');
      }
      this.emit('error', error.message);
      throw error;
    }
  }

  async getUser() {
    return this.request('GET', '/user');
  }

  async getRateLimit() {
    return this.request('GET', '/rate_limit');
  }

  async listAlbums() {
    const response = await this.request('GET', `/repos/${this.owner}/${this.privateRepo}/contents/albums`);
    return response.filter(item => item.type === 'dir');
  }

  async listMedia(albumName) {
    const response = await this.request('GET', `/repos/${this.owner}/${this.privateRepo}/contents/albums/${encodeURIComponent(albumName)}`);
    return response.filter(item =>
      item.type === 'file' &&
      /\.(jpg|jpeg|png|gif|webp|bmp|svg|mp4|mov|webm|avi|mkv)$/i.test(item.name)
    );
  }

  async getFileContent(path) {
    const response = await this.request('GET', `/repos/${this.owner}/${this.privateRepo}/contents/${path}`);
    if (response.encoding === 'base64' && response.content) {
      return JSON.parse(atob(response.content));
    }
    return response;
  }

  async uploadImage(albumName, filename, imageData) {
    const urlPath = `albums/${encodeURIComponent(albumName)}/${encodeURIComponent(filename)}`;
    const literalPath = `albums/${albumName}/${filename}`;

    if (imageData.byteLength > 1048576) {
      return this.uploadLargeFile(literalPath, filename, imageData);
    }

    return this.request('PUT', `/repos/${this.owner}/${this.privateRepo}/contents/${urlPath}`, {
      message: `Upload: ${filename}`,
      content: this.arrayBufferToBase64(imageData),
      branch: 'main'
    });
  }

  async uploadLargeFile(literalPath, filename, imageData) {
    const base64Content = this.arrayBufferToBase64(imageData);

    const blob = await this.request('POST', `/repos/${this.owner}/${this.privateRepo}/git/blobs`, {
      content: base64Content,
      encoding: 'base64'
    });

    const maxAttempts = 5;
    let lastError;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const ref = await this.request('GET', `/repos/${this.owner}/${this.privateRepo}/git/refs/heads/main`);
        const commitSha = ref.object.sha;

        const commit = await this.request('GET', `/repos/${this.owner}/${this.privateRepo}/git/commits/${commitSha}`);
        const baseTreeSha = commit.tree.sha;

        const newTree = await this.request('POST', `/repos/${this.owner}/${this.privateRepo}/git/trees`, {
          base_tree: baseTreeSha,
          tree: [
            {
              path: literalPath,
              mode: '100644',
              type: 'blob',
              sha: blob.sha
            }
          ]
        });

        const newCommit = await this.request('POST', `/repos/${this.owner}/${this.privateRepo}/git/commits`, {
          message: `Upload: ${filename}`,
          tree: newTree.sha,
          parents: [commitSha]
        });

        return this.request('PATCH', `/repos/${this.owner}/${this.privateRepo}/git/refs/heads/main`, {
          sha: newCommit.sha,
          force: attempt === maxAttempts - 1
        });
      } catch (error) {
        lastError = error;
        const msg = (error.message || '').toLowerCase();
        if (!msg.includes('fast-forward') && !msg.includes('fast forward')) throw error;
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    throw lastError;
  }

  async deleteFile(path, sha) {
    return this.request('DELETE', `/repos/${this.owner}/${this.privateRepo}/contents/${path}`, {
      message: `Delete: ${path.split('/').pop()}`,
      sha,
      branch: 'main'
    });
  }

  async deleteImage(albumName, filename, sha) {
    return this.deleteFile(`albums/${encodeURIComponent(albumName)}/${encodeURIComponent(filename)}`, sha);
  }

  async createAlbum(name) {
    const path = `albums/${encodeURIComponent(name)}/.gitkeep`;
    return this.request('PUT', `/repos/${this.owner}/${this.privateRepo}/contents/${path}`, {
      message: `Create album: ${name}`,
      content: '',
      branch: 'main'
    });
  }

  async deleteAlbum(albumName, sha) {
    const path = `albums/${encodeURIComponent(albumName)}`;
    return this.request('DELETE', `/repos/${this.owner}/${this.privateRepo}/contents/${path}`, {
      message: `Delete album: ${albumName}`,
      sha,
      branch: 'main'
    });
  }

  async getFileBlob(path) {
    const url = `${this.baseURL}/repos/${this.owner}/${this.privateRepo}/contents/${path}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
    return response.blob();
  }

  async getMediaBlobUrl(albumName, filename) {
    const path = `albums/${encodeURIComponent(albumName)}/${encodeURIComponent(filename)}`;
    const blob = await this.getFileBlob(path);
    return URL.createObjectURL(blob);
  }

  async getMediaDataUrl(albumName, filename) {
    const path = `albums/${encodeURIComponent(albumName)}/${encodeURIComponent(filename)}`;
    const blob = await this.getFileBlob(path);
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml' };
    const mime = mimeTypes[ext] || 'application/octet-stream';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  static supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }
}
