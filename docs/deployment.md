# Deployment Guide

## Vercel

1. Push the repository to GitHub.
2. Create a new Vercel project and import the repo.
3. Configure environment variables from `.env.example`.
4. Deploy.

## MongoDB Atlas

1. Create a cluster and database.
2. Add a database user and IP whitelist.
3. Set `MONGODB_URI` and `MONGODB_DB`.

## Firebase

1. Create a Firebase project.
2. Enable Email/Password and Google Auth providers.
3. Add the web app and copy client config to `.env.local`.

## Notifications

- Twilio: set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
