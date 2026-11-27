// Batch 1: actions and display. The demos use a fictional service company's data.
import { Avatar, AvatarGroup } from '@kit/avatar';
import avatarSrc from '@kit/avatar.tsx?raw';
import { Badge } from '@kit/badge';
import badgeSrc from '@kit/badge.tsx?raw';
import { Button } from '@kit/button';
import buttonSrc from '@kit/button.tsx?raw';
import { Card } from '@kit/card';
import cardSrc from '@kit/card.tsx?raw';
import { EmptyState } from '@kit/empty-state';
import emptySrc from '@kit/empty-state.tsx?raw';
import { IconButton } from '@kit/icon-button';
import iconButtonSrc from '@kit/icon-button.tsx?raw';
import { Separator } from '@kit/separator';
import separatorSrc from '@kit/separator.tsx?raw';
import { Skeleton } from '@kit/skeleton';
import skeletonSrc from '@kit/skeleton.tsx?raw';
import { Spinner } from '@kit/spinner';
import spinnerSrc from '@kit/spinner.tsx?raw';
import { StatCard } from '@kit/stat-card';
import statSrc from '@kit/stat-card.tsx?raw';
import { Tooltip } from '@kit/tooltip';
import tooltipSrc from '@kit/tooltip.tsx?raw';
import { useState } from 'react';
import { Arrow, Copy, Inbox, More, Pencil, Plus, Search, Trash } from './icons';
import type { Preview } from './types';

const G = 'Actions and display';
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 } as const;
const col = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 } as const;
const label = { fontSize: 12, color: 'var(--asc-muted)', fontWeight: 500, margin: 0 } as const;
const touch = 'On touch screens it grows to a 44px tap target with 15px text. The look stays the same.';
const theme = 'Light and dark come from the theme. Nothing in this file mentions a colour.';
const layer = 'Its styles sit in the asc layer, so any style you write yourself wins without !important.';

function ButtonDemo() {
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };
  return (
    <div style={col}>
      <p style={label}>Variants</p>
      <div style={row}>
        <Button loading={saving} onClick={save}>{saving ? 'Saving' : 'Save case'}</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="danger" icon={<Trash />}>Delete</Button>
      </div>
      <p style={label}>Sizes and icons</p>
      <div style={row}>
        <Button size="sm" variant="secondary" icon={<Plus />}>Add line</Button>
        <Button variant="secondary" iconRight={<Arrow />}>Continue</Button>
        <Button size="lg">Send quote</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
    </div>
  );
}

function IconButtonDemo() {
  return (
    <div style={row}>
      <IconButton icon={<Pencil />} label="Edit case" />
      <IconButton icon={<Copy />} label="Copy link" />
      <IconButton icon={<More />} label="More actions" variant="secondary" />
      <IconButton icon={<Trash />} label="Delete case" variant="danger" />
      <IconButton icon={<Plus />} label="New case" variant="primary" size="lg" />
    </div>
  );
}

function BadgeDemo() {
  return (
    <div style={col}>
      <div style={row}>
        <Badge>Draft</Badge>
        <Badge tone="info" dot>Scheduled</Badge>
        <Badge tone="success" dot>Paid</Badge>
        <Badge tone="warning">Due in 2 days</Badge>
        <Badge tone="danger">Overdue</Badge>
      </div>
      <div style={row}>
        <Badge size="sm">12</Badge>
        <Badge size="sm" tone="info">New</Badge>
      </div>
    </div>
  );
}

function CardDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, width: 'min(100%,560px)' }}>
      <Card
        title="Pool pump not priming"
        description="CASE-1042 · Harbour Pools"
        action={<IconButton icon={<More />} label="Case actions" size="sm" />}
      >
        <div style={{ ...row, justifyContent: 'flex-start' }}>
          <Badge tone="info" dot>Scheduled</Badge>
          <Badge tone="warning">In warranty</Badge>
        </div>
      </Card>
      <Card
        title="Annual heat pump service"
        description="Quote Q-0317 · sent 2 days ago"
        footer={
          <>
            <Button size="sm" variant="ghost">Decline</Button>
            <Button size="sm">Accept</Button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'var(--asc-muted)' }}>Total 567.60, deposit 170.28 due on acceptance.</p>
      </Card>
    </div>
  );
}

