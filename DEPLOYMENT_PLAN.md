# Deployment Plan

This guide outlines the steps to deploy the Appointment Management System.

- **Backend**: Render
- **Frontend**: Vercel
- **Database**: PostgreSQL (Render, Neon, or similar)
- **Redis**: Redis (Render or similar)

## Phase 1: Prerequisites

1.  **GitHub Repository**: Ensure this project is pushed to a GitHub repository.
2.  **Render Account**: Sign up at [render.com](https://render.com).
3.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
4.  **AWS Account**: For S3 bucket (if using image uploads).
5.  **Razorpay**: For payments (if enabled).

## Phase 2: Backend Deployment (Render)

1.  **Create a New Web Service** on Render.
2.  **Connect your GitHub repository**.
3.  **Configure the Service**:
    - **Name**: `appointment-backend` (or similar)
    - **Root Directory**: `server`
    - **Runtime**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `npm run start:prod` (This runs migrations + starts server)
4.  **Environment Variables**:
    Add the following variables in the "Environment" tab:

    | Variable                      | Value                                      | Description                                                                     |
    | :---------------------------- | :----------------------------------------- | :------------------------------------------------------------------------------ |
    | `NODE_ENV`                    | `production`                               | Optimizes for production                                                        |
    | `PORT`                        | `3000`                                     | (Optional, Render usually sets this automatically)                              |
    | `DATABASE_URL`                | `postgresql://...`                         | Connection string to your PostgreSQL database (Use Render Postgres or external) |
    | `REDIS_URL`                   | `redis://...`                              | Connection string to your Redis instance                                        |
    | `BETTER_AUTH_SECRET`          | `...`                                      | A long random string (e.g. generated via `openssl rand -hex 32`)                |
    | `BETTER_AUTH_URL`             | `https://<your-app>.onrender.com/api/auth` | The full URL to the auth endpoint                                               |
    | `BETTER_AUTH_TRUSTED_ORIGINS` | `*`                                        | Initially `*` or empty. Update with Vercel URL later.                           |
    | `CORS_ORIGIN`                 | `*`                                        | Initially `*`. Update with Vercel URL later.                                    |
    | `AWS_REGION`                  | `...`                                      | AWS Region for S3                                                               |
    | `AWS_ACCESS_KEY_ID`           | `...`                                      | AWS Access Key                                                                  |
    | `AWS_SECRET_ACCESS_KEY`       | `...`                                      | AWS Secret Key                                                                  |
    | `AWS_BUCKET_NAME`             | `...`                                      | S3 Bucket Name                                                                  |

5.  **Deploy**. Wait for the build to finish.
6.  **Copy the Backend URL** (e.g., `https://appointment-backend.onrender.com`).

## Phase 3: Frontend Deployment (Vercel)

1.  **Create a New Project** on Vercel.
2.  **Import the same GitHub repository**.
3.  **Configure the Project**:
    - **Root Directory**: `client`
    - **Framework Preset**: `Vite` (Should be detected automatically)
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
4.  **Environment Variables**:
    Add the following in the "Environment Variables" section:

    | Variable       | Value                                 | Description                                      |
    | :------------- | :------------------------------------ | :----------------------------------------------- |
    | `VITE_API_URL` | `https://<your-app>.onrender.com/api` | **IMPORTANT**: Append `/api` to the backend URL. |

5.  **Deploy**.
6.  **Copy the Frontend URL** (e.g., `https://appointment-client.vercel.app`).

## Phase 4: Final Configuration Update

1.  Go back to **Render** Dashboard -> Environment.
2.  Update `BETTER_AUTH_TRUSTED_ORIGINS` to your Vercel URL: `https://appointment-client.vercel.app`.
3.  Update `CORS_ORIGIN` to your Vercel URL: `https://appointment-client.vercel.app`.
4.  **Redeploy** the backend (Manual Deploy -> Clear Cache & Deploy usually safest, or just normal Deploy).

## Troubleshooting

- **CORS Errors**: Check `CORS_ORIGIN` and `BETTER_AUTH_TRUSTED_ORIGINS`. Ensure no trailing slash unless processed that way.
- **Database Errors**: Check `DATABASE_URL` and ensure IP Access List (if using external DB like MongoDB Atlas or generic Postgres) allows Render's IP (0.0.0.0/0 usually required for Render).
- **Build Failures**: Check the logs. Ensure `tsc` runs successfully.
