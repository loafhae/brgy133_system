#!/bin/bash
# ============================================================
# Vision-Trak Raspberry Pi 5 Auto-Stream & Cloudflare Broadcaster
# ============================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "============================================================"
echo "  Vision-Trak Raspberry Pi 5 Live Stream Broadcaster"
echo "============================================================"
echo ""

# 1. Check for / install cloudflared on Raspberry Pi (ARM64)
if ! command -v cloudflared &> /dev/null; then
    if [ ! -f "$DIR/cloudflared" ]; then
        echo "[INFO] Downloading cloudflared for Raspberry Pi (ARM64)..."
        wget -q --show-progress -O "$DIR/cloudflared" https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
        chmod +x "$DIR/cloudflared"
    fi
    CF="$DIR/cloudflared"
else
    CF="cloudflared"
fi

# 2. Check for backend URL configuration
if [ -f "$DIR/tunnel_be_url.txt" ]; then
    BE_URL=$(cat "$DIR/tunnel_be_url.txt" | tr -d '\r\n')
    echo "[CONFIG] Central Backend URL: $BE_URL"
fi

# 3. Start detector.py in background
echo "[1/2] Starting AI Detector & Stream on port 8080..."
python3 "$DIR/detector.py" "$@" > "$DIR/detector.log" 2>&1 &
DETECTOR_PID=$!

sleep 3

# 4. Start Cloudflare Tunnel for Port 8080 (Broadcast stream to the internet)
echo "[2/2] Starting Cloudflare Tunnel for Live Stream..."
rm -f "$DIR/tunnel_stream.log" "$DIR/tunnel_stream_url.txt"

"$CF" tunnel --url http://localhost:8080 > "$DIR/tunnel_stream.log" 2>&1 &
TUNNEL_PID=$!

echo "[INFO] Generating public stream link (up to 20s)..."
for i in {1..20}; do
    sleep 1
    if [ -f "$DIR/tunnel_stream.log" ]; then
        STREAM_URL=$(grep -o 'https://[-.a-zA-Z0-9]*\.trycloudflare\.com' "$DIR/tunnel_stream.log" | head -n 1)
        if [ -n "$STREAM_URL" ]; then
            echo "$STREAM_URL" > "$DIR/tunnel_stream_url.txt"
            break
        fi
    fi
done

echo ""
echo "============================================================"
echo "  LIVE BROADCAST ACTIVE!"
echo "============================================================"
if [ -n "$STREAM_URL" ]; then
    echo "  Public Stream URL : $STREAM_URL"
else
    echo "  Check tunnel_stream.log for the generated link."
fi
echo "  Local Network URL : http://$(hostname -I | awk '{print $1}'):8080/"
echo "============================================================"
echo "Press Ctrl+C to stop broadcasting."
echo ""

# Trap exit to cleanly shut down background processes
trap "echo 'Stopping stream...'; kill $DETECTOR_PID $TUNNEL_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait $TUNNEL_PID