const TEAM = [{ name: 'Dana Whitfield' }, { name: 'Rafael Okafor' }, { name: 'Mei Lindqvist' }, { name: 'Sam Kaur' }, { name: 'Ana Ruiz' }, { name: 'Tom Hale' }];

function AvatarDemo() {
  return (
    <div style={col}>
      <div style={row}>
        <Avatar name="Dana Whitfield" size="sm" />
        <Avatar name="Rafael Okafor" />
        <Avatar name="Mei Lindqvist" size="lg" />
        <Avatar name="Sam Kaur" src="data:image/png;base64,AAAA" size="lg" />
      </div>
      <AvatarGroup people={TEAM} max={4} />
    </div>
  );
}

function StatDemo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, width: 'min(100%,600px)' }}>
      <StatCard label="Open cases" value={42} delta="6 fewer than last week" trend="good" />
      <StatCard label="Billed this month" value={18420} format={{ style: 'currency', currency: 'USD' }} delta="Up 12%" trend="good" />
      <StatCard label="Overdue invoices" value={3} delta="1 more than last week" trend="bad" />
    </div>
  );
}

function EmptyDemo() {
  return (
    <Card padding="none" style={{ width: 'min(100%,480px)' }}>
      <EmptyState
        icon={<Inbox />}
        title="No cases yet"
        description="New cases appear here when a customer books a visit or you add one."
        action={<Button icon={<Plus />}>New case</Button>}
      />
    </Card>
  );
}

