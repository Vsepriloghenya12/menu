# Responsive Client Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the client video menu usable on phones and tablets in portrait and landscape orientations.

**Architecture:** Keep the existing full-screen paged video structure. Derive responsive layout values from `useWindowDimensions` and apply them to rails, typography, information, actions, and modals. Allow Android orientation changes through Expo config.

**Tech Stack:** Expo, React Native, TypeScript.

---

### Task 1: Allow Device Orientation

- [ ] Change Expo orientation from `landscape` to `default`.
- [ ] Verify public Expo config.

### Task 2: Responsive Video Screen

- [ ] Define breakpoints for phone portrait, tablet portrait, compact landscape, and wide landscape.
- [ ] Keep category and dish rails horizontally scrollable and single-line.
- [ ] Stack information and action buttons vertically on portrait screens.
- [ ] Scale title, description, price, padding, and button sizes.
- [ ] Use full-width actions on phones and the existing right dock on wide screens.

### Task 3: Responsive Modals

- [ ] Reduce modal padding and typography on phones.
- [ ] Reflow the 3D viewer header vertically in narrow portrait mode.

### Task 4: Verification

- [ ] Run Expo Doctor.
- [ ] Run TypeScript.
- [ ] Run tests.
- [ ] Run web export.
