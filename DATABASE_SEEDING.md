# Database Seeding Guide

## Overview

This guide helps you populate your database with realistic test data spanning **3 months** (90 days past + 30 days future) for comprehensive dashboard testing.

---

## Quick Start (One Command)

Run all seeding steps in sequence:

```bash
cd server
npx ts-node src/scripts/clean-database.ts && \
npx ts-node src/scripts/seed-admin.ts && \
npx ts-node src/scripts/seed-booking-data.ts
```

---

## Step-by-Step Instructions

### Step 1: Clean the Database

Remove all existing data:

```bash
cd server
npx ts-node src/scripts/clean-database.ts
```

### Step 2: Seed Admin User

Create the admin account:

```bash
npx ts-node src/scripts/seed-admin.ts
```

### Step 3: Seed Booking Data

Create all test data (users, appointments, bookings):

```bash
npx ts-node src/scripts/seed-booking-data.ts
```

---

## Test Credentials

### Admin Account
| Email | Password |
|-------|----------|
| `admin@gmail.com` | `admin123` |

### Customer Accounts (30 customers)
| Email Pattern | Password |
|---------------|----------|
| `customer1@example.com` to `customer30@example.com` | `customer123` |

### Organizer Accounts (8 organizers)
| Name | Email | Password |
|------|-------|----------|
| Dr. Rajesh Kumar | `dr.rajesh@clinic.com` | `organizer123` |
| Dr. Sunita Sharma | `dr.sunita@dentalcare.com` | `organizer123` |
| Fitness Pro Gym | `contact@fitnesspro.com` | `organizer123` |
| Wellness Center | `info@wellnesscenter.com` | `organizer123` |
| TechRecruit Solutions | `hr@techrecruit.com` | `organizer123` |
| Dr. Anand Patel | `dr.anand@physiocare.com` | `organizer123` |
| Beauty Studio | `book@beautystudio.com` | `organizer123` |
| Legal Associates | `consult@legalassoc.com` | `organizer123` |

---

## Seeded Data Summary

### Users
- **30 Customers** - With realistic Indian names, verified status, phone numbers
- **8 Organizers** - Various service providers (medical, fitness, wellness, legal)
- **1 Admin** - System administrator

### Appointment Types (8 types)
| Type | Duration | Price | Organizer |
|------|----------|-------|-----------|
| General Health Consultation | 30 min | Free | Dr. Rajesh Kumar |
| Dental Care & Examination | 45 min | ₹1,500 | Dr. Sunita Sharma |
| Personal Training Session | 60 min | ₹800 | Fitness Pro Gym |
| Group Yoga Class | 75 min | ₹500 | Wellness Center |
| Technical Interview | 60 min | Free (Online) | TechRecruit Solutions |
| Physiotherapy Session | 45 min | ₹1,200 | Dr. Anand Patel |
| Hair Styling & Treatment | 90 min | ₹2,000 | Beauty Studio |
| Legal Consultation | 45 min | ₹2,500 | Legal Associates |

### Bookings (1,000+ bookings)
- **Date Range**: 90 days past to 30 days future
- **Statuses**: Completed, Booked, Pending (Request), Cancelled
- **Distribution**: Higher volume on weekdays, realistic time slots

### Additional Data
- **Resources**: Staff members and rooms for each appointment type
- **Schedules**: Weekly availability with morning/afternoon/evening slots
- **Questions**: Custom booking forms with various question types
- **Payments**: Transaction records for paid appointments

---

## Data Distribution

The seeding creates realistic data patterns:

- **Past bookings (>7 days ago)**: ~75% completed, ~15% cancelled, ~10% no-shows
- **Recent bookings (last week)**: ~60% completed, ~25% booked, ~15% cancelled
- **Future bookings**: ~70% booked, ~15% pending, ~15% cancelled
- **Weekday bookings**: 8-20 per day
- **Weekend bookings**: 3-8 per day

---

## Troubleshooting

### Database Connection Issues
Ensure your `.env` file has the correct `DATABASE_URL`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Table Not Found Errors
Run migrations first:
```bash
npx drizzle-kit migrate
```

### Permission Errors
Ensure your database user has TRUNCATE permissions.
