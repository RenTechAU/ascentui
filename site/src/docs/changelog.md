# Changelog

What changed, newest first. AscentUI is in pre-release: nothing is published to npm or a public registry yet.

## 28 November 2026: the site takes its final shape

- The site now has a sidebar on every page apart from the home page, with search on **⌘K** or **Ctrl + K**, the docs, the design system, and every component.
- A light theme for the site, alongside the dark one.
- The library filters by section, tier and status, and shows a live preview for every built component.
- Component pages follow one order, from install to related components, with CLI and manual install, package-manager tabs, and new Accessibility, Motion and Responsive behaviour sections.
- New docs: Accessibility, Agent skills (planned) and this changelog.
- A design system section that reads the theme file directly, so it can never drift from it.

## 28 November 2026: batch 3, data and overlays

- **Toaster**, with Undo built in, errors that stay until dismissed, and Alt + T to reach the newest toast.
- **Dialog + Drawer**, on the browser's own dialog, with a confirm that puts focus on Cancel.
- **Chart**: bars, lines, areas, pie and donut, sparklines and meters, each with its numbers as a table for screen readers.
- **Data Table**: sorting, grouping, column choices, saved views, selection with bulk actions, and paging.
- **Month Grid**: a month calendar that starts the week where the reader expects.
- Fixes from a headless check: toasts stay usable over open dialogs, a drawer starts on its title, charts and tooltips no longer widen the page on phones.

## 28 November 2026: batch 2, forms

- The **form kit**: labels, required marks, help and error text, and form sections.
- **Text Field, Text Area, Number Input, Select, Combo Box, Switch, Checkbox, Date + Time Picker, Segmented Control and PIN Input**, all on the form kit.
- A page for each, with a live preview.

## 28 November 2026: batch 1, the theme and the first ten

- **The theme**: one file of `--asc-*` variables for light and dark, touch-screen sizes and reduced motion. Your own styles always win.
- **Button, Icon Button, Badge, Card, Avatar, Stat Card, Empty State, Separator, Skeleton + Spinner and Tooltip.**
- Each component is one file with its styles inside, and installs from the registry with the shadcn CLI.
- A live preview page for every component.

## 27 to 28 November 2026: foundations

- The plan, the catalog and the free-or-Pro rule: every component is free, screens that work are Pro.
- The first website: library, docs, pricing and a draft licence.
- The registry build: one item per component, plus `llms.txt` and `llms-full.txt` for agents.
- A mock-first scaffold for checkout, access keys and the key-gated registry, ready for Pro.
