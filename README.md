# docready

**Pilot** is a clickable prototype of the applicant's side of document upload for NYC affordable housing lotteries. It was built for a product case study: when a household is picked in a lottery, Pilot gives each person a short, personal checklist, checks documents the moment they're added, and hands the agent a complete file.

**Live demo:** https://dylancliang.github.io/docready/

**Agent's view directly:** https://dylancliang.github.io/docready/#agent (shows a sample household that's partly done)

Everything in the demo is fictional: the household, the building, the agent and the documents. Nothing is uploaded anywhere.

## Try these

1. **No benefits path.** Answer "No" to the benefits question, then add one of Maria's pay stubs. You'll see the two-stub rule.
2. **Employer mismatch.** Add Luis's Fresh Market stub. His application says Metro Deli.
3. **Benefits path.** Restart, answer "Yes," and try each sample letter.
4. **Each adult's own list.** Send Luis his link, then switch to his view.
5. **Languages.** Switch between English, Spanish, Simplified Chinese, Traditional Chinese and Russian at the top of the app.
6. **Reminders.** Leave a few items missing, then tap "Preview the reminder texts" to see what each adult would get 2 weekdays before the deadline.

Tap **Why?** on any item to see the rule behind it.

## What it shows, by PRD requirement

| PRD | What you'll see |
|---|---|
| R1 Personal checklist | A list built from the household's frozen answers, grouped by person. Items the agent added are tagged. |
| R2 Benefits letter first | One award letter replaces pay stubs, but only if it lists everyone and is from the last 12 months. |
| R4 Each adult's own list | Maria sends Luis his own link. His view shows only his items. |
| R5 Forms signed in the flow | Asset statement for every adult; a statement when a job has ended. |
| R6 Basic checks: warn, never block | One stub when two are needed, stubs that aren't back to back, a photo it can't read, a letter that's too old or missing someone, an employer that doesn't match. "Send anyway" is always there. |
| R7 Receipts, countdown and reminders | Deadline in every screen header, a reminders setting, a preview of the texts each adult gets 2 weekdays before the deadline (only their own missing items), and a receipt after sending. |
| R8 Preferred language | Every applicant screen, warning and reminder in English, Spanish, Simplified Chinese, Traditional Chinese or Russian. The agent's view stays in English and shows the applicant's language. |
| R9 Hand-off to the agent | The file the agent receives, by person and by item, with flags and the applicant's explanations. No eligibility decision. |
| R10 Trust and other channels | A line that we never ask about immigration status and no Social Security number is needed, plus a pointer to email or in-person submission. |

Not shown: the voucher shortcut (R3, the sample household has no voucher) and building settings (R11, behind the scenes).

Translations are samples written for this prototype. A launch would use professional translation. The prototype doesn't remember the language you pick; a live app would save each person's choice so it's the default every time they return. Sample file names stay in English.

## Rules and sources

Every rule cites one of two sources:

- **HPD/HDC Marketing Handbook, April 2025**, by section number: [nyc.gov](https://www.nyc.gov/assets/hpd/downloads/pdfs/services/marketing-handbook-8-21.pdf)
- **Attachment H-1C: Required Documents, dated April 1, 2025**: [housingconnect.nyc.gov](https://housingconnect.nyc.gov/PublicWeb/assets/ATTACHMENT%20H-1C%20(DOCUMENT%20LIST)%20_ENGLISH.pdf)

Key rules used:

- 2 pay stubs if paid monthly, twice a month or every two weeks; 4 if paid weekly; current and consecutive (5-4.C).
- A benefits award letter from the last 12 months that lists everyone on the application replaces other income documents (H-1C; 5-4.A.2).
- Every adult signs the asset statement; under the HUD threshold it's the only asset document needed (5-4.I.1).
- A stub from an employer not on the application must be explained as an added or ended job (5-3.A.1).
- At least 10 weekdays to respond, then at least 5 for missing items (4-5.D).

## Run it locally

No build step. Open `index.html` in a browser, or run `npx serve .` in this folder.

## Files

- `index.html`: page and reviewer notes
- `style.css`: styles
- `app.js`: screens, checklist logic, document checks and reminders
- `i18n.js`: applicant text in five languages
