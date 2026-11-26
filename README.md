# README.me

> Every project has a README. This one's yours.

A friendly, one-question-at-a-time website for getting to know your team.
Members sign in, answer questions across short sections, and their answers save
automatically. Only admins can read them, on a private dashboard. Questions,
sections, texts and sign-in methods are all configured from the admin panel.

**Built with** Next.js · TypeScript · Tailwind CSS · Framer Motion · Supabase

---

## Setup checklist

README.me runs on Supabase (database and sign-in). Until the keys below are set, every page shows a
short "setup needed" screen.

### 1. Create a Supabase project
1. Go to <https://supabase.com>, then **New project** (the free tier is fine).
2. Open **SQL Editor → New query**, paste everything from
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. It's safe to run again after updates.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public** key.
4. Open **Authentication → URL Configuration**:
   - **Site URL:** your live site, for example `https://readme-me.vercel.app`
     (use `http://localhost:3000` while testing).
   - **Redirect URLs:** add `http://localhost:3000/**` and `https://<your-site>/**`.

### 2. Add your keys
Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Then run:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Out of the box the landing page offers **Sign in with email** (a one-time link),
which needs no extra setup. The admin panel is at `/admin`.

### 3. Make yourself the admin
Sign in once. Then, in the Supabase SQL Editor, run this with your username
(for email sign-in, that's the part of your email before the @):

```sql
insert into public.admins (user_id)
select id from public.profiles where username = '<your username>';
```

Open `/admin`. From now on you can add more admins from the **Admins** tab. Members who open `/admin`
see an "only for the team lead" page, and the database itself blocks them from reading anyone else's answers.

### 4. Choose sign-in methods (optional)
In **Admin → Settings**, pick any mix of **Discord**, **GitHub**, **Google** and **Email link**.
Each one except the email link also has to be switched on in Supabase
(**Authentication → Sign In / Providers**) with its own keys:

| Method | Where to get the keys | Callback URL to register there |
|---|---|---|
| Discord | <https://discord.com/developers/applications> → New Application → OAuth2 | `https://<your-project>.supabase.co/auth/v1/callback` |
| GitHub | GitHub → Settings → Developer settings → OAuth Apps | same |
| Google | Google Cloud Console → APIs & Services → Credentials → OAuth client ID | same |
| Email link | Nothing to set up. For more than a few emails an hour, add custom SMTP in Supabase. | — |

Also in **Settings**: an optional **Discord invite link**. Members then see a "Join the Discord" button when they finish.

### 5. Deploy to Vercel
1. On <https://vercel.com>, choose **Add New → Project** and import the GitHub repo.
2. Add the same two environment variables, then deploy.
3. Add the Vercel URL to Supabase's **Site URL** and **Redirect URLs** (step 1).

---

## Editing questions (admin panel)

Open `/admin` and use the tabs:

- **Questions:** add, rename, archive and drag to reorder sections and questions. Pick a character for each
  section, choose each question's type (long answer, short answer, pick one, pick many, scale, several boxes),
  edit options, and choose which questions appear on the profile card.
- **Texts:** the welcome screen, privacy note and finishing message.
- **Templates** (button in the status bar): start from a whole template, or add single sections from any template.
  Built-in templates are *Team deep-dive* (85 questions), *Quick hello* (15) and *Blank*.
- **Settings:** sign-in methods (Discord, GitHub, Google, email link) and an optional Discord invite link.
  Settings apply as soon as you save.
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
- Sign-in shares only the member's name, avatar and email with the app. With Discord or GitHub, the app can't see servers, messages or code.

## Roadmap
- **v2:** Discord Quest checklist (join the server, set an avatar, say hi), and
  roles that unlock as members progress.
- **v3:** bot commands (`/readme`), DM reminders, and an opt-in shareable README card.
