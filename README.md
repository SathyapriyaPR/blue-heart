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
