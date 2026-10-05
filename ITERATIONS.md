# Iteration log

Method: each round = screenshots of every section at 375 / 768 / 1440 in light and dark (plus 5 hero-morph frames), Lighthouse (mobile + desktop), then a fresh critic subagent given only the screenshots, the local URL and the rubric. Rubric: (a) 5-second wow, (b) originality, (c) typography, (d) colour and restraint, (e) recruiter storytelling, (f) interaction, (g) case depth and credibility, (h) mobile, (i) accessibility and performance, (j) copy.

## Round 1 (build 1)
Build: hero ECG-to-chart morph (vanilla JS, 600-point scroll-scrubbed path), three case files, timeline, evidence toolkit, contact. Fonts self-hosted (Fraunces, Hanken Grotesk, JetBrains Mono, 172 KB). No chart or animation library.
Own checks before the critic: console clean, no horizontal overflow at 375/768/1440 (light + dark). Lighthouse mobile 97 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100 (perf / a11y / best-practices / SEO). Page weight about 0.35 MB excluding the resume PDF.
Fixed after first look: hero descender of "Rajul" collided with the positioning line; mobile chart annotation clipped; process-map hand-off labels overlapped boxes (now numbered badges); map title touched first box on mobile; theme button label mismatch.
Critic 1 (fresh): a 8 / b 8.5 / c 8.5 / d 9 / e 7.5 / f 7.5 / g 8.5 / h 7 / i 7.5 / j 8.5, overall 8/10. Main defects: mobile funnel labels collided; mobile nav dropped Timeline/Toolkit; no role line or "what to read" strip; unbalanced hero at 1440 with empty right third; captions off-grid; "analyst. I" widow; mid-morph frame read as blank; map callouts crowded the diagram; tap targets under 44px; copy a bit precious ("Discharge", "with receipts") and outcome numbers outweighed the synthetic disclaimer.
Changes for round 2: funnel delta shortened on mobile and out-of-bar value labels for short bars; mobile nav shows all four links, 44px targets on every control; hero right column "read in 30 seconds" index (three cases mapped to skills) plus role line; captions aligned to the grid; nbsp in tagline; morph crossfade overlapped and line colour held accent until late; map time-to-activation callouts moved to the top-right of the diagram; "Synthetic outcome" / "Scenario" labels above outcome numbers; copy edits; cohort table full width; smaller name clamp so the chart gets more height. Interaction test (Playwright): filters, metric tabs, 3 run buttons, scenario toggle, theme toggle all work, 0 console errors.

## Round 2 (build 2)
Critic 2 (fresh, ran Playwright incl. reduced motion): a 7.5 / b 8.5 / c 8.5 / d 8.5 / e 8 / f 7.5 / g 8 / h 7.5 / i 7.5 / j 8, overall 8/10. Defects: reduced-motion hero showed both captions overprinted; morph hidden behind scrolling (no wow before first scroll); funnel paragraph went stale when the scenario toggled; map callouts collided; tap targets 22-42px; segment bars ignored the filters; SQL panels long; muted text and 11px mono small; copy tics (clinical metaphor repeated).
Changes for round 3: reduced-motion shows only the final chart and one headline; on load the ECG draws, then auto-morphs to the chart and back (cancelled on first scroll), after which scroll scrubs it; funnel paragraph switches with the scenario; segment bar for the selected filter combination is outlined; every interactive control is now >= 44px (audited by script: 0 small targets at 375); SQL panels capped at 17em; darker muted colour and 12px minimum for labels; lead stat (30%) enlarged; copy trimmed ("worked end to end", "Scroll to run the morph"); map callouts re-spaced and draw order made more sequential.

## Round 3 (build 3)
Critic 3 (fresh, screenshots only): a 7.5 / b 8 / c 8.5 / d 8.5 / e 7.5 / f 8 / g 7.5 / h 7.5 / i 8.5 / j 8, overall 8.0/10. Defects: funnel paragraph claimed "largest absolute loss" (wrong: visits to views loses more); to-be map caught half-drawn; hero chart too shallow and W1 label collided with a gridline; split first-view hierarchy (name, index, ECG, stats); cramped mobile top bar and tab wrap; accent overuse in headline italics; timeline weights equal; self-conscious Python/R line.
Changes for round 4: funnel copy corrected (steepest fall after the product page, among shoppers with intent); map draws earlier and finishes in a shorter scroll; "read in 30 seconds" index moved out of the hero into the intro so the chart band gets about 150px more height; W1 label moved above the line; metric tabs shortened to one line; headline italics set in ink (accent kept for the surname, data and the contact line); clinical timeline rows set smaller than business rows; Python/R line shortened; hero status line hidden on mobile.

