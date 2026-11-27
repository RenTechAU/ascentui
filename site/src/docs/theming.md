# Theming

The look of every component comes from one file of CSS variables, `tokens.css`. Change a variable and every component that reads it changes with it.

## The variables

These are set on `:root`. Override any of them in your own stylesheet, after `tokens.css`.

| Variable | What it controls |
| --- | --- |
| `--bg`, `--page` | The app and page backgrounds |
| `--surface`, `--surface2`, `--surface3` | Cards, panels and raised areas |
| `--border`, `--border2` | Lines and outlines |
| `--text`, `--muted`, `--dim` | Text, from strongest to faintest |
| `--accent`, `--accent-dim` | The one brand colour and its tint |
| `--danger`, `--warn`, `--ok` | Status colours, each with a `-dim` tint |
| `--radius` | Corner radius |
| `--ctl-h`, `--ctl-px`, `--ctl-r`, `--ctl-fs` | Height, padding, radius and text size of form controls |
| `--mono` | The monospace font |
| `--ease` | The one easing curve for motion |

```css
:root {
  --accent: #2456d6;
  --accent-dim: #e6edfc;
  --radius: 6px;
}
```

The variable names may change before the first release. A recommendation to give them an `asc-` prefix, so they cannot clash with other kits, is still open.

## Light and dark

Today `tokens.css` has a **light** palette only.

**Dark is planned.** The intended switch is a `dark` class or a `data-theme="dark"` attribute on a parent element, which re-points the same variables, so no component needs its own dark styles.

Until then you can make a dark theme yourself by overriding the colour variables under your own selector:

```css
[data-theme='dark'] {
  --bg: #0c0c0d;
  --surface: #141415;
  --text: #ededed;
  --muted: #8f8f8f;
  --border: rgba(255, 255, 255, 0.12);
}
```

## A brand object (planned)

The plan is one `brand` object that re-themes everything: light and dark colours, one font, corner radius and spacing. You would edit one object instead of a list of variables.

This is not built yet. It is designed in a prototype and is part of the "Tokens + brand config" item in the [library](#library).

## Styles travel with the component

Each component keeps its styles in its own CSS file and reads the variables above. There is no global stylesheet to keep in step, which is what lets an agent install one component cleanly.
