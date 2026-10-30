FROM node:20-bookworm-slim

# Install system audio utilities & headless download engines
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Persistent audio storage directory on Proxmox
RUN mkdir -p /data/music
ENV MUSIC_DIR=/data/music

EXPOSE 5000

CMD ["node", "index.js"]
