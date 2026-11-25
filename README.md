# 🌱 SproutCaree

**A simple, friendly web app for managing one or many nurseries** — children, parents, teachers, classes, schedules, daily notes and announcements, all in one place.

🔗 **Live beta:** [sproutcareebeta.vercel.app](https://sproutcareebeta.vercel.app/login)

<!-- Add screenshots here -->
<!-- ![Login](./docs/login.png) ![Dashboard](./docs/dashboard.png) -->

---

## ✨ Overview

SproutCaree is a multi-tenant SaaS: every nursery has its own isolated data, and each person signs in with a role that decides what they see.

The top priority is **ease of use** — a nursery owner, a teacher, or a parent should be able to use it from a phone without training.

## 👥 Roles

| Role | What they can do |
|------|------------------|
| **Admin** (nursery owner) | Manage children, parents, teachers, classes, schedules and announcements. Creates teacher and parent accounts. Edits nursery profile. |
| **Teacher** | View their class and children, write daily notes, see the schedule. |
| **Parent** | View their children's info, notes, schedule and announcements. A parent can have multiple children in the same nursery. |

## 🚀 Features

- **Children** – list, search, add, edit, delete, link to parents
- **Parents** – list with linked children, search by parent/child name or phone, call button, add/edit/delete
- **Teachers** – list with assigned class, add/edit form
- **Classes** – add, edit, delete (deletion blocked while a class still has children or teachers)
- **Schedule** – editable weekly schedule per class (day, activity, type, start/end time)
- **Announcements** – create, edit and delete from a dialog
- **Teacher notes** – daily notes per child
- **Settings** – change password (all roles), nursery profile (admin only)
- Responsive layout: sidebar on desktop, drawer on mobile

## 🛠 Tech Stack

- **React** + **React Router**
- **Redux Toolkit** – app/user state
- **Tailwind CSS** – styling
- **Firebase Authentication** – email/password sign-in
- **Cloud Firestore** – database, protected with security rules
- **Vercel** – hosting

## 📁 Project Structure

```
src/
├── components/     # Shared UI (Card, BackBtn, forms, dialogs…)
├── pages/          # Admin / teacher / parent pages
├── services/       # Firebase API functions
├── store/          # Redux slices
└── ...
```

> Adjust this tree to match your actual folders.

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Authentication (Email/Password)** and **Firestore** enabled

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Use the `REACT_APP_` prefix instead if the project is built with Create React App.

### Run locally

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 🔐 Data & Security

- Data lives in Firestore; access is controlled by Firestore security rules per role and per nursery.
- Never commit your `.env` file or service-account keys.

## 🎨 Design System

Light, clean, friendly dashboard built with Tailwind.

| Token | Value |
|-------|-------|
| Primary | `#1F7A4D` |
| Light green | `#E3F2EA` |
| Hover green | `#D3EBDF` |
| Warm background | `#F5F1EA` |
| Main / secondary text | `#262723` / `#555C57` |

Cards use `rounded-2xl`, buttons use `rounded-full`, and the layout is mobile-first.

## 🗺 Roadmap

- [ ] Child profile page
- [ ] Attendance tracking
- [ ] Parent–teacher messaging
- [ ] Notifications

> Edit this list to reflect your real plans.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

## 📄 License

Add your license here (e.g. [MIT](https://choosealicense.com/licenses/mit/)).

---

Made with 💚 for nurseries and the families they care for.
