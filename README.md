# README.me

> Every project has a README. This one's yours.

A friendly, one-question-at-a-time website for getting to know your team.
Members sign in with Discord, answer 85 questions across 10 sections, and
their answers save automatically. Only the team lead can read them, on a
private dashboard.

**Built with** Next.js · TypeScript · Tailwind CSS · Framer Motion · Supabase · Discord sign-in

---

## Try it right now (demo mode)

No setup needed. Without Supabase keys the app runs in **demo mode**: no
sign-in, and answers stay in your own browser.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The dashboard is at `/admin`.

---

## Going live: setup checklist

### 1. Create a Supabase project
1. Go to <https://supabase.com>, then **New project** (the free tier is fine).
2. Open **SQL Editor → New query**, paste everything from
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.

### 2. Create a Discord application
1. Go to <https://discord.com/developers/applications>, then **New Application**
   (for example, "README.me").
2. Open **OAuth2** and copy the **Client ID** and **Client Secret**.
3. Under **Redirects**, add the callback URL Supabase gives you in the next
   step. It looks like `https://<your-project>.supabase.co/auth/v1/callback`.

### 3. Connect Discord to Supabase
1. In Supabase, open **Authentication → Sign In / Providers → Discord**.
2. Turn it on, paste the Client ID and Client Secret, and save.
3. Open **Authentication → URL Configuration**:
   - **Site URL:** your live site, for example `https://readme-me.vercel.app`
     (use `http://localhost:3000` while testing).
   - **Redirect URLs:** add `http://localhost:3000/**` and `https://<your-site>/**`.

### 4. Add your keys
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Restart `npm run dev`. The landing page now shows **Sign in with Discord**.

### 5. Make yourself the admin
Sign in once with Discord. Then, in the Supabase SQL Editor, run:

```sql
insert into public.admins (user_id)
select id from public.profiles where username = '<your discord username>';
```

Open `/admin` to see the dashboard. Team members who open `/admin` see a
"only for the team lead" page, and the database itself blocks them from
reading anyone else's answers.

### 6. Deploy to Vercel
1. Push this repo to GitHub.
2. On <https://vercel.com>, choose **Add New → Project** and import the repo.
3. Add the same two environment variables, then deploy.
4. Add the Vercel URL to Supabase's **Site URL** and **Redirect URLs** (step 3).

---

## Editing questions (admin panel)

Open `/admin` and use the tabs:

- **Questions:** add, rename, archive and drag to reorder sections and questions. Pick a character for each
  section, choose each question's type (long answer, short answer, pick one, pick many, scale, several boxes),
  edit options, and choose which questions appear on the profile card.
- **Texts:** the welcome screen, privacy note and finishing message.
- **Templates** (button in the status bar): start from a whole template, or add single sections from any template.
  Built-in templates are *Team deep-dive* (85 questions), *Quick hello* (15) and *Blank*.
- **Admins:** make other people admins (they need to sign in once first).

Changes save to a **draft** automatically. Use **Preview** to try the draft yourself, then **Publish** when ready.
Members only ever see the published version.

Answers stay safe when you edit: choices are stored by option ID (so renaming an option is fine), and removing a
question that was already published **archives** it. Archived questions disappear from the form but their answers
still show on the dashboard and in the CSV export.

To add your own built-in template, create a `FormDoc` in [`src/templates/`](src/templates/) and list it in
[`src/templates/index.ts`](src/templates/index.ts).

## Privacy

- Row Level Security in Postgres: each member can read and write only their own answers.
- Only users listed in `admins` can read everyone's answers and edit the form. Only an existing admin can
  add another admin, and nobody can remove themselves.
- Drafts are visible to admins only. Members can read the published form, never the draft.
- Discord sign-in shares only the member's Discord name, avatar and email. The app can't see their servers or messages.

## Roadmap
- **v2:** Discord Quest checklist (join the server, set an avatar, say hi), and
  roles that unlock as members progress.
- **v3:** bot commands (`/readme`), DM reminders, and an opt-in shareable README card.
