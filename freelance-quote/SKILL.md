---
name: freelance-quote
description: Turns a client brief (email, call notes, RFP, chat thread) into a priced freelance quote with scope, three-point estimates, buffer, pricing model, assumptions, exclusions, revisions, timeline, and payment terms, plus an optional proposal or statement of work. Use when the user asks to quote, price, estimate, scope, or bid on a project, write a proposal, or handle a change request. Works in English and Arabic.
---

# Freelance quote

Turn a messy brief into a quote the client can sign and the freelancer can deliver without losing money.

## When to use

- "How much should I charge for this?", "Write a quote for this brief", "Estimate this project", "Turn these call notes into a proposal".
- A client asks for more work mid-project and the user needs a change request.
- The user wants the quote in Arabic, or in both languages.

## When not to use

- Hourly time tracking or invoicing for work already done. That is an invoice, not a quote.
- Drafting a binding contract. You can draft terms, but say clearly it is not legal advice and the user should have a lawyer review contracts for large or high-risk work.

## Hard rules

1. **Never invent the user's rate, currency, or tax rate.** If they are missing, ask. Until answered, use placeholders like `[RATE]`, `[CURRENCY]`, `[VAT %]`.
2. **Estimate in ranges.** Every task gets low / likely / high hours. A single number hides risk.
3. **Make the buffer explicit.** Show it as its own line with the reason. Never bury padding inside tasks.
4. **Everything not listed is out of scope.** Write exclusions out by name.
5. **Flag scope risks** in their own section: vague requirements, third-party dependencies, content the client must supply, unknown integrations.
6. **Ask only questions that change the price or timeline.** Five sharp questions beat twenty generic ones.
7. Keep the client's language. If the brief is in Arabic, write the quote in Arabic unless told otherwise. Use `references/quote-template.ar.md`.

## Workflow

### 1. Extract

Read the brief and write down, in short bullets:

- **Goal**: the business outcome the client wants (more sales, launch by a date, replace an old system).
- **Deliverables**: the concrete things they will receive (pages, screens, features, documents, files).
- **Constraints**: deadline, budget hints, tech stack, brand rules, languages, hosting.
- **Stakeholders**: who approves, who supplies content.
- **Signals**: words like "simple", "just", "quick", "like X but" are risk markers. Note them.

### 2. List unknowns and ask

List every unknown, then keep only the ones that move the price or the date. Typical high-value questions:

- Who supplies copy, images, and translations? By when?
- How many rounds of revisions do you expect?
- Which integrations (payments, CRM, ERP, auth) and do they have API access ready?
- Is there a hard launch date, and what happens if it slips?
- Who hosts and maintains it after launch?
- What is the budget range? (Ask once, politely. It sets the pricing model.)

If the user wants the quote now anyway, proceed and turn each unanswered question into a written **assumption**.

### 3. Break down the work

Split each deliverable into tasks of 2 to 16 hours. Anything bigger is not understood yet; split it again or mark it as a discovery task. Always include the tasks people forget:

- Discovery and kickoff, project management and calls (often 10 to 15% of build time)
- Content entry, QA and cross-browser/device testing, accessibility pass
- Deployment, DNS/hosting setup, handover and documentation
- Revisions (as their own line, tied to the revision rounds you promise)

### 4. Estimate with three points

For each task: optimistic (O), most likely (M), pessimistic (P) hours.

- PERT expected hours: `E = (O + 4M + P) / 6`
- Standard deviation per task: `SD = (P - O) / 6`
- Project SD: `sqrt(sum of task SD²)`
- A reasonable high-confidence total: `sum(E) + 1.65 × project SD` (about 95% one-sided, assuming independent tasks)

Run `scripts/estimate.py` instead of doing this by hand:

```bash
python3 scripts/estimate.py tasks.csv --rate 75 --currency USD --buffer 15 --vat 15
python3 scripts/estimate.py tasks.json --rate 400 --currency SAR --buffer 10 --format json
```

CSV columns: `deliverable,task,low,likely,high` (optional `rate` column overrides the global rate per row). JSON: a list of objects with the same keys. See `examples/`.

### 5. Add buffer, with a reason

Pick a buffer and write why:

