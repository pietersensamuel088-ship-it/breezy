const net = require('net');
const os = require('os');
const path = require('path');
const fs = require('fs');

const DEFAULT_CLIENT_ID = '1182049870191296542';

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

  getSocketPath(id = 0) {
    if (process.platform === 'win32') {
      return `\\\\?\\pipe\\discord-rpc-${id}`;
    }
    const { env: { XDG_RUNTIME_DIR, TMPDIR, TMP, TEMP } } = process;
    const prefix = fs.realpathSync(XDG_RUNTIME_DIR || TMPDIR || TMP || TEMP || `${path.sep}tmp`);
    return path.join(prefix, `discord-rpc-${id}`);
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

  connect(pipeId = 0) {
    if (this.socket || this.isConnected || this.isHandshaking) return;
    if (pipeId > 9) {
      this.reconnectTimer = setTimeout(() => this.connect(0), 15000);
      return;
    }

    const socketPath = this.getSocketPath(pipeId);
    this.isHandshaking = true;

    try {
      const sock = net.createConnection(socketPath);

      sock.on('connect', () => {
        this.socket = sock;
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

          if (opcode === 1 && parsed.cmd === 'DISPATCH' && parsed.evt === 'READY') {
            this.isConnected = true;
            this.isHandshaking = false;
            console.log('[Discord RPC] Connected successfully to Discord client!');
            if (this.lastActivity) {
              this.sendActivity(this.lastActivity);
            }
          }
        } catch {}
      });

      sock.on('error', () => {
        this.cleanup();
        this.connect(pipeId + 1);
      });

      sock.on('close', () => {
        this.cleanup();
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => this.connect(0), 15000);
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

  setActivity({ title, artist, album, duration = 0, position = 0, isPlaying = true, coverUrl = '' }) {
    this.lastActivity = { title, artist, album, duration, position, isPlaying, coverUrl };
    if (!this.isConnected) {
      this.connect(0);
      return;
    }
    this.sendActivity(this.lastActivity);
  }

  sendActivity(act) {
    if (!this.socket || !this.isConnected) return;

    if (!act || !act.isPlaying) {
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

    const activityPayload = {
      cmd: 'SET_ACTIVITY',
      args: {
        pid: process.pid,
        activity: {
          details: act.title || 'Master Track',
          state: `by ${act.artist || 'Unknown'}`,
          timestamps: {
            start: Math.round(now - (act.position * 1000)),
            end: act.duration > 0 ? Math.round(now + remainingMs) : undefined,
          },
          assets: {
            large_image: act.coverUrl && act.coverUrl.startsWith('http') ? act.coverUrl : 'breezy_logo',
            large_text: act.album ? `${act.album} (Breezy 24-bit FLAC)` : 'Breezy // Master Audio',
            small_image: 'breezy_logo',
            small_text: 'Breezy Audiophile Stage',
          },
          buttons: [
            { label: 'Listen on Breezy', url: 'https://github.com/pietersensamuel088-ship-it/breezy' }
          ]
        },
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

const discordRpc = new DiscordRpc();
module.exports = { discordRpc };
