import net from 'net';
import os from 'os';
import path from 'path';
import fs from 'fs';

const DEFAULT_CLIENT_ID = '383226320970055681'; // Verified Universal Active RPC Application ID

class DiscordRpc {
  constructor(clientId = DEFAULT_CLIENT_ID) {
    this.clientId = clientId;
    this.socket = null;
    this.isConnected = false;
    this.isHandshaking = false;
    this.lastActivity = null;
    this.reconnectTimer = null;

    this.connect();
  }

  getSocketPath(id = 0, variant = 0) {
    const type = variant === 0 ? 'ipc' : 'rpc';
    if (process.platform === 'win32') {
      return `\\\\.\\pipe\\discord-${type}-${id}`;
    }
    const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
    const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
    return path.join(prefix, `discord-${type}-${id}`);
  }

  encodeFrame(opcode, data) {
    const json = JSON.stringify(data);
    const len = Buffer.byteLength(json);
    const buf = Buffer.alloc(8 + len);
    buf.writeInt32LE(opcode, 0);
    buf.writeInt32LE(len, 4);
    buf.write(json, 8, len, 'utf8');
    return buf;
  }

  connect(pipeId = 0, variant = 0) {
    if (this.socket || this.isConnected || this.isHandshaking) return;
    if (pipeId > 9) {
      if (variant === 0) {
        // Try fallback to rpc prefix
        return this.connect(0, 1);
      }
      // Re-try in 15 seconds if Discord was not running
      this.reconnectTimer = setTimeout(() => this.connect(0, 0), 15000);
      return;
    }

    const socketPath = this.getSocketPath(pipeId, variant);
    this.isHandshaking = true;

    try {
      const sock = net.createConnection(socketPath);

      sock.on('connect', () => {
        this.socket = sock;
        // Handshake: Opcode 0
        const handshake = this.encodeFrame(0, { v: 1, client_id: this.clientId });
        sock.write(handshake);
      });

      sock.on('data', (data) => {
        try {
          if (data.length < 8) return;
          const opcode = data.readInt32LE(0);
          const len = data.readInt32LE(4);
          const raw = data.slice(8, 8 + len).toString('utf8');
          const parsed = JSON.parse(raw);

          if (parsed.code === 4000) {
            console.warn(`[Discord RPC] Note: Discord returned code 4000 (${parsed.message || 'Invalid Client ID'}). A Discord Application ID can be set in Settings.`);
            this.cleanup();
            return;
          }

          if (opcode === 1 && parsed.cmd === 'DISPATCH' && parsed.evt === 'READY') {
            this.isConnected = true;
            this.isHandshaking = false;
            console.log('[Discord RPC] Connected successfully to Discord client via', socketPath);
            if (this.lastActivity) {
              this.sendActivity(this.lastActivity);
            }
          }
        } catch {}
      });

      sock.on('error', () => {
        this.cleanup();
        // Try next pipe (discord-ipc-1, etc.)
        this.connect(pipeId + 1, variant);
      });

      sock.on('close', () => {
        this.cleanup();
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => this.connect(0, 0), 15000);
        }
      });
    } catch {
      this.cleanup();
    }
  }

  cleanup() {
    this.isConnected = false;
    this.isHandshaking = false;
    if (this.socket) {
      try { this.socket.destroy(); } catch {}
      this.socket = null;
    }
  }

  setActivity({ title, artist, album, duration = 0, position = 0, isPlaying = true, coverUrl = '', clientId = '' }) {
    if (clientId && clientId !== this.clientId) {
      this.clientId = clientId;
      this.cleanup();
      this.connect(0, 0);
    }
    this.lastActivity = { title, artist, album, duration, position, isPlaying, coverUrl };
    if (!this.isConnected) {
      this.connect(0, 0);
      return;
    }
    this.sendActivity(this.lastActivity);
  }

  sendActivity(act) {
    if (!this.socket || !this.isConnected) return;

    if (!act || !act.isPlaying) {
      // Clear activity when paused
      const clearPayload = this.encodeFrame(1, {
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid,
          activity: null,
        },
        nonce: Math.random().toString(),
      });
      try { this.socket.write(clearPayload); } catch {}
      return;
    }

    const now = Date.now();
    const remainingMs = Math.max(0, (act.duration - act.position) * 1000);

    const activity = {
      type: 2, // 2 = LISTENING to
      details: (act.title || 'Master Track').slice(0, 128),
      state: `by ${(act.artist || 'Unknown')}`.slice(0, 128),
      timestamps: {
        start: Math.round(now - (act.position * 1000)),
        ...(act.duration > 0 ? { end: Math.round(now + remainingMs) } : {}),
      },
    };

    if (act.coverUrl && act.coverUrl.startsWith('http')) {
      activity.assets = {
        large_image: act.coverUrl,
        large_text: (act.album || 'Breezy Master Audio').slice(0, 128),
      };
    }

    const activityPayload = {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity,
      },
      nonce: Math.random().toString(),
    };

    try {
      this.socket.write(this.encodeFrame(1, activityPayload));
    } catch (err) {
      console.warn('[Discord RPC Write Error]', err.message);
    }
  }
}

export const discordRpc = new DiscordRpc();