| Situation | Buffer |
|---|---|
| Clear spec, familiar stack, responsive client | 5 to 10% |
| Normal project, some unknowns | 10 to 20% |
| New stack, third-party APIs, many stakeholders, vague brief | 20 to 30%, or split off a paid discovery phase |

If the buffer would go above 30%, do not quote the whole project. Quote a paid discovery or first phase and re-quote after.

### 6. Pick the pricing model

| Model | Use when | Watch out for |
|---|---|---|
| Fixed price | Scope is clear and stable | Scope creep. Needs tight exclusions and a change process |
| Milestones (fixed per phase) | Larger projects with natural phases | Define what "done" means for each milestone |
| Day or hourly rate | Scope is unclear, ongoing, or client-led | Clients fear open bills. Give an estimate range and a cap they must approve to exceed |
| Retainer | Ongoing support, maintenance, content | Define included hours, rollover rules, response times |
| Value-based | The outcome has a clear, large business value and you can influence it | Needs trust and a client who talks about outcomes. Anchor the price to value, not hours |

Read `references/pricing-models.md` for formulas, examples, and how to present options.

Offering two or three options (for example, Essential / Standard / Extended scope) helps clients say yes to one instead of no to all.

### 7. Write the terms

Every quote includes:

- **Assumptions**: what you believe is true (client supplies content by a date, one point of contact, etc.).
- **Exclusions**: named items not included (copywriting, photography, hosting fees, third-party licenses, ongoing maintenance, SEO campaigns, translations).
- **Revision rounds**: number per deliverable and what counts as a round (one consolidated list of feedback).
- **Change requests**: anything outside scope is quoted separately before work starts. See `references/change-request-template.md`.
- **Timeline**: phases with dates or weeks, and the client dependencies each one waits on. State that delays in client input move the dates.
- **Payment terms**: deposit (commonly 30 to 50% before work starts), milestone payments, final payment before handover or launch. Optional: late fee, ownership transfer on full payment. Present these as options for the user to choose.
- **Taxes**: a separate line, e.g. VAT at the rate the user supplies. Do not assume a rate or whether the user is registered.
- **Validity**: the quote expires, usually 14 or 30 days.
- **Not legal advice** note when you draft contract terms.

### 8. Output

Default output is a quote in Markdown using `references/quote-template.md` (or `.ar.md`):

1. Summary (2 to 3 lines: what, by when, total range)
2. Scope table: deliverable, tasks, hours (expected), amount
3. Subtotal, buffer line, VAT line, total
4. Timeline, payment terms, assumptions, exclusions, revisions, change process, validity
5. Open questions (if any remain)

Offer next: a full proposal (`references/proposal-template.md`) or a scope of work (`references/scope-of-work-template.md`).

Round amounts sensibly (to the nearest 10 or 50 of the currency). Show hours to one decimal internally; clients usually see deliverables and amounts, not hours, unless they bill hourly.

## Change requests mid-project

When the client asks for something new:

1. Check it against the signed scope. If it is listed, do it.
2. If it is not, write a change request with `references/change-request-template.md`: what is asked, impact on hours, cost, and timeline, and what it replaces if the budget is fixed.
3. Work starts only after written approval.

## Verify before you hand it over

- [ ] No invented rate, currency, or tax rate. Placeholders are marked where the user has not answered.
- [ ] Every deliverable in the brief appears in scope or in exclusions.
- [ ] Buffer is a separate line with a reason.
- [ ] Totals add up (re-run `estimate.py` if you changed numbers).
- [ ] Assumptions, exclusions, revisions, change process, payment terms, and validity date are present.
- [ ] Scope risks are listed.
- [ ] Language matches the client. Arabic output uses Arabic punctuation (، ؛ ؟) and reads naturally.

## Files

- `scripts/estimate.py`: PERT estimates, buffer, VAT, totals as a Markdown table or JSON.
- `references/pricing-models.md`: pricing models, formulas, presenting options.
- `references/quote-template.md`, `references/quote-template.ar.md`: quote templates.
- `references/proposal-template.md`: full proposal.
- `references/scope-of-work-template.md`: statement of work.
- `references/change-request-template.md`, `references/change-request-template.ar.md`: change requests.
- `references/questions.md`: discovery questions by project type.