## Round 4 (build 4)
Critic 4 (fresh, screenshots only): a 7 / b 8 / c 8.5 / d 8.5 / e 7 / f 8 / g 7.5 / h 7.5 / i 8.5 / j 7.5, overall 7.8/10. Numbers check: funnel, outcome and hero figures internally consistent and matching the resume. Defects: empty right half of hero at 1440; concept easy to miss; contact email broke mid-word at 375; tablet filter wrap; synthetic outcomes as heavy as real ones; case 03 real 30% small; funnel deltas far from bars; low-contrast captions; cramped 375 stats; muddy mid-morph colour.
Changes for round 5: proof stats moved beside the tagline (hero right half used, chart band now about 400px tall at 1440); larger morph caption; muted colour darkened (light and dark); contact links sized/wrapped to fit 375; filters grid min 290px; synthetic outcomes muted and smaller, Case 03 real 30% promoted to the hero figure of its outcome; funnel deltas moved under the stage label; morph colour interpolated in oklab; nav pill reduced.

## Round 5 (build 5)
Critic 5 (fresh, screenshots only): a 8 / b 8 / c 8 / d 9 / e 7 / f 8 / g 7 / h 7 / i 8 / j 7, overall 7.9/10. Defects: Case 03 "3 days / same day" display figures sat next to the real 30% and could read as contradictory; proof points mostly asserted; email in a serif where 1 and l look alike; hero density and caption misalignment; W1 label collision; timeline title sizes inconsistent; stock-phrase copy; weak resume CTA.
Changes for round 6: day figures on the process maps reduced to small mono captions so 30% is the only large number in Case 03; email and LinkedIn set in mono; stat captions shortened to two lines and top-aligned; W1 label removed (axis carries it), W12 label hidden on mobile; one timeline title size; resume link added to the hero status line.

## Round 6 (build 6)
Critic 6 (fresh, 40 stills): a 7.5 / b 8 / c 8.5 / d 8.5 / e 7.5 / f 8 / g 7.5 / h 7.5 / i 8.5 / j 8, overall 8.0/10. Defects: mobile hero lost the resume link; end-state caption showed only half the concept sentence; morph ended in the quietest, ink-coloured frame; unlabelled revenue figures (185k / 198k / 199k); mobile funnel labels wrapped; SQL clip with no cue; synthetic cases carry little real proof.
Changes for round 7: resume link and availability on their own rows on mobile; end-state caption reads 'From patient charts to business charts' (first half dimmed); revenue line and fill stay vermilion through the whole morph (no muddy mid-frame); hero endpoint labelled synthetic; KPI and outcome revenue labels say which period they average; funnel label sits above the bar on mobile; SQL right-edge fade cue on mobile.

## Round 7 (build 7)
Critic 7 (fresh, 37 stills): a 8 / b 8 / c 8.5 / d 9 / e 8 / f 8.5 / g 7.5 / h 8 / i 8.5 / j 8.5, overall 8.2/10. Defects: stat numerals not on a common baseline; hero chart band small beside name + stats; mobile end-state lost the first half of the concept line; end label overlapped the rising line mid-morph; funnel and bar-track contrast; heavy black selected-state pills competing with the accent; contact lacks a roles-sought line; cases 01/02 are synthetic by design.
Changes for round 8: three stats set to one size (shared baseline); name clamp reduced to give the chart more height; mobile caption wraps the full 'From patient charts to business charts'; endpoint label fades in only at the end and is hidden on mobile; selected filter pills use a light fill with an underline so red alone means the leak; bar tracks tinted for contrast in both themes; ECG grid slightly stronger.

## Round 8 (build 8, final)
Critic 8 (fresh, 37 stills): a 7 / b 8 / c 8.5 / d 9 / e 7.5 / f 8 / g 7 / h 8 / i 8.5 / j 8, overall 8/10.
Remaining defects (not fixed, iteration budget spent): first scroll ticks barely move the morph; hero composition still leaves paper to the right of the name; a brief ECG-spike artefact mid-morph; synthetic Cases 01/02 cannot carry real proof and Case 03's day figures are assumptions; no 'so what' in revenue terms; mobile Case 01 stacks filters before the chart; funnel labels and SQL clip on mobile; small rail captions.

## Score summary (overall / criteria range)
| Round | Overall | Lowest criterion | Highest criterion |
|---|---|---|---|
| 1 | 8.0 | h mobile 7 | d colour 9 |
| 2 | 8.0 | a wow 7.5 | b/c/d 8.5 |
| 3 | 8.0 | a/e/g/h 7.5 | c/d/i 8.5 |
| 4 | 7.8 | a/e 7 | c/d/i 8.5 |
| 5 | 7.9 | e/g/h/j 7 | d 9 |
| 6 | 8.0 | a/e/g/h 7.5 | c/d/i 8.5 |
| 7 | 8.2 | g 7.5 | d 9 |
| 8 | 8.0 | a/g 7 | d 9 |
Stop criteria (every criterion >= 9, two consecutive fresh 10/10 verdicts) NOT met. Lighthouse thresholds met: mobile 96/100/100/100, desktop 100/100/100/100.
