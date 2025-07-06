# OBSBOT Admin Dashboard

A full-stack Node.js + React control interface for managing multiple **OBSBOT Tail 2** cameras across a network.

---

## 🚀 Features

- 🔧 **Camera Management**: Add, edit, and remove cameras by IP address.
- 📦 **Group Assignment**: Organize cameras into groups for batch operations.
- 🌀 **Start/Stop Auto Tracking**: Toggle tracking mode on a single camera or an entire group.
- 🎯 **Preset Reset**: Send cameras back to Preset 1 (individually).
- ✋ **Gesture Control Toggle**: Ddisable gesture controls on any camera.
- ⚠️ **Batch Command Feedback**: Get a warning if some cameras fail during a batch command.
- 🎨 **Dark Mode UI**: Built using TailwindCSS for a sleek modern interface.
- 📋 **Log System**: Timestamped terminal logs with color-coded severity using `chalk`.
- ✅ **Check Alive System**: Check manually if the camera still alive on the network.

---

## 📂 Project Structure

```
/              - Node.js API with SQLite, Puppeteer integration
/app           - React interface for camera and group management
/utils         - Logging and utility modules
```

---

## 🛠 Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourname/obsbot-dashboard.git
cd obsbot-dashboard
```

2. **Install dependencies**

```bash
npm i -y
```

3. **Start the backend server**

```bash
node index.js
```

4. **(Optional) Use the included `start.bat`**

Double-click `start.bat` to launch the server.

Then open: [http://localhost:3001](http://localhost:3001)

---

## ⚙️ Camera API Requirements

Each OBSBOT camera must expose a reachable web interface and REST API on its local IP (e.g., `http://192.168.1.100`).

---

## 🧪 Next Steps (Maybe)

- Camera live preview in dashboard
- Drag-and-drop group reassignment
- WebSocket live sync
- Substitution of Puppeteer for tracking the state of the camera

---

## 📄 License

MIT © 2025 Marco 'x3rud' Ribera

---
