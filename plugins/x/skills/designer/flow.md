# Flow

Purpose, control, responsibility, familiarity, flexibility, simplicity, navigation, labels, feedback, response latency, chosen emotion, and the process that produces them.

## Judge

- S1 Four needs: every screen serves at least one human need and breaks none: safety and predictability (nothing surprising or irreversible happens), understanding (the person can tell what it is and what it will do), achievement (they finish what they came for and see their progress), joy (it feels good to use). A screen that serves none of them is a finding.
- S2 Purpose: each screen has one job, and every element earns the time, attention and trust it asks for. A feature with no clear job is cut, not styled.
- S3 Agency: the person stays in control. Offer choices instead of forcing one path. Nothing changes unless they changed it, and anything they changed can be undone or edited.
- S4 Forgiveness: slips are fixed by undo, not by asking first. A confirmation guards only what is destructive and irreversible. A confirmation on routine actions trains people to click through and is a finding.
- S5 Privacy: ask for a permission at the moment its feature is used, ask only for what that feature needs, and say why in one line. A permission prompt on launch, or one asking for more than the feature uses, is a finding.
- S6 Harm: anticipate misuse and harm before shipping, most of all where AI generates or recommends. Output that could hurt this person (an allergy-aware recipe app suggesting the allergen) needs a guard, a preview, a confirmation or a disclaimer placed where the decision happens. A feature whose risk outweighs its value is cut.
- S7 Familiarity: what looks the same behaves the same and sits in the same place (close is always in the same corner), so the person can predict the result. A familiar pattern is broken only with evidence the new one is better, and that evidence comes from testing it, not from assuming.
- S8 Metaphor: a metaphor is neither too literal (a skeuomorphic replica that drags along the old object's limits) nor too abstract (an icon nobody can read). A trash can means delete. The interface honors the metaphor's physics: a thing that slides in from the right leaves to the right; a drawer opens the way a drawer does.
- S9 Flexibility: the design adapts to the platform and the situation: a phone means quick touch, a desktop means deep work with a precise pointer. It includes people of every age, language, expertise and ability, which means text that grows, layouts that survive longer translations, and nothing that needs one sense or one hand.
- S10 Personalization: where no single layout fits everyone, the person may rearrange controls and hide what they never use. Personalization is offered, never imposed, and a reset returns the default.
- S11 Simplicity: simple is not minimal. Strip what does not serve the purpose, and make the common path first and advanced options one level deeper. Burying everything behind one menu looks minimal and is not simple. Fewer steps, fewer words, plain language, no jargon.
- S12 Added context: adding an element can simplify. A scrubber that shows time remaining, a count beside a filter, a preview beside a choice: if one more piece of information removes a decision or a guess, it earns its place.
- S13 Hierarchy of attention: order, spacing and contrast make the most important thing the most obvious. One primary action per screen. Two competing primary actions are a finding.
- S14 Wayfinding: every screen answers where am I, where can I go, what is here, and how do I get out. Nothing traps: a modal, a flow or a state always has a visible exit.
- S15 Grouping: proximity implies relationship. Related items sit together and unrelated items are separated by more space than the items inside a group.
- S16 Mapping: a control sits next to what it changes and is arranged the way it changes it (a vertical control for a vertical thing). A control that needs a label to explain what it affects is mapped badly.
- S17 Labels: name items for their contents ("Progress", "Library", "Billing"), not for a vague umbrella ("Home", "Stuff", "More"). Direct and specific beats safe and generic, because specificity makes the destination predictable. Copy states consequences, not how the app works.
- S18 Feedback kinds: status (something is happening or where it stands), completion (it finished), warning (a problem is coming), error (it failed, with what to do next). Each kind has a visible form. Meaningful actions are confirmed, ongoing work shows status, and problems are warned about before they happen.
- S19 Inline validation: validate as the person types or leaves a field, next to the field, never only on submit. The message says what to change.
- S20 Response: feedback starts on pointer-down, not on release, and continues through the interaction (a drag updates 1:1 the whole way). A lag on the input path breaks the feeling of directness.
- S21 Input path latency: nothing on the input path waits on a debounce, an artificial timer, a transition or the roughly 300ms tap delay unless the wait is the point. Every such wait is a regression to find and remove.
- S22 Chosen emotion: the product names the feeling it wants (calm, confident, excited) and every decision reinforces it. Delight is the result of the other rules done well, not confetti added on top. A flourish that contradicts the chosen emotion is a finding.
- S23 Process: interaction and visuals are designed together, so motion and layout cannot be told apart as separate layers. A rule or a feel that a static picture cannot settle is judged in an interactive prototype.
- S24 Real people: the flow is tested with real people in real context, and the design is looked at again the next day with fresh eyes; defects invisible while building show up then.

## Build

### Respond and never wait

- Show the pressed state on pointer-down. Commit on pointer-up. Keep the visual press feedback in craft.md.
- Audit the input path for debounces, `setTimeout` waits, transitions that block clicks, and a tap delay. Remove each one that is not essential. A button that disables itself for 300ms before accepting a click is the typical offender.
- During a drag or a slider move, write the position on every pointer move. Do not animate only when the gesture ends.

### Confirmation and undo

- Prefer an immediate action plus an undo (a toast with an Undo button that lasts several seconds) for reversible changes such as archive, move or remove from a list.
- Use a confirmation dialog only for destructive, irreversible acts (permanent delete, send to others, spend money). Name the consequence in the dialog, label the confirm button with the verb ("Delete 14 files"), and make the safe choice the default focus.
- For an AI feature, show the result as a draft with a preview and an explicit accept step before it changes anything the person owns.

### Permissions

- Pre-explain in the product's own screen only when the system prompt is one-shot and cannot be asked again; otherwise trigger the system prompt itself from the action that needs it.
- Request nothing at launch. Request camera when the person taps the camera feature, location when they open the map, notifications when they turn on a reminder.

### Validation

- Validate on blur for format and completeness, and on input for constraints the person can fix as they type (password rules, character counts). Clear the error as soon as the value becomes valid.
- Place the message directly under the field, tie it with `aria-describedby`, and keep the field's value on error.
- Do not block submit with a disabled button that gives no reason; show what is missing.

### Wayfinding checklist

- Name the screen in a title or a selected nav item (where).
- Show the available destinations (where to go).
- Show a count, a summary or a first item for what is inside (what is here).
- Provide a visible back, close or cancel, and Escape for dialogs (how out).

### Flexibility

- Use rem or em for spacing so a larger text size scales the layout with it; leave room for labels about 30% longer after translation.
- Check right-to-left with logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`) instead of left and right.
- Do not rely on color alone, hover alone, or a gesture alone; give each a second route.
- Offer personalization as an explicit edit mode: reorder with a handle, hide with a toggle, reset in one place.

### Process

- Build the interaction as a working prototype early. A running demo reveals what mockups hide and sets the bar the final build must meet.
- Review motion and flow the day after writing them. Slow the playback or step frame by frame to catch what full speed hides.
- Test on real people doing the real task on a real device; record where they hesitate.
