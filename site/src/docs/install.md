# Installation

There are three ways to add an AscentUI item to your app. All three give you source files in your own project that you can read and change.

AscentUI components are React 19 and TypeScript. Each one is a single `.tsx` file with its styles inside, so there is no CSS file to wire up beyond the theme.

## 1. The shadcn CLI

Each item has an address in the registry. Add one by its address:

```bash
npx shadcn@latest add {{REGISTRY}}/r/data-table.json
```

Add the theme first. It puts `tokens.css` under `styles/ascentui/` (inside `src/` if your app has one), and the components read its CSS variables. Import it once, at your app's entry:

```bash
npx shadcn@latest add {{REGISTRY}}/r/theme.json
```

Every free component marked built in the [library](#library) is in the registry under its file name, such as `button`, `text-field` or `combo-box`, along with `theme`. Installing one brings the parts it is built from, such as `field` for every form component.

Pro components (Data Grid, Chart, Month Grid, Upload, Command Menu, Stepper Form, Bottom Sheet, Pull to Refresh) install the same way from the Pro registry, `@ascentui-pro/<name>`, once your access key is in `components.json`. They bring the free parts they build on. Chart also needs the `recharts` package, which the CLI installs for you.

## 2. A registry namespace

If you install more than one item, register the namespace once in your `components.json`:

```json
{
  "registries": {
    "@ascentui": "{{REGISTRY}}/r/{name}.json"
  }
}
```

Then install by name:

```bash
npx shadcn@latest add @ascentui/data-table
```

### Pro items (planned)

Pro items will live at the same addresses and answer only when the request carries your access key. Keep the key in `.env.local`, never in your code:

```bash
ASCENTUI_KEY=asc_your_key_here
```

```json
{
  "registries": {
    "@ascentui": {
      "url": "{{REGISTRY}}/r/{name}.json",
      "headers": { "Authorization": "Bearer ${ASCENTUI_KEY}" }
    }
  }
}
```

There are no Pro items in the registry yet. Checkout, sign-in and access keys are planned for the Pro launch.

## 3. Manual copy

1. Copy `tokens.css` into your app and import it once, at your app's entry.
2. Copy the component's `.tsx` file, and the files it imports from `./`, into one folder.
3. Import the component. Its styles come with it.

```tsx
import './styles/tokens.css';
import { DataTable } from './components/ui/data-table';
```

## npm packages (planned)

The same code is also organised as two packages, `@ascentui/tokens` and `@ascentui/ui`. They are not published yet.

## After installing

Components take their data through props. None of them fetches anything on its own, so they work the same with demo data and with your real API.
