---
name: think
description: Consult the Fable-thinker for a judgment. Use when the user asks which option is better, how to approach something with more than one plausible design, or for a decision or recommendation, and whenever a design judgment is open. Skip it when reading code or docs settles the question.
argument-hint: "[question]"
---

Spawn the `x:Fable-thinker` agent with the question (the user's, in their words, or the judgment open in this conversation), the files that matter and what this conversation has learned. Check its claims against the code, then relay its answer in full with any claim that did not hold. It is input, not orders: leave the choices it marks as the user's to the user.
