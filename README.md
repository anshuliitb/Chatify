# 💬 Chatify

Real-time, interactive chat application using **Node.js**, **Express.js**, **Socket.IO**, and **MongoDB** with modular architecture and rich UI.

🌐 **Try It Out:** [https://www.chatifyanshul.site](https://www.chatifyanshul.site)

---

## 🚀 Objective

The **Chatify** project is a real-time chat application designed to provide seamless and engaging communication between users. Built with **Node.js**, **Express.js**, **Socket.IO**, and **MongoDB**, it ensures fast, scalable, and persistent messaging with a clean and dynamic user interface.

---

## ⚙️ Tech Stack

| Category     | Technologies                                |
| ------------ | ------------------------------------------- |
| Backend      | Node.js, Express.js, Socket.IO              |
| Frontend     | HTML, CSS, JavaScript                       |
| Database     | MongoDB (Mongoose ODM)                      |
| Deployment   | AWS EC2 (Ubuntu), Nginx, PM2, Certbot (SSL) |
| Architecture | Modular ES6 Modules, REST APIs + WebSockets |

---

## 🧠 Architecture Overview

- **Socket-Based Real-Time Communication:** Powered by Socket.IO for two-way real-time messaging.
- **Modular File Structure:** Clean separation of concerns across `routes/`, `controllers/`, `models/`, `utils/`, `socketEvents/`, and `public/`.
- **REST + WebSocket Integration:** REST APIs handle user data and avatars, Socket.IO handles real-time message flow.
- **Persistent Chat History:** All messages are stored in MongoDB and delivered to newly connected users.

---

## 🌟 Key Features

- 🔐 **User Onboarding**

  - Prompted for name at entry.
  - Welcome message displayed in header.

- 💬 **Real-Time Messaging**

  - Bi-directional messaging using WebSockets.
  - Typing indicators for active users.
  - Profile picture and name displayed with each message.
  - Timestamped messages.

- 🧠 **Chat History**

  - New users receive previous chat messages from the database.

- 📢 **Broadcast Notifications**

  - When users join or leave, all connected users are notified.
  - Online status is reflected using a green dot.

- 🔊 **Audio Notifications**

  - Join and message alerts with sound cues.

- 🧑‍🎨 **Profile Picture Support**

  - Uploaded via Multer on join.
  - Displayed alongside every user message.

- 📈 **Online Users Display**

  - Real-time display of connected users.

---

## 📁 Project Structure

```bash
📦 chatify/
├── 📁 config/
├── 📁 models/
├── 📁 node_modules/
├── 📁 public/
│   ├── 📁 assets/
│   │   ├── 📁 sounds/
│   │   └── 📁 styles/
│   │       └── 📄 styles.css
│   ├── 📁 scripts/
│   │   ├── 📁 socketEvents/
│   │   │   └── 📁 socketListeners/
│   │   │       ├── 📄 onJoinSound.js
│   │   │       ├── 📄 onMessage.js
│   │   │       ├── 📄 onMsgSound.js
│   │   │       ├── 📄 onStopTyping.js
│   │   │       ├── 📄 onSystemMessage.js
│   │   │       ├── 📄 onTyping.js
│   │   │       ├── 📄 onUpdateUserList.js
│   │   │       ├── 📄 registerSocketListeners.js
│   │   │       └── 📄 registerUIEmitters.js
│   │   └── 📄 main.js
│   └── 📄 index.html
├── 📁 socketEvents/
│   └── 📁 socketListeners/
│       └── 📄 registerSocketListeners.js
├── 📄 .env
├── 📄 .gitignore
├── 📄 app.js
├── 📄 LICENSE
├── 📄 package-lock.json
├── 📄 package.json
└── 📄 README.md
```

---

## 📡 Deployment (Production)

Chatify is **live and deployed** using:

- ✅ **EC2 Ubuntu Instance (AWS)**
- ✅ **Nginx Reverse Proxy** (serving on ports 80/443)
- ✅ **Let's Encrypt SSL** with **Certbot**
- ✅ **PM2** for process management
- 🌐 **Live Domain:** [https://www.chatifyanshul.site](https://www.chatifyanshul.site)

---

## 🔐 Environment Variables

Create a `.env` file in the project root with the following:

```bash
PORT=3000
MONGO_URI=your_mongodb_url
```

---

## 🧪 Installation & Run Locally

```bash
# 1. Clone the repository

git clone https://github.com/anshuliitb/chatify.git
cd chatify

# 2. Install dependencies

npm install

# 3. Set environment variables in .env

# 4. Start the server

npm start
```

---

## 🚀 Future Enhancements

📩 Private Messaging / Rooms

🛡️ JWT-based Authentication

🧪 Test coverage with Jest

🌍 Multilingual Interface

📱 Responsive UI for mobile

---

## 👨‍💻 Author

Anshul Mahor

🔗 GitHub: https://www.github.com/anshuliitb

🔗 LinkedIn: https://www.linkedin.com/in/anshuliitb

---

## 📝 License

Licensed under the **MIT License** © 2025 Anshul Mahor

---
