# Theming

The look of every component comes from one file, `tokens.css`. Components never contain a colour, size or speed of their own; they only read its `--asc-*` variables. Change a value there and every component follows.

Install it once, at your app's entry:

```tsx
import "./styles/ascentui/tokens.css";
```

## What the theme does for you

Four things are handled in that one file, so no component has to repeat them and you never have to remember them:

| | What happens | Why it matters |
| --- | --- | --- |
| **Light and dark** | Put `class="dark"` or `data-theme="dark"` on `<html>`, or on any wrapper | Every component switches together. You can even show a light panel inside a dark page |
| **Phones** | On touch screens, controls grow to 44px and text to 15px | Easy to hit with a thumb. Nothing else changes, so the design stays the same |
| **Less motion** | If someone has asked their device for less motion, transitions stop | Some people get dizzy or distracted by movement. This respects their setting everywhere |
| **Native parts** | Scrollbars, checkboxes and date pickers are told which theme is on | No white scrollbar in the middle of a dark app |

## Change the look

Override any variable in your own stylesheet:

```css
:root {
  --asc-primary: #2456d6;   /* your brand colour for main buttons */
  --asc-radius: 4px;        /* sharper corners */
}
.dark {
  --asc-primary: #7aa2ff;
}
```

**Your styles always win.** The theme and every component put their styles in a CSS layer called `asc`. Anything you write outside a layer comes after it, so a plain rule like `.asc-btn { border-radius: 0 }` works without `!important` and without fighting the component.

## The variables

| Group | Variables | Use |
| --- | --- | --- |
| Ground | `--asc-page`, `--asc-surface`, `--asc-subtle`, `--asc-subtle-strong` | The page, cards on it, washes on cards |
| Lines | `--asc-border`, `--asc-border-strong` | Hairlines between and around things |
| Text | `--asc-ink`, `--asc-muted`, `--asc-faint`, `--asc-placeholder` | `ink` and `muted` are for reading. `faint` and `placeholder` are too light for text people must read, so they are for icons and empty fields only |
| Action | `--asc-primary`, `--asc-on-primary`, `--asc-focus` | Main buttons and the keyboard focus ring |
| Status | `--asc-success`, `--asc-warning`, `--asc-danger`, `--asc-info`, each with `-soft` | A strong colour for the words, a soft one for the ground behind them |
| Hues | `--asc-hue-blue`, `-green`, `-amber`, `-red`, `-purple` | Charts, dots and avatars. Never text |
| Type | `--asc-font`, `--asc-font-mono`, `--asc-text-xs` to `--asc-text-xl` | One typeface; monospace only for codes |
| Controls | `--asc-control-sm`, `-md`, `-lg`, `--asc-control-text`, `--asc-input-text` | One height scale for buttons, inputs and selects, so a row of them always lines up |
| Space | `--asc-space-2` to `--asc-space-24` | Steps of 2, 4, 6, 8, 12, 16 and 24px |
| Corners | `--asc-radius-sm`, `--asc-radius`, `--asc-radius-lg`, `--asc-radius-full` | 5, 7 and 10px, and fully round |
| Shadow | `--asc-shadow-control`, `-control-hover`, `--asc-shadow-pop` | A half-pixel hairline for controls; a real shadow only for things that float |
| Motion | `--asc-ease`, `--asc-duration`, `--asc-duration-slow` | Set to zero when less motion is asked for |

The values follow affectUI's clean style, so AscentUI and affectUI components sit together without a seam.

## Small details that are easy to miss

- **Inputs are 16px on phones.** Below 16px, iPhones zoom the whole page when someone taps a field. `--asc-input-text` handles it.
- **Numbers line up.** Counts, money and stats use equal-width digits, so a total changing from 9 to 10 does not make the row jump.
- **Colour is never the only signal.** Statuses always carry a word, for people who cannot tell red from green.
- **Every name starts with `asc-`.** Nothing clashes with your own CSS or another kit's.

## A brand object (planned)

One `brand` object that sets the colours, font and corners for light and dark in one place is planned. Until then, override the variables as above.

## The three older components

The data table, chart and month grid came from an earlier system and still read older variable names. Until they are rebuilt on this theme, also import `legacy.css` and `base.css` from the same folder.
