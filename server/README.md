# Breezy Proxmox Backend Server

High-performance, headless music streaming & autonomous audio downloader engine designed for Proxmox VE (LXC or VM).

## How It Works (Spotify Architecture)
1. **Zero Client Storage:** Your main PC or laptop stores **0 bytes** of music.
2. **On-Demand Headless Downloading:** When you click any song in Breezy on your PC, the Proxmox server checks if it has the track in `/data/music`. If not, it autonomously downloads the studio audio directly to Proxmox in seconds.
3. **Lossless Memory Streaming:** Proxmox streams the audio buffer over your network directly into Breezy's RAM on your PC (HTTP 206 Byte-Range Seeking).

---

## 1-Command Deployment on Proxmox VE

### Step 1: Open Terminal in your Proxmox Debian/Ubuntu Container or VM
Ensure Docker and Docker Compose are installed:
```bash
curl -fsSL https://get.docker.com | sh
```

### Step 2: Clone or Copy this Server Folder
```bash
git clone https://github.com/pietersensamuel088-ship-it/breezy.git
cd breezy/server
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d
```

### Step 4: Verify It's Running
```bash
curl http://localhost:5000/api/health
```
You will receive:
```json
{"status":"online","service":"Breezy Proxmox Master Streamer","mode":"on-demand-autonomous"}
```

---

## Connecting Breezy App to Proxmox
In your Breezy desktop app or browser:
1. Open settings or your profile.
2. Enter your Proxmox server IP:
   `http://<YOUR_PROXMOX_IP>:5000`
3. Enjoy your private on-demand Spotify cloud!
