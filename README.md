# NyxMesh 🚀

**Enhanced P2P Distributed Computing — Browser-Only**

NyxMesh turns your browser into a distributed compute node.  
No backend. No accounts. No deploy. Just open the HTML file and start trading compute tasks over WebRTC.

---

## ✨ Features

- **P2P over WebRTC** — Coordinator/Worker roles with manual copy/paste signaling (no server required).
- **Built-in Task Library**:
  - Matrix Multiplication
  - Prime Search
  - Mandelbrot Set
  - Array Sort
  - Hash Mining
  - Monte Carlo π
- **Live Metrics** — GFLOPS, latency, success rate, throughput (coming soon).
- **Resource Offers** — Share available threads/bandwidth with peers.
- **Activity Log & Export** — Persistent in page logs with JSON export.
- **System Capability Probe** — Detects WebRTC, WebGPU, CPU cores, memory.

---

## 📂 Getting Started

### 1. Clone or Download
```bash
git clone https://github.com/ImZackAdams/nyx-mesh.git
cd nyxmesh
```

Or just download the HTML file directly.

### 2. Open in Your Browser
No build step. No dependencies.

```bash
# macOS
open nyxmesh.html

# Linux
xdg-open nyxmesh.html

# Windows
start nyxmesh.html
```

You can also just drag the file into a browser window.

---

## 🖥️ Demo Instructions

NyxMesh runs entirely client side, so you need two browser windows/tabs (or two different machines) to connect.

### Step 1 — Assign Roles
- One peer selects **📡 Coordinator** (default).
- The other selects **⚙️ Worker**.

### Step 2 — Create an Offer
On the **Coordinator**:
1. Click **Create Offer/Answer**.
2. Wait for "Offer ready" status.
3. Click **📋 Copy** to copy the JSON description.

### Step 3 — Set Remote (Worker)
On the **Worker**:
1. Paste the Coordinator's JSON into "Paste peer's description".
2. Click **Set Remote**.
3. Click **Create Offer/Answer** (this generates the Worker's answer).
4. Copy the Worker's JSON.

### Step 4 — Set Remote (Coordinator)
On the **Coordinator**:
1. Paste the Worker's JSON into "Paste peer's description".
2. Click **Set Remote**.

If all went well, the **Channel** pill will turn green and say **open**.

### Step 5 — Run Tasks
- **Single Task**: Select a task type and problem size → **▶️ Run Task**.
- **Batch**: Send a mix of tasks with **🚀 Run Batch (10)**.
- **Stress Test**: Flood the Worker for 10 seconds.

Worker computes and returns results, Coordinator logs GFLOPS and updates metrics.

---

## 📊 UI Overview

### Left Panel — Peer Setup
- Capability detection (WebRTC, WebGPU, CPU, Memory)
- Role selection
- Resource limits (Max Threads, Bandwidth)
- Offer/Answer textareas
- Connection health (Peer/ICE/Channel state, Latency, Throughput)

### Right Panel — Compute Dashboard
- Task selector & problem size
- Execution controls
- Performance metrics & mini chart
- Inbound/Outbound stats
- Activity log

---

## 🛠 Technical Notes

- **Transport**: WebRTC RTCDataChannel (`ordered: true`, `maxRetransmits: 3`)
- **Signaling**: Manual JSON copy/paste (no STUN/TURN servers beyond Google public STUN; no relay fallback)
- **Compute**: Runs in main JS thread — heavy tasks will block UI (consider moving to Web Workers for production use)
- **Result Integrity**: SHA256 hash of output array returned with performance metadata

---

## ⚠️ Limitations

- **No TURN** — peers behind restrictive NAT/firewalls may fail to connect.
- **UI Blocking** — large problem sizes will freeze the page during computation.
- **Manual Signaling** — good for demos; add a signaling server for automation.
- **Bandwidth Limit Not Enforced** — "Bandwidth (MB/s)" is display only in current version.

---

## 🔮 Roadmap Ideas

- Web Worker pool for multi-threaded task execution.
- Automatic ICE restarts and reconnection handling.
- True throughput measurement & enforcement.
- Multi-peer Coordinator mode.
- Optional WebGPU acceleration for supported tasks.

---

## 📜 License

MIT License — see LICENSE for details.

---

## 🧪 Quick Demo (Local Loopback)

1. Open `nyxmesh.html` twice in your browser (two tabs or two windows).
2. Assign one **Coordinator**, one **Worker**.
3. Follow the **Demo Instructions** above.
4. Run a batch job and watch GFLOPS climb.

You now have a fully functional P2P compute mesh running entirely in your browser.