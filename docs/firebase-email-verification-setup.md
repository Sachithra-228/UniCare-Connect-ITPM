# Firebase email verification – setup guide

Use this to customize the verification email and (optionally) send users to your app’s styled verification page instead of Firebase’s.

---

## 1. Open the template

1. Go to [Firebase Console](https://console.firebase.google.com) and select **UniCare Connect**.
2. In the left sidebar, click **Authentication**.
3. Open the **Templates** tab.
4. Under **Email**, click **Email address verification**.

---

## 2. Sender and branding

| Field | What to do |
|-------|------------|
| **Sender name** | Click the pencil, set to **UniCare Connect** (so it doesn’t say “not provided”). |
| **From** | Usually stays `noreply@unicare-connect.firebaseapp.com` (optional: configure **SMTP settings** if you want a custom domain). |
| **Reply to** | Optional: set a real address like `support@yourdomain.com` if you want replies. |

---

## 3. Subject and message (optional)

- **Subject:** You can change from `Verify your email for %APP_NAME%` to e.g. **Verify your email – UniCare Connect**.
- **Message:** You can edit the text (e.g. “Hello,” → “Hello,” and add “Welcome to UniCare Connect.”). You cannot use full HTML; Firebase uses plain text and variables.

Example message:

```text
Hello %DISPLAY_NAME%,

Welcome to UniCare Connect. Please verify your email so you can sign in.

Follow this link to verify your email address:
%LINK% (this is a placeholder – Firebase replaces it with the real link)

If you didn’t create an account, you can ignore this email.

Thanks,
The UniCare Connect team
```

Use the variables Firebase shows in the template (e.g. `%LINK%`, `%APP_NAME%`, `%DISPLAY_NAME%`). Do not remove the line that contains the verification link placeholder.

---

## 4. Use your app’s verification page (styled “Your email has been verified”)

By default, the link in the email goes to Firebase’s page (`unicare-connect.firebaseapp.com`). To send users to **your** app’s page at `/auth/action` (with your site colors and “Continue” button):

1. In the **Email address verification** template, look for one of:
   - **Action URL**
   - **Custom action URL**
   - **Customize action URL**
   - Or an **Advanced** / **Additional settings** section that mentions where the link goes.

2. If you find it, set it to your app’s URL:
   - **Local:** `http://localhost:3000/auth/action`
   - **Production:** `https://yourdomain.com/auth/action` (replace with your real domain).

3. **Authorized domains (required for custom URL):**
   - In Firebase Console go to **Authentication** → **Settings** (or **Authorized domains**).
   - Add:
     - `localhost` (for local testing)
     - Your production domain (e.g. `yourdomain.com`, or your Vercel URL like `yourapp.vercel.app`).

If your Firebase project does **not** show an “Action URL” option, the verification link will always go to Firebase’s page. Your styled page at `/auth/action` is still used when you send verification emails yourself (e.g. with your own email provider and the template in `src/lib/email-templates/verification-email.ts`).

---

## 5. Save

Click **Save** at the bottom of the Email address verification template.

---

## Quick checklist

- [ ] Sender name set to **UniCare Connect**
- [ ] Subject/message updated (optional)
- [ ] Action URL set to your app’s `/auth/action` (if the option exists)
- [ ] Authorized domains include `localhost` and your production domain
- [ ] Template saved

After this, new verification emails will use your settings. Existing emails already sent will not change.
