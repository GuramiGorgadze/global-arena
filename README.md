<div align="center">

<img src="./frontend/src/assets/logo.png" width="180" alt="Global Arena logo" />

# Global Arena

**A full-stack Model United Nations conference platform**

[![Live Demo](https://img.shields.io/badge/demo-g--arena.org-FEA90C?style=for-the-badge&logo=vercel&logoColor=white)](#)
&nbsp;
<br/>

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?style=flat-square&logo=gmail&logoColor=white)

</div>

<br/>

> Global Arena is the site and registration system behind GAMUN, a three-day Model UN conference across six committees. Delegates read about the committees, walk through a four-step registration wizard with autosave, and get a branded confirmation email while their info lands in Google Sheets as well as in the database for the organizing team.

<br/>

## 📖 Table of Contents

- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)

<br/>

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 🎬 Animated Landing
A hero with a scramble-text headline, cursor-reactive parallax rings, a scrolling committee ticker, and tilt cards for each of the six committees.
<br/><br/>
</td>
<td width="33%" valign="top">

### 📝 Guided Registration
A four-step wizard - info, background, priorities, review - with a progress indicator, inline validation, and shake feedback on invalid steps.
<br/><br/>
</td>
<td width="33%" valign="top">

### 💾 Draft Autosave
Form progress saves to local storage as the delegate types, so a closed tab or a dead connection doesn't mean starting over.
<br/><br/>
</td>
</tr>
<tr>
<td width="33%" valign="top">

### 🔞 Age-Aware Logic
Delegates under 18 are automatically asked for a parent's name and phone number before the form will let them submit.
<br/><br/>
</td>
<td width="33%" valign="top">

### ✉️ Automated Emails
Nodemailer fires a branded confirmation to the delegate and a notification to the admin inbox in parallel, each with its own HTML template.
<br/><br/>
</td>
<td width="33%" valign="top">

### 📊 Google Sheets Sync
Every successful registration is pushed to a Sheets webhook, so the organizing team can see who's signed up without opening the database.
<br/><br/>
</td>
</tr>
</table>

<br/>

## 🛠 Tech Stack

<table>
<tr><th>Layer</th><th>Technologies</th></tr>
<tr>
<td><strong>Frontend</strong></td>
<td>

React · Vite · Framer Motion · React Hook Form + Yup · react-hot-toast · clsx · Bootstrap Icons · Sass

</td>
</tr>
<tr>
<td><strong>Backend</strong></td>
<td>

Node.js · Express · MongoDB + Mongoose · Nodemailer · Axios (Google Sheets webhook) · dotenv

</td>
</tr>
</table>

<br/>

## 📁 Project Structure

```
global-arena/
├── backend/
│   ├── controllers/      Route handlers (delegates)
│   ├── db/                MongoDB connection
│   ├── models/             Mongoose schemas (Delegate)
│   ├── routes/             Express routers
│   ├── utils/              Mail sender, date formatting, env loader
│   └── index.js            App entry point
│
└── frontend/
    └── src/
        ├── api/               API client calls
        ├── assets/            Logo, images, icons
        ├── components/        Shared UI components
        ├── hooks/             Custom hooks (appscale, scroll, title)
        ├── routes/            Page-level route components (Home, Registration)
        ├── styles/            Sass stylesheets
        └── main.jsx           App entry point
```

<br/>

## 🚀 Getting Started

### 1 · Clone

```bash
git clone https://github.com/GuramiGorgadze/global-arena
cd global-arena
```

### 2 · Configure environment

Create `backend/.env`:

```env
PORT=3000
CONNECTION_STRING=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173

MAIL_SENDER_EMAIL=your_gmail_address
MAIL_SENDER_PASS=your_gmail_app_password

GOOGLE_SHEETS_WEBHOOK_URL=your_google_sheets_webhook_url
```

### 3 · Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4 · Run in development

```bash
# Terminal 1 — backend  → http://localhost:3000
cd backend && npm run dev

# Terminal 2 — frontend → http://localhost:5173
cd frontend && npm run dev
```

### 5 · Build for production

```bash
cd backend
npm run build   # builds the frontend into frontend/dist
npm start       # serves the API + built frontend from one Express server
```

<br/>

<div align="center">
  
Made with 🌍 by [GuramiGorgadze](https://github.com/GuramiGorgadze)
 
</div>
