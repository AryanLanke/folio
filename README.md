# Folio

**The resume builder that's actually free.**

Write your resume, match it to the job, polish it with honest AI, and download a PDF or Word file. No sign-up, no watermark, no paywall at the download button.

**[Try it live →](https://folio-resumes.vercel.app)** · [See an example](https://folio-resumes.vercel.app/builder?example) · [Job match demo](https://folio-resumes.vercel.app/builder?example&view=job)

![The Folio editor: a form on the left and the resume on a real page on the right](docs/screenshot.png)

## Why Folio

Most resume builders let you spend half an hour writing, then charge before you can download. Folio was built around the complaints people have about those tools:

| | Folio | Most resume builders |
| --- | --- | --- |
| Downloading your resume | Free PDF and Word, no watermark | Usually paid, or watermarked |
| Getting started | No account. Just start typing | Sign-up required |
| Job match and keywords | Free | Paid plans |
| AI writing help | Free daily, never invents facts | Paid, and known to inflate claims |
| Where your resume lives | In your own browser | On their servers |

## Features

**Write**
- Live preview on a real page (Letter or A4), with a marker where page two starts
- Five ATS-safe templates: Classic, Modern, Executive, Compact and Serif
- Text size and spacing controls to fit everything on one page
- Any section order, plus certifications, awards, volunteering, languages or custom sections
- Clean links: LinkedIn, GitHub and other profiles show as short labels ("LinkedIn", "GitHub") that open the full address, on screen, in the PDF and in Word. Switch to full addresses for job portals whose ATS needs them
- Gentle warnings for phone numbers, emails, links and dates that look wrong
- Multiple resumes (one per job type), duplicate, rename, undo and autosave
- One backup file holds all your resumes, to keep them safe or move them to another device. Folio reminds you to save one after you download

**Get it past the screening**
- **Resume score:** a score out of 100 built from visible checks (the ATS check, writing style and job match), each with what to fix. Upload an existing resume to score it in seconds
- **Job match:** paste a job posting to see a match score, the keywords you cover and the ones you're missing, updated live as you type. Common short forms count ("JS" for JavaScript, "ML" for machine learning, "K8s" for Kubernetes)
- **ATS check:** an ATS score out of 100 from 15 weighted checks: contact details, education, job details, readable and consistent dates, bullet formatting (typed "•" symbols, sentences split across lines), skills, summary, action verbs, numbers and bullet length. Each check passes, warns or needs fixing, with a recommendation, so a weak resume can't get full marks. Plus the exact plain text tracking systems pull from your PDF

**AI that stays honest** (optional, 15 free actions a day)
- **Build with AI:** chat, or talk with voice typing, about your work in your own words. AI asks a few follow-up questions, then writes the resume from only what you said, with a fact-check pass afterwards
- **Import:** upload an old resume (PDF or Word) or paste its text, and every field fills in using your exact words, links included
- **✨ Enhance:** clearer, more professional wording for your summary and bullets, tailored to the target job's terms. Then refine it: shorter, more impact, more formal, simpler words, or another version. Every round works from your original facts, so it never adds numbers, skills or experience you didn't write, and never turns "helped with" into "led"
- **Cover letters:** written only from your resume, then checked by a second AI pass that strikes anything your resume doesn't support

**Download**
- One-click PDF with real, selectable text (tested: every template reads back cleanly as plain text)
- Word (.docx) for portals that ask for it
- Cover letter as PDF or Word

## Privacy

Your resumes are stored in your browser, not on a server: Folio has no accounts and no database. Folio asks the browser to keep that storage, and a backup file keeps a copy you control. PDF and Word files are generated on your device. AI only sees the text for the action you click, and nothing is stored. Details on the [privacy page](https://folio-resumes.vercel.app/privacy).

## How it works

Folio is a [Next.js](https://nextjs.org) app. The editor runs entirely in the browser; the only server code is four small API routes that pass the text for one AI action to [Groq](https://groq.com) (or Vercel AI Gateway) and return the result.

```
app/                    Pages: home, editor (/builder), privacy, and /api AI routes
components/builder/     Editor form, cover letter editor, import dialog, toolbar
components/resume/      Resume page, page-break preview, ATS check, job match
lib/resume.ts           The resume data model and safe loading of saved data
lib/templates.ts        How each template looks, shared by preview, PDF and Word
lib/export/             PDF (react-pdf) and Word (docx) generation
lib/jobmatch.ts         Job keyword extraction prompt and live matching
lib/enhance.ts          AI enhance rules, response cleanup, daily limit
lib/importer.ts         Resume import prompt and parsing
lib/coverletter.ts      Cover letter and fact-check prompts
lib/ats.ts              Plain-text export, the ATS check and score, and "Fix automatically"
lib/library.ts          Multiple resumes
lib/backup.ts           Backup files with every resume
lib/storage.ts          Browser storage
lib/server/ai.ts        The AI provider call shared by every route, with retries when it's busy
e2e/                    Browser tests (Playwright) that click through the built app
```

## Run it locally

You need [Node.js](https://nodejs.org) 20.9 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

AI features need a free API key from [console.groq.com](https://console.groq.com) in a `.env.local` file. Everything else works without it.

```
GROQ_API_KEY=your-key-here
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run the unit tests (including real PDF and Word generation) |
| `npm run lint` | Check code style |
| `npm run typecheck` | Check TypeScript types |
| `npm run build` | Build for production |
| `npm run e2e` | Build, then run the browser tests: a real Chrome clicks through the app (backups, downloads, ATS check, import). Run `npx playwright install chromium` once first |

AI features retry when Groq is busy: first on a smaller model (`AI_FALLBACK_MODEL`, default `openai/gpt-oss-20b`), which Groq limits separately, then on the main model after a short wait.

Every push to GitHub runs lint, type checks, unit tests, a production build and the browser tests automatically. When they all pass on `main`, GitHub Actions triggers the Vercel production deploy through a deploy hook (stored as the `VERCEL_DEPLOY_HOOK` repository secret), and Vercel's own deploy on push is turned off in `vercel.json`, so a failing change never goes live.

## Feedback

Found a bug or have an idea? Use **Send feedback** in the app, or [open an issue](https://github.com/AryanLanke/resume-builder/issues/new).

## License

[MIT](LICENSE)
