# Accessibility

Every AscentUI component is built so that people using a keyboard, a screen reader, a phone or a "reduce motion" setting can use your app without you doing anything extra. This page says what that covers, and what is still your job.

Each component page has its own **Keyboard interactions**, **Accessibility**, **Motion** and **Responsive behaviour** sections with the detail for that component.

## What every component does

| | What happens | Where it comes from |
| --- | --- | --- |
| **Real elements** | Buttons are buttons, checkboxes are checkboxes, dialogs are the browser's own dialog | Each component file |
| **Keyboard** | Everything you can do with a pointer has a keyboard way, and the order follows the page | Each component file |
| **Focus ring** | A 2px ring in `--asc-focus` appears for keyboard users only, not on every click | The theme and each component |
| **Names** | Icon Button requires a label in its types; fields tie their label, help and error together, and keep the label for screen readers when it is hidden | Each component file |
| **Colour is never alone** | Errors carry an icon, statuses carry a word, charts carry their numbers as a table | Each component file |
| **Contrast** | `--asc-ink` and `--asc-muted` pass 4.5:1 for reading on the page and on surfaces, in light and dark | [Colors](#ds-colors) shows the ratios |
| **Touch** | On touch screens controls grow to 44px and text in fields to 16px | The theme |
| **Less motion** | If someone asks their device for less motion, transitions and animations stop | The theme's motion variables |

## Keyboard

- **Tab** moves between controls. Groups such as a segmented control or a month grid are one stop; the arrow keys move inside them.
- **Enter** and **Space** press buttons and choose options.
- **Escape** closes the innermost thing that is open: a list before the dialog around it, a tooltip before anything else.
- Dialogs keep focus inside while they are open and give it back to the button that opened them.
- The [Toaster](#c-toaster) moves focus to the newest toast with **Alt + T**, so Undo is one key away.

## Screen readers

- Dialogs and drawers announce their title and description as they open, and hide the page behind.
- Form fields read their label, whether they are required, their help text and any error in one go.
- Loading states say "Loading" once instead of reading every placeholder shape.
- Charts include their data as a table, with the chart's label as its caption.
- Toasts are read out; errors interrupt, everything else waits its turn.

## What is still yours to do

The components cannot know your content. These are the parts only you can get right:

- **Write real labels.** "Customer email", not "Field 1". Icon buttons need a label that says what happens: "Delete case", not "Delete".
- **Give every page one `h1`,** and use headings in order. Cards and dialogs bring their own headings below that.
- **Say what went wrong** in errors, and how to fix it: "Enter a date after today", not "Invalid".
- **Check your own colours.** If you change `--asc-primary` or the status colours, check the contrast again. The [Colors](#ds-colors) page shows the ratios for the shipped values.
- **Test with a keyboard.** Unplug the mouse and use your app with Tab, Enter and Escape for five minutes.

## The site itself

This website follows the same rules: a skip link, landmarks, a search palette on **⌘K** or **Ctrl + K** that works from the keyboard, and a sidebar that becomes a drawer on phones and closes with Escape. If something here does not work for you, that is a bug we want to hear about.