function SeparatorDemo() {
  return (
    <div style={{ ...col, width: 'min(100%,360px)', alignItems: 'stretch' }}>
      <Button variant="secondary">Continue with Google</Button>
      <Separator label="or" />
      <Button>Continue with email</Button>
      <div style={{ ...row, height: 20, color: 'var(--asc-muted)', fontSize: 13 }}>
        <span>12 open</span>
        <Separator orientation="vertical" />
        <span>3 overdue</span>
        <Separator orientation="vertical" />
        <span>Updated 2 min ago</span>
      </div>
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div style={{ ...col, width: 'min(100%,360px)', alignItems: 'stretch' }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Skeleton shape="circle" height={32} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" />
          </div>
        </div>
        <Skeleton lines={3} />
      </Card>
      <div style={row}>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" label="Loading cases" />
        <Button variant="secondary" loading>Syncing</Button>
      </div>
    </div>
  );
}

function TooltipDemo() {
  return (
    <div style={row}>
      <Tooltip content="Search cases, contacts and invoices">
        <Button variant="secondary" icon={<Search />}>Search</Button>
      </Tooltip>
      <Tooltip content="Shown below" side="bottom">
        <Button variant="ghost">Hover or tab to me</Button>
      </Tooltip>
    </div>
  );
}

const variantRow = { name: 'variant', type: '"primary" | "secondary" | "ghost" | "danger"', def: '"primary"', desc: 'primary for the one main action on a screen; secondary for the rest; ghost in toolbars; danger to delete' };
const sizeRow = { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: '24, 28 or 32px high on a desk; 36 or 44px on touch screens' };

export const ACTIONS_DISPLAY: Preview[] = [
  {
    slug: 'button',
    name: 'Button',
    group: G,
    description: 'The main way to act. Primary, secondary, ghost and danger, in three sizes, with icons and a loading state.',
    install: ['button'],
    sources: [{ file: 'button.tsx', code: buttonSrc }, { file: 'spinner.tsx', code: spinnerSrc }],
    Demo: ButtonDemo,
    Thumb: () => (
      <div style={row}>
        <Button>Save case</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    ),
    usage: `import { Button } from "@/components/ui/button";

export function CaseActions() {
  return (
    <>
      <Button variant="ghost">Cancel</Button>
      <Button>Save case</Button>
    </>
  );
}`,
    examples: [
      { title: 'Saving', code: `<Button loading={isSaving} onClick={save}>Save case</Button>` },
      { title: 'Deleting', code: `<Button variant="danger" icon={<TrashIcon />} onClick={remove}>Delete</Button>` },
      { title: 'With an icon after the label', code: `<Button variant="secondary" iconRight={<ArrowIcon />}>Continue</Button>` },
    ],
    props: [{
      component: 'Button',
      rows: [
        variantRow,
        sizeRow,
        { name: 'loading', type: 'boolean', def: 'false', desc: 'Shows a spinner and ignores clicks, but stays focusable and announces that it is busy' },
        { name: 'icon', type: 'ReactNode', desc: 'Icon before the label. With no label the button becomes square; use Icon Button instead' },
        { name: 'iconRight', type: 'ReactNode', desc: 'Icon after the label' },
        { name: '...props', type: 'button attributes', desc: 'Everything a native button takes: onClick, disabled, type, ref' },
      ],
    }],
    when: ['Any action someone takes: save, send, approve, delete', 'Async work that takes a moment: the loading state keeps the label readable'],
    whenNot: ['Going to another page: use a link, so it can open in a new tab', 'Switching views: a segmented control shows which one is current'],
    keyboard: [['Enter or Space', 'Press the button']],
    builtIn: [
      'It is a real button element, so the keyboard, screen readers and forms work without extra code.',
      'It defaults to type="button", so it never submits a form by accident. Pass type="submit" when it should.',
      'While loading it stays focusable and says it is busy, instead of going grey and losing the keyboard focus.',
      'A clear focus ring appears for keyboard users only, not on every mouse click.',
      touch,
      theme,
      layer,
    ],
  },
  {
    slug: 'icon-button',
    name: 'Icon Button',
    group: G,
    description: 'A square button with only an icon. Its label is required, and shows as a tooltip.',
    install: ['icon-button'],
    sources: [{ file: 'icon-button.tsx', code: iconButtonSrc }],
    Demo: IconButtonDemo,
    usage: `import { IconButton } from "@/components/ui/icon-button";

<IconButton icon={<PencilIcon />} label="Edit case" onClick={edit} />`,
    examples: [
      { title: 'Without the tooltip', code: `<IconButton icon={<CloseIcon />} label="Close" tooltip={false} />` },
      { title: 'As the main action', code: `<IconButton icon={<PlusIcon />} label="New case" variant="primary" size="lg" />` },
    ],
    props: [{
      component: 'IconButton',
      rows: [
        { name: 'icon', type: 'ReactNode', desc: 'The icon, as an inline svg' },
        { name: 'label', type: 'string', desc: 'Required. What the button does, e.g. "Delete case"' },
        { name: 'tooltip', type: 'boolean', def: 'true', desc: 'Show the label as a tooltip on hover and keyboard focus' },
        { ...variantRow, def: '"ghost"' },
        sizeRow,
      ],
    }],
    when: ['Toolbars, table rows and card headers where space is tight', 'Actions with a universally known icon: edit, delete, close, more'],
    whenNot: ['The main action of a screen, unless the icon is obvious: a labelled Button is clearer'],
    keyboard: [['Enter or Space', 'Press the button'], ['Escape', 'Hide the tooltip']],
    builtIn: [
      'The label is required by the code, so an icon is never left unnamed for screen reader users.',
      'The same label appears as a tooltip, so sighted users never have to guess what an icon means.',
      'Built from Button and Tooltip. Installing it brings both, and fixes to either reach it too.',
      touch,
    ],
  },
  {
    slug: 'badge',
    name: 'Badge',
    group: G,
    description: 'A short status label. The words carry the meaning; colour only reinforces it.',
    install: ['badge'],
    sources: [{ file: 'badge.tsx', code: badgeSrc }],
    Demo: BadgeDemo,
    usage: `import { Badge } from "@/components/ui/badge";

<Badge tone="success" dot>Paid</Badge>`,
    examples: [
      { title: 'A status that changes', code: `<Badge tone={overdue ? "danger" : "info"} dot>{overdue ? "Overdue" : "Scheduled"}</Badge>` },
      { title: 'A count', code: `<Badge size="sm">{openCases}</Badge>` },
    ],
    props: [{
      component: 'Badge',
      rows: [
        { name: 'tone', type: '"neutral" | "info" | "success" | "warning" | "danger"', def: '"neutral"', desc: 'neutral: no urgency. info: in progress. success: done or paid. warning: soon. danger: overdue or failed' },
        { name: 'dot', type: 'boolean', def: 'false', desc: 'A leading dot, for live statuses' },
        { name: 'size', type: '"sm" | "md"', def: '"md"', desc: '18 or 20px high' },
      ],
    }],
    when: ['The state of a record: paid, overdue, scheduled', 'Small counts next to a label'],
    whenNot: ['Actions: a badge is not clickable; use a Button', 'Long text: keep it to one or two words'],
    builtIn: [
      'Each tone is a strong text colour on a soft ground of the same hue, checked for contrast in light and dark.',
      'Numbers use equal-width digits, so a count changing from 9 to 10 does not make the row jump.',
      'Colour is never the only signal: the word is always there for people who cannot tell red from green.',
      theme,
    ],
  },
  {
    slug: 'card',
    name: 'Card',
    group: G,
    description: 'A surface that groups one thing, such as a record summary or a form section, with an optional header and footer.',
    install: ['card'],
    sources: [{ file: 'card.tsx', code: cardSrc }],
    Demo: CardDemo,
    Thumb: () => (
      <Card title="Pool pump not priming" description="CASE-1042 · Harbour Pools" style={{ width: 240 }}>
        <div style={{ ...row, justifyContent: 'flex-start' }}><Badge tone="info" dot>Scheduled</Badge></div>
      </Card>
    ),
    usage: `import { Card } from "@/components/ui/card";

<Card title="Pool pump not priming" description="CASE-1042 · Harbour Pools">
  …
</Card>`,
    examples: [
      { title: 'With actions', code: `<Card title="Quote Q-0317" footer={<><Button variant="ghost">Decline</Button><Button>Accept</Button></>}>…</Card>` },
      { title: 'Edge to edge, for a table', code: `<Card padding="none"><DataTable … /></Card>` },
    ],
    props: [{
      component: 'Card',
      rows: [
        { name: 'title', type: 'ReactNode', desc: 'Heading at the top' },
        { name: 'description', type: 'ReactNode', desc: 'One muted line under the title' },
        { name: 'action', type: 'ReactNode', desc: 'One control at the top right, such as a menu button' },
        { name: 'footer', type: 'ReactNode', desc: 'Actions along the bottom, right-aligned, above a hairline' },
        { name: 'padding', type: '"none" | "md" | "lg"', def: '"md"', desc: 'none for edge-to-edge content such as a table' },
        { name: 'as', type: '"div" | "section" | "article"', def: '"div"', desc: 'section or article when the card stands on its own, for screen readers' },
      ],
    }],
    when: ['A summary of one record in a grid or list', 'A section of a form or settings page'],
    whenNot: ['Inside another card: separate with a Separator instead', 'Around a whole page: the page is already the surface'],
    builtIn: [
      'Edged by a half-pixel hairline and a faint lift instead of a border, so cards look crisp on high-resolution screens.',
      'The title is a real heading, so screen reader users can jump between cards.',
      theme,
      layer,
    ],
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    group: G,
    description: "A person's photo, or their initials on a soft colour that always matches their name. Avatar Group stacks several.",
    install: ['avatar'],
    sources: [{ file: 'avatar.tsx', code: avatarSrc }],
    Demo: AvatarDemo,
    Thumb: () => <AvatarGroup people={TEAM} max={4} size="lg" />,
    usage: `import { Avatar, AvatarGroup } from "@/components/ui/avatar";

<Avatar name="Dana Whitfield" src={user.photo} />
<AvatarGroup people={assignees} max={4} />`,
    examples: [{ title: 'In a list row', code: `<Avatar name={partner.name} size="sm" />` }],
    props: [
      {
        component: 'Avatar',
        rows: [
          { name: 'name', type: 'string', desc: 'Full name: used for the initials, the colour and what screen readers hear' },
          { name: 'src', type: 'string', desc: 'Photo. If it fails to load, the initials show instead' },
          { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: '24, 32 or 40px' },
        ],
      },
      {
        component: 'AvatarGroup',
        rows: [
          { name: 'people', type: '{ name: string; src?: string }[]', desc: 'Who to show, in order' },
          { name: 'max', type: 'number', def: '4', desc: 'How many to show before "+N"' },
          { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: 'Same as Avatar' },
        ],
      },
    ],
    when: ['Who owns, is assigned to or changed something', 'A team or a list of participants'],
    whenNot: ['Company logos that are not round: use an image'],
    builtIn: [
      'The colour comes from the name, so the same person has the same colour on every screen without storing anything.',
      'A broken photo link falls back to initials instead of a broken-image icon.',
      'Screen readers hear the name once; the initials are hidden from them so they are not read out letter by letter.',
      theme,
    ],
  },
  {
    slug: 'stat-card',
    name: 'Stat Card',
    group: G,
    description: 'One number that matters, its label and how it changed. Counts up when it appears.',
    install: ['stat-card'],
    sources: [{ file: 'stat-card.tsx', code: statSrc }],
    Demo: StatDemo,
    Thumb: () => (
      <div style={{ width: 200 }}>
        <StatCard label="Billed this month" value={18420} format={{ style: 'currency', currency: 'USD' }} delta="Up 12%" trend="good" />
      </div>
    ),
    usage: `import { StatCard } from "@/components/ui/stat-card";

<StatCard label="Open cases" value={42} delta="6 fewer than last week" trend="good" />`,
    examples: [
      { title: 'Money', code: `<StatCard label="Billed this month" value={18420} format={{ style: "currency", currency: "USD" }} />` },
      { title: 'A falling number that is good news', code: `<StatCard label="Overdue invoices" value={2} delta="3 fewer than last week" trend="good" />` },
    ],
    props: [{
      component: 'StatCard',
      rows: [
        { name: 'label', type: 'ReactNode', desc: 'What the number is' },
        { name: 'value', type: 'number | string', desc: 'A number counts up and is formatted for the reader; a string shows as it is' },
        { name: 'format', type: 'Intl.NumberFormatOptions', desc: 'How to format a number, e.g. { style: "currency", currency: "USD" }' },
        { name: 'delta', type: 'ReactNode', desc: 'The change, in words: "6 fewer than last week"' },
        { name: 'trend', type: '"good" | "bad" | "neutral"', def: '"neutral"', desc: 'Green or red by meaning, not by direction' },
      ],
    }],
    when: ['A dashboard row of the few numbers people check daily'],
    whenNot: ['A trend over time: use a Chart', 'More than five or six in a row: pick the ones that matter'],
    builtIn: [
      'Numbers and currency are formatted for the reader’s country automatically: 18,420 in one place, 18.420 in another.',
      'Green and red follow good and bad, not up and down: fewer overdue invoices shows green.',
      'Screen readers hear the final number once, not every step of the count-up.',
      'The count-up is skipped for people who have asked their device for less motion.',
      'Digits are equal width, so the number does not wobble as it counts.',
    ],
  },
  {
    slug: 'empty-state',
    name: 'Empty State',
    group: G,
    description: 'What a list or page shows when there is nothing in it yet, with the one action that fills it.',
    install: ['empty-state'],
    sources: [{ file: 'empty-state.tsx', code: emptySrc }],
    Demo: EmptyDemo,
    Thumb: () => <EmptyState size="sm" icon={<Inbox />} title="No cases yet" description="New cases appear here." />,
    usage: `import { EmptyState } from "@/components/ui/empty-state";

{cases.length === 0 && (
  <EmptyState
    title="No cases yet"
    description="New cases appear here when a customer books a visit."
    action={<Button onClick={create}>New case</Button>}
  />
)}`,
    examples: [{ title: 'No search results', code: `<EmptyState size="sm" title="No matches" description={\`Nothing matches "\${query}".\`} action={<Button variant="secondary" onClick={clear}>Clear search</Button>} />` }],
    props: [{
      component: 'EmptyState',
      rows: [
        { name: 'icon', type: 'ReactNode', desc: 'A simple icon for what would be here' },
        { name: 'title', type: 'ReactNode', desc: 'What would be here: "No cases yet"' },
        { name: 'description', type: 'ReactNode', desc: 'Why, or what happens next' },
        { name: 'action', type: 'ReactNode', desc: 'Usually one button that fills the space' },
        { name: 'size', type: '"sm" | "md"', def: '"md"', desc: 'sm inside a card or table; md for a whole page' },
      ],
    }],
    when: ['A list, table or page with no records yet', 'A search or filter with no results'],
    whenNot: ['While loading: use Skeleton, or people think the list is empty', 'For an error: say what went wrong and how to fix it'],
    builtIn: [
      'Every empty list should say why it is empty and what to do next. Agents skip this state unless it exists, so it is a component.',
      'The icon is hidden from screen readers; the title says it in words.',
      theme,
    ],
  },
  {
    slug: 'separator',
    name: 'Separator',
    group: G,
    description: 'A hairline between groups, across or down, with an optional label in the middle.',
    install: ['separator'],
    sources: [{ file: 'separator.tsx', code: separatorSrc }],
    Demo: SeparatorDemo,
    usage: `import { Separator } from "@/components/ui/separator";

<Separator />
<Separator label="or" />`,
    examples: [{ title: 'Between items in a row', code: `<span>12 open</span><Separator orientation="vertical" /><span>3 overdue</span>` }],
    props: [{
      component: 'Separator',
      rows: [
        { name: 'orientation', type: '"horizontal" | "vertical"', def: '"horizontal"', desc: 'Across or down' },
        { name: 'label', type: 'ReactNode', desc: 'Text in the middle, such as "or". Horizontal only' },
        { name: 'decorative', type: 'boolean', def: 'true', desc: 'Set false when the line separates real sections, so screen readers announce it' },
      ],
    }],
    when: ['Between groups inside a card, menu or form', 'Between items in a row of facts'],
    whenNot: ['Between every list row: rows bring their own lines'],
    builtIn: ['Decorative by default, so screen readers do not announce a line between every group.', theme],
  },
  {
    slug: 'skeleton-and-spinner',
    name: 'Skeleton + Spinner',
    group: G,
    description: 'Grey placeholders in the shape of what is loading, and a small spinner for short waits.',
    install: ['skeleton', 'spinner'],
    sources: [{ file: 'skeleton.tsx', code: skeletonSrc }, { file: 'spinner.tsx', code: spinnerSrc }],
    Demo: SkeletonDemo,
    Thumb: () => (
      <div style={{ width: 220 }}>
        <Skeleton lines={3} />
      </div>
    ),
    usage: `import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

{isLoading ? <Skeleton lines={3} /> : <CaseSummary case={data} />}`,
    examples: [
      { title: 'An avatar and a name', code: `<Skeleton shape="circle" height={32} /> <Skeleton width="60%" />` },
      { title: 'A labelled spinner', code: `<Spinner label="Loading cases" />` },
    ],
    props: [
      {
        component: 'Skeleton',
        rows: [
          { name: 'width', type: 'number | string', def: '"100%"', desc: 'e.g. 120 or "60%"' },
          { name: 'height', type: 'number | string', def: '12', desc: 'One line of text by default' },
          { name: 'shape', type: '"rect" | "circle"', def: '"rect"', desc: 'circle for avatars' },
          { name: 'lines', type: 'number', desc: 'A paragraph of this many lines; the last is shorter' },
        ],
      },
      {
        component: 'Spinner',
        rows: [
          { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: '12, 16 or 20px' },
          { name: 'label', type: 'string', desc: 'Read out by screen readers. Leave out inside a labelled button' },
        ],
      },
    ],
    when: ['Skeleton: the first load of a page or list, in the shape of what is coming', 'Spinner: short waits inside a button or a small area'],
    whenNot: ['Waits over a few seconds: show progress or explain what is happening'],
    builtIn: [
      'Placeholders in the shape of the content stop the page jumping when the data arrives.',
      'Screen readers hear "Loading" once, not every grey shape.',
      'The shimmer stops, and the spinner slows, for people who ask their device for less motion.',
      'The spinner takes the colour of the text around it, so it works on any button without settings.',
    ],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    group: G,
    description: 'A short hint on hover and keyboard focus. Wraps one element, such as an icon button.',
    install: ['tooltip'],
    sources: [{ file: 'tooltip.tsx', code: tooltipSrc }],
    Demo: TooltipDemo,
    usage: `import { Tooltip } from "@/components/ui/tooltip";

<Tooltip content="Search cases, contacts and invoices">
  <Button variant="secondary">Search</Button>
</Tooltip>`,
    examples: [{ title: 'Below', code: `<Tooltip content="Last synced 2 min ago" side="bottom">…</Tooltip>` }],
    props: [{
      component: 'Tooltip',
      rows: [
        { name: 'content', type: 'ReactNode', desc: 'The hint. A few words' },
        { name: 'children', type: 'ReactElement', desc: 'One focusable element, such as a button' },
        { name: 'side', type: '"top" | "bottom"', def: '"top"', desc: 'Where the hint appears' },
        { name: 'delay', type: 'number', def: '400', desc: 'Milliseconds before showing on hover' },
      ],
    }],
    when: ['Naming an icon-only control', 'A short extra detail that is not essential'],
    whenNot: ['Anything people must read to use the page: touch screens have no hover', 'Long text or links: use a popover'],
    keyboard: [['Tab', 'Focus the element and show the hint'], ['Escape', 'Hide the hint']],
    builtIn: [
      'Shows on keyboard focus as well as hover, and closes with Escape.',
      'A short delay stops tooltips flickering as the pointer passes over a toolbar.',
      'The hint is linked to the element, so screen readers read it as its description.',
      'It does not open from a tap on touch screens, where it would get in the way.',
    ],
  },
];
