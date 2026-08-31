# Blue Heart 🩵

Blue Heart is a privacy-focused, mobile-first Progressive Web App built to help a school counsellor manage student follow-ups, counselling sessions, schedules, reminders, and daily workflow with less friction.

The app is designed for single-user personal use and keeps sensitive student records local to the device.

## ✨ Features

- Student record management
- Session logging
- Follow-up tracking
- Priority-based student workflow
- Quick notes and quick capture
- Counselling availability timetable
- Class-based available counselling slots
- Daily school-app logging reminder
- Vitamin B and Magnesium reminders
- Weekly grocery checklist
- PIN-protected access
- Encrypted local data storage
- Encrypted backup and restore
- Installable Progressive Web App
- Background push notifications
- Follow-up reminders even when the app is closed

## 🔐 Privacy & Security

Blue Heart is designed as a local-first application.

Sensitive counselling records are stored in the browser and encrypted using the Web Crypto API.

The application uses:

- AES-GCM encryption
- PBKDF2-based key derivation
- PIN-protected access
- Local encrypted storage
- Encrypted backup and restore

Full student records are not stored in the notification backend.

Only the minimum reminder information required for scheduled notifications is sent to the serverless reminder service.

## 🔔 Background Reminder System

Blue Heart includes a serverless push-notification system for reliable counselling follow-up reminders.

The notification flow is:

```text
Blue Heart PWA
      ↓
Follow-up scheduled
      ↓
Cloudflare Worker API
      ↓
Cloudflare KV
      ↓
Cron Trigger
      ↓
Firebase Cloud Messaging
      ↓
Service Worker
      ↓
Phone notification

This allows reminders to arrive even when the Blue Heart PWA is closed.

🗓️ Counselling Availability

The application includes a school timetable-based counselling availability system.

Students can be matched to counselling periods based on:

Class / division
School day
Available period
Follow-up date
Counselling period timing

This helps reduce manual timetable checking when scheduling student follow-ups.

🛠️ Tech Stack
Frontend
HTML5
CSS3
JavaScript
Progressive Web App
Service Workers
Web Crypto API
Local Storage
Push Notifications
Firebase Cloud Messaging
Firebase Web SDK
Backend
Cloudflare Workers
Cloudflare KV
Cloudflare Cron Triggers
Hosting
GitHub Pages
📁 Project Structure
blue-heart/
├── icon/
│   ├── icon-192.png
│   └── icon-512.png
├── firebase-messaging.js
├── index.html
├── manifest.json
├── script.js
├── service-worker.js
├── style.css
└── timetable.js
📱 Progressive Web App

Blue Heart can be installed on supported mobile devices and used like a standalone application.

The PWA includes:

App manifest
Mobile-friendly interface
Service worker support
Home-screen installation
Background Firebase notifications
🧠 Design Approach

The interface was designed to reduce cognitive load and make frequent counselling tasks faster.

The application focuses on:

Minimal navigation
Quick student access
Clear follow-up priorities
Simple daily workflow
Reduced repetitive data entry
Gentle reminders
Mobile-first interaction
🚀 Live Demo

The deployed application is available through GitHub Pages.

The public repository does not contain real student records, private API keys, Firebase service-account credentials, or other sensitive user data.

⚠️ Privacy Note

Blue Heart is a personal workflow tool and is not intended to function as a hospital Electronic Health Record or clinical records platform.

Sensitive student information should only be handled according to the policies and privacy requirements of the relevant institution.

👩‍💻 Developer

Developed as a practical full-stack/serverless project demonstrating:

JavaScript application development
PWA architecture
Client-side encryption
Cloud/serverless integration
Push notification systems
Scheduled background processing
Real-world workflow design
