# Appointment Management System (Odoo Hackathon Project)

A comprehensive appointment booking and management platform featuring a customer portal, organizer dashboard, and administrative interface.

## 🎬 Demo Video

> [!IMPORTANT] > **View Project Demo:** [https://drive.google.com/file/d/1KUQAIJm6rr7pSnwu4Uosb-fTRly2A_DV/view?usp=drive_link]

---

## 🚀 Features

### 👤 Customer Portal

- **Discovery**: Browse available appointment types and organizers.
- **Booking**: Interactive calendar-based booking system with real-time availability.
- **Management**: View, reschedule, or cancel upcoming appointments.
- **Payments**: Secure payment integration for paid sessions.
- **History**: Access past appointment records and reports.

### 📅 Organizer Dashboard

- **Schedule Management**: Configure availability, working hours, and breaks.
- **Appointment Tracking**: Real-time view of daily/weekly bookings.
- **Custom Forms**: Design custom booking questionnaires for different appointment types.
- **Analytics**: Key performance indicators and booking statistics.
- **Notifications**: Automated alerts for new bookings and cancellations.

### 🛡️ Admin UI

- **User Governance**: Manage customers, organizers, and administrative accounts.
- **System Monitoring**: Overview of platform-wide activity and health.
- **Financial Oversight**: Tracking transactions and platform revenue.
- **Configuration**: Global settings and system-wide parameters.

---

## 🛠️ Tech Stack

### Frontend (Client & AdminUi)

- **Framework**: React 18 (TypeScript)
- **Styling**: Tailwind CSS 4, Framer Motion (Animations)
- **State Management**: Redux Toolkit (Client), Zustand (Admin)
- **Networking**: Axios, Socket.io-client (Real-time updates)
- **UI Components**: Lucide React (Icons), React Big Calendar, Recharts (Charts)

### Backend (Server)

- **Runtime**: Node.js (Express.js 5 / TypeScript)
- **Database**: PostgreSQL (Managed via Drizzle ORM)
- **Caching**: Redis (Session management, Rate limiting)
- **Auth**: Better Auth (Secure session-based authentication)
- **Storage**: AWS S3 (File/Image uploads)
- **Testing**: Jest & Supertest

---

## 📁 Project Structure

```text
Odoo/
├── client/           # Customer-facing React application
├── AdminUi/          # Administrative React dashboard
├── server/           # Express.js backend API
├── docs/             # API specifications and documentation
└── DATABASE_SEEDING.md # Detailed guide for populating test data
```

---

## ⚙️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- AWS Account (for S3 storage)
- Razorpay Account (for payments)

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env # Configure variables
npm run db:generate
npm run db:migrate
npm run dev
```

### 2. Frontend Setup (Client)

```bash
cd client
npm install
npm run dev
```

### 3. Admin UI Setup

```bash
cd AdminUi
npm install
npm run dev
```

### 🧪 Database Seeding

To populate the database with realistic test data (3 months of bookings):

```bash
cd server
# Run the seeding script as described in DATABASE_SEEDING.md
npm run db:seed-admin
# (Follow instructions in DATABASE_SEEDING.md for full data)
```

---

## 👥 Author

**Jaimin Detroja**

## 📄 License

ISC
