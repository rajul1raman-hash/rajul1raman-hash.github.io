# Design brief: "Patient charts to business charts"

Concept: a physiotherapist turned business analyst. The page is typeset like a clinical case file, and the signature moment is an ECG trace that, as you scroll, morphs into a business trend line (the same synthetic series that Case 01 analyses).

1. **The Pudding**: scroll-driven storytelling where the chart *is* the argument. The hero morph is scroll-scrubbed, and each case file lets the reader operate the evidence (filters, run-the-SQL, before/after) rather than read about it.
2. **NYT Upshot / Bloomberg Graphics**: annotate the chart, not a legend. Direct labels, a marked intervention line, sparse axes, numbers in tabular mono, every dataset labelled "synthetic" in the chart header.
3. **Stripe Press**: warm paper stock, ink-black type, one saturated accent, big serif display, generous margins. Dark mode keeps the same paper-and-ink logic instead of inverting into a "tech" theme.
4. **Pentagram case studies**: asymmetric 12-column grid, a narrow label rail beside a wide content column, and a hard structural rhythm (rule, mono caption, headline, body) repeated per case.
5. **Linear typography**: tight tracking on large display text, restrained weight changes, small uppercase mono metadata, no decorative icons.
6. **Awwwards-style personal sites**: one memorable idea executed fully (the pulse) instead of many tricks; micro-interactions limited to things that carry meaning (the pulse dot, the self-drawing process map, the funnel that refills).
7. **Medical chart conventions**: the CASE / PRESENTING PROBLEM / DIAGNOSIS / TREATMENT / OUTCOME rail, lead-II labels, millimetre-grid paper behind the ECG.
8. **Type**: Fraunces (display serif, light and italic for emphasis), Hanken Grotesk (body), JetBrains Mono (numbers, SQL, labels). **Colour**: paper `#F3EFE6`, ink `#15130F`, one accent (surgical vermilion), matching dark mode.
9. **Banned**: gradients, glass, glow, emoji, stock art, icon sets, centred hero + three cards, buzzwords. **Honesty rule**: all facts match Resume v3; all case data is labelled synthetic / anonymised.
10. **Engineering**: static, no build, vanilla JS and hand-drawn SVG (no chart or animation libraries, so the page stays light), self-hosted subset fonts, `prefers-reduced-motion` renders the finished chart statically.
