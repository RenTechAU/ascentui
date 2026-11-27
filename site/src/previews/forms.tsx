// Batch 2: forms. The demos use a fictional service company's data.
import { Button } from '@kit/button';
import { Card } from '@kit/card';
import { Checkbox } from '@kit/checkbox';
import checkboxSrc from '@kit/checkbox.tsx?raw';
import { ComboBox, type ComboBoxOption } from '@kit/combo-box';
import comboSrc from '@kit/combo-box.tsx?raw';
import { DatePicker } from '@kit/date-picker';
import dateSrc from '@kit/date-picker.tsx?raw';
import { Field, FormSection } from '@kit/field';
import fieldSrc from '@kit/field.tsx?raw';
import { NumberInput } from '@kit/number-input';
import numberSrc from '@kit/number-input.tsx?raw';
import { PinInput } from '@kit/pin-input';
import pinSrc from '@kit/pin-input.tsx?raw';
import { SegmentedControl } from '@kit/segmented-control';
import segmentedSrc from '@kit/segmented-control.tsx?raw';
import { Select } from '@kit/select';
import selectSrc from '@kit/select.tsx?raw';
import { Switch } from '@kit/switch';
import switchSrc from '@kit/switch.tsx?raw';
import { TextArea } from '@kit/text-area';
import textAreaSrc from '@kit/text-area.tsx?raw';
import { TextField } from '@kit/text-field';
import textFieldSrc from '@kit/text-field.tsx?raw';
import { useState, type FormEvent } from 'react';
import { Mail, Search } from './icons';
import type { Preview, PropRow } from './types';

const G = 'Forms';
const col = (width: number) => ({ display: 'flex', flexDirection: 'column', gap: 16, width: `min(100%, ${width}px)` }) as const;
const pair = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 } as const;
const label = { fontSize: 12, color: 'var(--asc-muted)', fontWeight: 500, margin: 0 } as const;
const note = { margin: 0, fontSize: 12, color: 'var(--asc-muted)' } as const;

// Shared plain-words points, so every form page says them the same way
const touch = 'On touch screens it grows to a 44px tap target. The look stays the same.';
const zoom = 'Text inside the field is 16px on phones. Anything smaller makes an iPhone zoom the whole page when the field is tapped.';
const labelled = 'The label is tied to the field, so tapping the label focuses it and screen readers read the label, help and error together.';
const errors = 'An error turns the field red, adds an icon so colour is not the only sign, and is read out with the field.';
const kit = 'Built on the form kit (field.tsx). Installing it brings the kit, so labels, help and errors look the same on every field.';
const theme = 'Light and dark come from the theme. Nothing in this file mentions a colour.';

// Rows that most form components share
const r = {
  label: { name: 'label', type: 'ReactNode', desc: 'What the field is. Leave it out only if you give the field an aria-label' },
  description: { name: 'description', type: 'ReactNode', desc: 'Help under the field: a format, an example, or why you ask' },
  error: { name: 'error', type: 'ReactNode', desc: 'What is wrong and how to fix it. Turns the field red; true marks it invalid without text' },
  required: { name: 'required', type: 'boolean', def: 'false', desc: 'Adds an asterisk and tells the browser and screen readers the field is required' },
  hideLabel: { name: 'hideLabel', type: 'boolean', def: 'false', desc: 'Hides the label visually. Screen readers still read it' },
  size: { name: 'size', type: '"sm" | "md" | "lg"', def: '"md"', desc: '24, 28 or 32px high on a desk, like Button; 36 or 44px on touch screens' },
  disabled: { name: 'disabled', type: 'boolean', def: 'false', desc: 'Greyed out and skipped by the keyboard' },
} satisfies Record<string, PropRow>;

// ---------------------------------------------------------------- data

const CUSTOMERS: ComboBoxOption[] = [
  { value: 'c1', label: 'Harbour Pools', description: 'Manly · 12 cases', keywords: '0412 555 019' },
  { value: 'c2', label: 'Northside Dental', description: 'Chatswood · 3 cases' },
  { value: 'c3', label: 'Greenleaf Café', description: 'Newtown · 7 cases' },
  { value: 'c4', label: 'Coastal Fitness', description: 'Bondi · 5 cases' },
  { value: 'c5', label: 'José Martín', description: 'Home owner · Mosman' },
  { value: 'c6', label: 'Bayview Apartments', description: 'Strata · 21 cases' },
  { value: 'c7', label: 'Riverside Childcare', description: 'Parramatta · 2 cases' },
  { value: 'c8', label: 'Summit Physio', description: 'Ryde · on hold', disabled: true },
];
const TECHS = [
  { value: 'dana', label: 'Dana Whitfield' },
  { value: 'rafael', label: 'Rafael Okafor' },
  { value: 'mei', label: 'Mei Lindqvist' },
  { value: 'sam', label: 'Sam Kaur' },
];
const today = () => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- demos

function NewCaseForm() {
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [customer, setCustomer] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [tech, setTech] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState<number | null>(180);
  const [remind, setRemind] = useState(true);
  const [tried, setTried] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const missing = { customer: !customer, date: !date };
  const save = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (missing.customer || missing.date) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
    }, 900);
  };
  const create = (text: string) => {
    const option = { value: `new-${customers.length}`, label: text, description: 'New customer' };
    setCustomers([option, ...customers]);
    setCustomer(option.value);
  };

  if (saved) {
    const name = customers.find((c) => c.value === customer)?.label;
    return (
      <Card title="Case saved" description={`CASE-1043 · ${name}`} style={col(520)} footer={<Button variant="secondary" size="sm" onClick={() => setSaved(false)}>Back to the form</Button>}>
        <p style={note}>{remind ? 'A reminder goes to the customer the day before the visit.' : 'No reminder will be sent.'}</p>
      </Card>
    );
  }
  return (
    <Card as="section" title="New case" description="Book a visit for a customer." style={col(520)}>
      <form noValidate onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <FormSection title="Booking" description="Who the visit is for, and when.">
          <ComboBox
            label="Customer"
            required
            options={customers}
            value={customer}
            onChange={(v) => setCustomer(v)}
            onCreate={create}
            placeholder="Search by name, suburb or phone"
            error={tried && missing.customer && 'Choose a customer, or type a new name to add one.'}
          />
          <div style={pair}>
            <DatePicker label="Date" required min={today()} value={date} onChange={setDate} error={tried && missing.date && 'Pick the day of the visit.'} />
            <DatePicker label="Arrive at" kind="time" step={900} value={time} onChange={setTime} />
          </div>
          <Select label="Technician" placeholder="Not assigned yet" options={TECHS} value={tech} onChange={(e) => setTech(e.target.value)} description="You can assign one later from the schedule." />
        </FormSection>
        <FormSection title="Job" description="What the technician needs to know.">
          <TextArea label="Notes for the technician" minRows={2} maxLength={280} showCount value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, parking, what the customer reported" />
          <NumberInput label="Call-out price" prefix="$" min={0} step={10} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} value={price} onChange={setPrice} />
          <Switch label="Send reminder" description="Texts the customer the day before the visit." checked={remind} onChange={(e) => setRemind(e.target.checked)} />
        </FormSection>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" type="reset" onClick={() => setTried(false)}>Cancel</Button>
          <Button type="submit" loading={saving}>Save case</Button>
        </div>
      </form>
    </Card>
  );
}

function FieldDemo() {
  return (
    <div style={{ ...col(720), gap: 32, alignItems: 'center' }}>
      <NewCaseForm />
      <div style={col(720)}>
        <p style={label}>A settings section, heading beside the fields when there is room</p>
        <Card>
          <FormSection layout="split" title="Billing" description="Where invoices go, and when they are due.">
            <TextField label="Billing email" type="email" autoComplete="email" defaultValue="accounts@harbourpools.com" />
            <Select label="Payment terms" defaultValue="14" options={[{ value: '7', label: '7 days' }, { value: '14', label: '14 days' }, { value: '30', label: '30 days' }]} />
            <Field label="Brand colour" description="Your own control, labelled the kit’s way.">
              {(c) => <input {...c} type="color" defaultValue="#1e8a4f" style={{ width: 44, height: 28, padding: 0, border: 0, background: 'none' }} />}
            </Field>
          </FormSection>
        </Card>
      </div>
    </div>
  );
}

function FieldThumb() {
  return (
    <div style={col(240)}>
      <TextField label="Customer email" required placeholder="name@company.com" />
      <TextField label="Site contact" error="Add a phone number." defaultValue="Dana" size="sm" />
    </div>
  );
}

function SegmentedDemo() {
  const [view, setView] = useState('open');
  const [range, setRange] = useState('week');
  return (
    <div style={{ ...col(460), alignItems: 'center', gap: 24 }}>
      <SegmentedControl
        aria-label="Cases"
        value={view}
        onChange={setView}
        options={[
          { value: 'open', label: 'Open', count: 12 },
          { value: 'scheduled', label: 'Scheduled', count: 5 },
          { value: 'done', label: 'Done', count: 48 },
        ]}
      />
      <p style={note}>Showing {view} cases</p>
      <SegmentedControl
        label="Report period"
        size="sm"
        value={range}
        onChange={setRange}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'year', label: 'Year', disabled: true },
        ]}
      />
      <div style={{ width: '100%' }}>
        <SegmentedControl
          label="Visit type"
          fullWidth
          defaultValue="service"
          options={[{ value: 'install', label: 'Install' }, { value: 'service', label: 'Service' }, { value: 'repair', label: 'Repair' }]}
        />
      </div>
    </div>
  );
}

function SelectDemo() {
  const [customers, setCustomers] = useState(CUSTOMERS);
  const [customer, setCustomer] = useState<string | null>('c1');
  return (
    <div style={col(380)}>
      <ComboBox
        label="Customer"
        description='Type to search. Try "bondi", "jose" or a new name.'
        options={customers}
        value={customer}
        onChange={(v) => setCustomer(v)}
        onCreate={(text) => {
          const option = { value: `new-${customers.length}`, label: text, description: 'New customer' };
          setCustomers([option, ...customers]);
          setCustomer(option.value);
        }}
        placeholder="Search customers"
      />
      <Select label="Technician" placeholder="Choose a technician" required options={TECHS} defaultValue="" />
      <Select
        label="Job type"
        size="sm"
        defaultValue="pump"
        options={[
          { group: 'Pools', options: [{ value: 'pump', label: 'Pump not priming' }, { value: 'heat', label: 'Heat pump service' }] },
          { group: 'Plumbing', options: [{ value: 'leak', label: 'Leak' }, { value: 'hws', label: 'Hot water system' }] },
        ]}
      />
    </div>
  );
}

function SelectThumb() {
  return (
    <div style={col(240)}>
      <Select label="Technician" defaultValue="dana" options={TECHS} />
      <ComboBox label="Customer" options={CUSTOMERS} defaultValue="c1" />
    </div>
  );
}

function SwitchDemo() {
  const [lines, setLines] = useState({ parts: true, labour: true, travel: false });
  const all = Object.values(lines).every(Boolean);
  const some = Object.values(lines).some(Boolean);
  return (
    <div style={{ ...col(420), gap: 24 }}>
      <Card title="Notifications" description="What customers hear from you.">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Switch placement="end" label="Visit reminders" description="A text the day before each visit." defaultChecked />
          <Switch placement="end" label="Quote follow-ups" description="An email if a quote is not answered in 3 days." />
          <Switch placement="end" label="Invoice receipts" disabled defaultChecked description="Always on for paid plans." />
        </div>
      </Card>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Checkbox
          label="Bill all lines"
          checked={all}
          indeterminate={some && !all}
          onChange={(e) => setLines({ parts: e.target.checked, labour: e.target.checked, travel: e.target.checked })}
        />
        <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column' }}>
          {(['parts', 'labour', 'travel'] as const).map((k) => (
            <Checkbox key={k} label={k[0]!.toUpperCase() + k.slice(1)} checked={lines[k]} onChange={(e) => setLines({ ...lines, [k]: e.target.checked })} />
          ))}
        </div>
        <Checkbox label="I have checked the site is safe to work on" required error="Confirm this before starting the job." />
      </div>
    </div>
  );
}

function SwitchThumb() {
  return (
    <div style={col(220)}>
      <Switch label="Send reminder" defaultChecked />
      <Checkbox label="Bill travel time" defaultChecked />
    </div>
  );
}

function DateDemo() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:30');
  return (
    <div style={col(380)}>
      <div style={pair}>
        <DatePicker label="Visit date" min={today()} value={date} onChange={setDate} required />
        <DatePicker label="Arrive at" kind="time" step={900} value={time} onChange={setTime} description="Every 15 minutes" />
      </div>
      <DatePicker label="Follow-up call" kind="datetime" defaultValue="2026-12-04T14:00" />
      <DatePicker label="Warranty ends" defaultValue="2027-03-31" readOnly description="Set from the product's purchase date." />
      <p style={note}>Value: {date || 'empty'}{date && ` at ${time}`}</p>
    </div>
  );
}

function DateThumb() {
  return (
    <div style={{ ...col(260), ...pair }}>
      <DatePicker label="Visit date" defaultValue="2026-12-04" />
      <DatePicker label="Arrive at" kind="time" defaultValue="09:30" />
    </div>
  );
}

function TextFieldDemo() {
  const [email, setEmail] = useState('accounts@harbourpools');
  const bad = email !== '' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return (
    <div style={col(380)}>
      <TextField label="Contact name" required autoComplete="name" placeholder="Dana Whitfield" />
      <TextField
        label="Billing email"
        type="email"
        autoComplete="email"
        prefix={<Mail />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={bad && 'Add the part after the @, e.g. harbourpools.com.'}
      />
      <div style={pair}>
        <TextField label="Call-out fee" prefix="$" inputMode="decimal" defaultValue="180.00" />
        <TextField label="Pump weight" suffix="kg" inputMode="decimal" defaultValue="14.5" />
      </div>
      <TextField label="Search" hideLabel prefix={<Search />} placeholder="Search cases" size="sm" type="search" />
      <TextField label="Case number" readOnly defaultValue="CASE-1042" description="Set when the case is created." />
    </div>
  );
}

function TextAreaDemo() {
  return (
    <div style={col(420)}>
      <TextArea label="Notes for the technician" placeholder="Gate code, parking, what the customer reported" maxLength={140} showCount defaultValue="Side gate code 4821. Pump makes a grinding noise when it starts, and the pool is" />
      <TextArea label="Service report" description="It grows as you type, up to 6 rows, then scrolls." minRows={2} maxRows={6} />
      <TextArea label="Reason for cancelling" required error="Tell the customer why, in a sentence." minRows={2} />
    </div>
  );
}

function NumberDemo() {
  const [qty, setQty] = useState<number | null>(2);
  const [price, setPrice] = useState<number | null>(86.5);
  const total = qty != null && price != null ? qty * price : null;
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  return (
    <div style={col(380)}>
      <div style={pair}>
        <NumberInput label="Quantity" min={1} max={99} value={qty} onChange={setQty} />
        <NumberInput label="Unit price" prefix="$" min={0} step={0.5} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} value={price} onChange={setPrice} />
      </div>
      <NumberInput label="Discount" suffix="%" min={0} max={100} step={5} defaultValue={10} description="Arrow keys add 5; Page Up and Page Down add 50." />
      <NumberInput label="Chlorine reading" suffix="ppm" step={0.1} defaultValue={null} steppers={false} placeholder="Not measured" />
      <p style={note}>Line total: {total == null ? '–' : money.format(total)}</p>
    </div>
  );
}

function PinDemo() {
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'wrong' | 'ok'>('idle');
  const check = (c: string) => {
    setState('checking');
    setTimeout(() => setState(c === '246810' ? 'ok' : 'wrong'), 700);
  };
  return (
    <div style={{ ...col(360), alignItems: 'center', textAlign: 'center' }}>
      <PinInput
        label="Enter the code we sent to 0412 ••• 019"
        value={code}
        onChange={(c) => {
          setCode(c);
          if (state === 'wrong') setState('idle');
        }}
        onComplete={check}
        disabled={state === 'checking' || state === 'ok'}
        error={state === 'wrong' && 'That code is not right. Check the message and try again.'}
        description={state === 'idle' ? 'The code is 246810 in this demo. Try pasting it.' : undefined}
      />
      <p style={note} role="status">{state === 'checking' ? 'Checking…' : state === 'ok' ? 'Signed in.' : ''}</p>
      <PinInput label="Staff PIN" length={4} mask />
    </div>
  );
}

// ---------------------------------------------------------------- pages

export const FORMS: Preview[] = [
  {
    slug: 'form-kit',
    name: 'Form kit',
    group: G,
    description: 'The parts every form field is built from: a label with a required mark, help and error text tied to the control, and sections that group fields under a heading.',
    install: ['field'],
    sources: [{ file: 'field.tsx', code: fieldSrc }],
    Demo: FieldDemo,
    Thumb: FieldThumb,
    usage: `import { Field, FormSection } from "@/components/ui/field";
import { TextField } from "@/components/ui/text-field";

<form noValidate onSubmit={save}>
  <FormSection title="Customer" description="Who the visit is for.">
    <TextField label="Contact name" required error={errors.name} />
    <TextField label="Phone" type="tel" autoComplete="tel" />
  </FormSection>
</form>`,
    examples: [
      {
        title: 'Your own control, labelled the kit’s way',
        code: `<Field label="Brand colour" description="Used on quotes and invoices.">
  {(control) => <input type="color" {...control} />}
</Field>`,
      },
      { title: 'A settings page, heading beside the fields', code: `<FormSection layout="split" title="Billing" description="Where invoices are sent.">…</FormSection>` },
      {
        title: 'Validation that waits for the first submit',
        code: `const [tried, setTried] = useState(false);
<TextField label="Customer" required error={tried && !customer && "Choose a customer."} />`,
      },
    ],
    props: [
      {
        component: 'Field',
        rows: [
          r.label, r.description, r.error, r.required, r.hideLabel,
          { name: 'id', type: 'string', desc: 'The control’s id. One is made for you if you leave it out' },
          { name: 'group', type: 'boolean', def: 'false', desc: 'For a group of controls, such as radios or code boxes: the label names the group instead of pointing at one input' },
          { name: 'children', type: 'ReactNode | (control) => ReactNode', desc: 'The control. As a function it gets id, aria-describedby, aria-invalid and required to spread onto your input' },
        ],
      },
      {
        component: 'FormSection',
        rows: [
          { name: 'title', type: 'ReactNode', desc: 'The group’s heading, e.g. "Billing address"' },
          { name: 'description', type: 'ReactNode', desc: 'One line on what the group is for' },
          { name: 'layout', type: '"stacked" | "split"', def: '"stacked"', desc: 'split puts the heading beside the fields when there is room, as on settings pages' },
          { name: 'level', type: '2 | 3 | 4', def: '3', desc: 'Heading level, so the page outline stays in order' },
        ],
      },
      {
        component: 'InputBox',
        rows: [
          { name: 'controlId', type: 'string', desc: 'The input’s id, used to name the prefix and suffix' },
          { name: 'prefix / suffix', type: 'ReactNode', desc: 'Text or an icon before or after the value. Text is read out with the field' },
          { name: 'end', type: 'ReactNode', desc: 'Controls after the suffix, such as steppers' },
          r.size,
          { name: 'invalid, disabled, readOnly, multiline', type: 'boolean', desc: 'The box’s state. Put className="asc-input__el" on the input inside' },
        ],
      },
      {
        component: 'ChoiceField',
        rows: [
          r.label, r.description, r.error, r.required,
          { name: 'placement', type: '"start" | "end"', def: '"start"', desc: 'Control before the label, or at the far end of the row' },
          { name: 'children', type: '(control) => ReactNode', desc: 'Your input and its drawing. Checkbox and Switch are built on it' },
        ],
      },
    ],
    when: ['Any form: every input in the kit already uses Field, so you only need it for your own controls', 'Grouping a long form into sections people can scan'],
    whenNot: ['A single search box in a toolbar: a Text Field with hideLabel is enough', 'Splitting a long form into steps: use Stepper Form'],
    keyboard: [['Tab', 'Moves through the fields in reading order'], ['Click a label', 'Focuses its field']],
    builtIn: [
      'Required fields get one asterisk, and the browser and screen readers are told too. Optional fields are not marked, so the asterisk stays easy to spot.',
      'Errors and help are linked to the field with aria-describedby, so a screen reader reads "Customer, required, invalid, Choose a customer" in one go.',
      'An error has an icon as well as a colour, for people who cannot tell red apart.',
      'Sections are announced as groups, so a screen reader says "Billing address" before reading the fields inside.',
      'The split layout reacts to the space the form has, not the screen width, so it also works in a narrow side panel.',
      'Every input sits in the same box, so a text field, a select, a date and a button in one row are the same height.',
      'The demo form waits for the first Save before showing errors, so people are not told off while they are still typing.',
      theme,
    ],
  },
  {
    slug: 'segmented-control',
    name: 'Segmented Control',
    group: G,
    description: 'Pick one of two to five options in a single row, with optional counts. A pill slides to the choice.',
    install: ['segmented-control'],
    sources: [{ file: 'segmented-control.tsx', code: segmentedSrc }],
    Demo: SegmentedDemo,
    Thumb: () => (
      <SegmentedControl aria-label="Cases" defaultValue="open" options={[{ value: 'open', label: 'Open', count: 12 }, { value: 'scheduled', label: 'Scheduled', count: 5 }, { value: 'done', label: 'Done' }]} />
    ),
    usage: `import { SegmentedControl } from "@/components/ui/segmented-control";

const [view, setView] = useState("open");

<SegmentedControl
  aria-label="Cases"
  value={view}
  onChange={setView}
  options={[
    { value: "open", label: "Open", count: 12 },
    { value: "scheduled", label: "Scheduled", count: 5 },
    { value: "done", label: "Done" },
  ]}
/>`,
    examples: [
      { title: 'In a form, with a label', code: `<SegmentedControl label="Visit type" name="type" fullWidth defaultValue="service" options={types} />` },
      { title: 'Small, in a toolbar', code: `<SegmentedControl size="sm" aria-label="Period" value={range} onChange={setRange} options={periods} />` },
    ],
    props: [{
      component: 'SegmentedControl',
      rows: [
        { name: 'options', type: '{ value, label, count?, disabled?, aria-label? }[]', desc: 'Two to five choices. count shows a small number after the label' },
        { name: 'value', type: 'string', desc: 'The chosen value, when you control it' },
        { name: 'defaultValue', type: 'string', desc: 'Starting choice otherwise. Defaults to the first option' },
        { name: 'onChange', type: '(value) => void', desc: 'Called with the new value' },
        { name: 'size', type: '"sm" | "md"', def: '"md"', desc: '24 or 28px high on a desk; 36 or 44px on touch screens' },
        { name: 'fullWidth', type: 'boolean', def: 'false', desc: 'Stretch to the container with equal options' },
        { name: 'name', type: 'string', desc: 'Sends the value with a form' },
        r.label, r.description, r.error, r.disabled,
        { name: 'aria-label', type: 'string', desc: 'Names the group when there is no visible label' },
      ],
    }],
    when: ['Switching between views of the same list: Open, Scheduled, Done', 'A choice of two to five short options in a form'],
    whenNot: ['More than five options, or long labels: use a Select', 'Turning one thing on or off: use a Switch', 'Moving between pages: use links or tabs'],
    keyboard: [['Tab', 'Moves to the chosen option, then out of the group'], ['Arrow keys', 'Choose the next or previous option'], ['Space', 'Chooses the focused option']],
    builtIn: [
      'Real radio buttons underneath, so the arrow keys, screen readers and form submission work the way people expect.',
      'Tab stops once on the group, not on every option, so keyboard users are not slowed down.',
      'The pill slides to the new choice, and simply jumps for people who ask their device for less motion.',
      'If the options do not fit on a phone, the row scrolls sideways instead of squashing the words.',
      'Counts use equal-width digits, so the row does not shift when a number changes.',
      touch,
    ],
  },
  {
    slug: 'select-and-combo-box',
    name: 'Select + Combo Box',
    group: G,
    description: 'Pick one from a list. Select is the native dropdown, for short lists. Combo Box searches as you type, for long ones, and can create a new entry.',
    install: ['select', 'combo-box'],
    sources: [{ file: 'select.tsx', code: selectSrc }, { file: 'combo-box.tsx', code: comboSrc }],
    Demo: SelectDemo,
    Thumb: SelectThumb,
    usage: `import { ComboBox } from "@/components/ui/combo-box";
import { Select } from "@/components/ui/select";

<Select label="Technician" placeholder="Choose a technician" options={technicians} value={tech} onChange={(e) => setTech(e.target.value)} />

<ComboBox
  label="Customer"
  options={customers.map((c) => ({ value: c.id, label: c.name, description: c.suburb }))}
  value={customerId}
  onChange={setCustomerId}
/>`,
    examples: [
      {
        title: 'Add a customer that is not in the list',
        code: `<ComboBox
  label="Customer"
  options={options}
  value={customerId}
  onChange={setCustomerId}
  onCreate={async (name) => setCustomerId((await api.createCustomer({ name })).id)}
/>`,
      },
      { title: 'Find by more than the name', code: `{ value: c.id, label: c.name, description: c.suburb, keywords: \`\${c.phone} \${c.email}\` }` },
      { title: 'Headings in a long select', code: `<Select label="Job type" options={[{ group: "Pools", options: poolJobs }, { group: "Plumbing", options: plumbingJobs }]} />` },
    ],
    props: [
      {
        component: 'Select',
        rows: [
          { name: 'options', type: '({ value, label, disabled? } | { group, options })[]', desc: 'The choices, optionally under headings. Or pass <option> children' },
          { name: 'placeholder', type: 'string', desc: 'Shown while nothing is chosen. If the field is required it cannot be picked again' },
          { name: 'prefix', type: 'ReactNode', desc: 'An icon or text before the value' },
          r.label, r.description, r.error, r.required, r.size,
          { name: '...props', type: 'select attributes', desc: 'value, defaultValue, onChange, name, disabled, ref' },
        ],
      },
      {
        component: 'ComboBox',
        rows: [
          { name: 'options', type: '{ value, label, description?, keywords?, disabled? }[]', desc: 'The choices. description and keywords are searched too' },
          { name: 'value', type: 'string | null', desc: 'The chosen value; null for none' },
          { name: 'onChange', type: '(value, option) => void', desc: 'Called with the value and the whole option, or null when cleared' },
          { name: 'onCreate', type: '(text) => void', desc: 'Offers "Create …" when nothing matches. You add the option and select it' },
          { name: 'createLabel', type: '(text) => ReactNode', desc: 'The words on the create option' },
          { name: 'limit', type: 'number', def: '50', desc: 'How many matches show at once; typing narrows the rest' },
          { name: 'emptyText', type: 'ReactNode', def: '"No matches"', desc: 'Shown when nothing matches' },
          { name: 'name', type: 'string', desc: 'Sends the value with a form' },
          r.label, r.description, r.error, r.required, r.size, r.disabled,
        ],
      },
    ],
    when: ['Select: up to about 15 options people can scan, such as a technician or a status', 'Combo Box: long lists people search by name, such as customers, products or addresses'],
    whenNot: ['Two to five options always visible: use a Segmented Control', 'Picking several: use checkboxes', 'Thousands of records: load matches from your server as people type and pass them in as options'],
    keyboard: [
      ['Type', 'Combo Box: filters the list'],
      ['Arrow Down / Up', 'Opens the list, then moves through it'],
      ['Enter', 'Picks the highlighted option'],
      ['Escape', 'Closes the list and puts back the chosen value'],
      ['Tab', 'Leaves the field without changing the choice'],
    ],
    builtIn: [
      'Select is the browser’s own dropdown, styled to match. On phones that means the native picker wheel or sheet, which is faster and easier than any custom menu.',
      'Combo Box follows the official accessibility pattern for search-as-you-type lists, so screen readers announce the highlighted option and how many match.',
      'Search ignores accents and case: "jose" finds "José Martín", and a phone number in keywords finds the customer.',
      'Names that start with what you typed come first.',
      'Clearing the text and leaving the field clears the choice. Pressing Escape puts back what was there.',
      'Long lists show the first 50 matches and say how many more there are, so the page never freezes.',
      'The list opens upwards when the field is near the bottom of the screen.',
      'Escape inside the field does not also close a dialog around it.',
      zoom,
      kit,
    ],
  },
  {
    slug: 'switch-and-checkbox',
    name: 'Switch + Checkbox',
    group: G,
    description: 'Switch turns one setting on or off straight away. Checkbox ticks to agree or to pick several, with an in-between state.',
    install: ['switch', 'checkbox'],
    sources: [{ file: 'switch.tsx', code: switchSrc }, { file: 'checkbox.tsx', code: checkboxSrc }],
    Demo: SwitchDemo,
    Thumb: SwitchThumb,
    usage: `import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

<Switch label="Send reminder" description="Texts the customer the day before." checked={remind} onChange={(e) => setRemind(e.target.checked)} />
<Checkbox label="Bill travel time" name="travel" defaultChecked />`,
    examples: [
      { title: 'A settings list, switches on the right', code: `<Switch placement="end" label="Quote follow-ups" description="An email after 3 days." />` },
      { title: '"Select all" with some selected', code: `<Checkbox label="Bill all lines" checked={all} indeterminate={some && !all} onChange={toggleAll} />` },
      { title: 'Must be ticked', code: `<Checkbox label="I accept the terms" required error={tried && !accepted && "Accept the terms to continue."} />` },
    ],
    props: [
      {
        component: 'Switch',
        rows: [
          r.label,
          { name: 'description', type: 'ReactNode', desc: 'What turning it on does' },
          r.error,
          { name: 'placement', type: '"start" | "end"', def: '"start"', desc: 'Switch before the label, or at the far end of the row as in settings lists' },
          { name: '...props', type: 'input attributes', desc: 'checked, defaultChecked, onChange, name, disabled, ref' },
        ],
      },
      {
        component: 'Checkbox',
        rows: [
          r.label, r.description, r.error, r.required,
          { name: 'indeterminate', type: 'boolean', def: 'false', desc: 'The in-between state, for a "select all" box when only some are selected' },
          { name: 'placement', type: '"start" | "end"', def: '"start"', desc: 'Box before the label, or at the far end of the row' },
          { name: '...props', type: 'input attributes', desc: 'checked, defaultChecked, onChange, name, value, disabled, ref' },
        ],
      },
    ],
    when: ['Switch: a setting that applies at once, such as notifications', 'Checkbox: agreeing to something, or picking several items from a list'],
    whenNot: ['Switch inside a form that only saves on Submit: use a Checkbox, which does not suggest an instant change', 'Choosing one of several: use a Segmented Control or Select'],
    keyboard: [['Tab', 'Moves to the control'], ['Space', 'Turns it on or off']],
    builtIn: [
      'Both are real checkboxes underneath, so they work with forms, the keyboard and screen readers without extra code.',
      'Switch tells screen readers it is a switch, so they say "on" and "off" rather than "checked".',
      'The whole row, label included, is the tap target, at least 44px high on touch screens.',
      'The description is read as a description, not as part of the label, so the name stays short.',
      'The in-between state is the browser’s own, so screen readers announce "mixed".',
      'The thumb slides and the tick appears with a short motion, which stops for people who ask for less motion.',
      kit,
    ],
  },
  {
    slug: 'date-and-time-picker',
    name: 'Date + Time Picker',
    group: G,
    description: 'A day, a time, or both, using the browser’s own pickers styled to match. Values are ISO strings.',
    install: ['date-picker'],
    sources: [{ file: 'date-picker.tsx', code: dateSrc }],
    Demo: DateDemo,
    Thumb: DateThumb,
    usage: `import { DatePicker } from "@/components/ui/date-picker";

<DatePicker label="Visit date" min={today} value={date} onChange={setDate} />
<DatePicker label="Arrive at" kind="time" step={900} value={time} onChange={setTime} />`,
    examples: [
      { title: 'Date and time in one', code: `<DatePicker label="Follow-up call" kind="datetime" value={when} onChange={setWhen} />` },
      { title: 'No dates in the past', code: `<DatePicker label="Visit date" min={new Date().toISOString().slice(0, 10)} />` },
    ],
    props: [{
      component: 'DatePicker',
      rows: [
        { name: 'kind', type: '"date" | "time" | "datetime"', def: '"date"', desc: 'What to pick' },
        { name: 'value', type: 'string', desc: '2026-12-04, 09:30 or 2026-12-04T09:30. "" when empty' },
        { name: 'onChange', type: '(value, event) => void', desc: 'Called with the new ISO string' },
        { name: 'min / max', type: 'string', desc: 'Earliest and latest allowed, in the same shape as value' },
        { name: 'step', type: 'number', desc: 'For times, seconds between choices: 900 is every 15 minutes' },
        r.label, r.description, r.error, r.required, r.size,
      ],
    }],
    when: ['Booking a visit, setting a due date, logging when something happened'],
    whenNot: ['Seeing many dates at once, such as a schedule: use Month Grid', 'Rough dates people type, such as a year of birth: use a Text Field or Number Input'],
    keyboard: [['Arrow Up / Down', 'Change the highlighted part of the date or time'], ['Arrow Left / Right or Tab', 'Move between day, month and year'], ['Space or Enter', 'Open the calendar, where the browser offers one']],
    builtIn: [
      'It uses the phone’s own date wheel or calendar, which people already know and which is easier to use than any custom calendar.',
      'Dates show in the person’s own order and language: 04/12/2026 in Sydney, 12/04/2026 in New York. Your code always gets 2026-12-04.',
      'The picker turns dark in dark mode on its own, because the theme tells the browser which scheme is in use.',
      'min and max stop people picking a date in the past or too far ahead.',
      'A date and time has no time zone attached: it is the person’s local time. Convert it on your server with their time zone.',
      zoom,
      kit,
    ],
  },
  {
    slug: 'text-field',
    name: 'Text Field',
    group: G,
    description: 'A single line of text with its label, help and error, and an optional prefix or suffix such as "$", "kg" or an icon.',
    install: ['text-field'],
    sources: [{ file: 'text-field.tsx', code: textFieldSrc }],
    Demo: TextFieldDemo,
    Thumb: FieldThumb,
    usage: `import { TextField } from "@/components/ui/text-field";

<TextField label="Billing email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />`,
    examples: [
      { title: 'With a unit', code: `<TextField label="Pump weight" suffix="kg" inputMode="decimal" />` },
      { title: 'A search box with no visible label', code: `<TextField label="Search" hideLabel type="search" prefix={<SearchIcon />} placeholder="Search cases" />` },
    ],
    props: [{
      component: 'TextField',
      rows: [
        r.label, r.description, r.error, r.required, r.hideLabel,
        { name: 'prefix', type: 'ReactNode', desc: 'Text or an icon before the value, e.g. "$"' },
        { name: 'suffix', type: 'ReactNode', desc: 'Text or an icon after the value, e.g. "kg"' },
        r.size,
        { name: '...props', type: 'input attributes', desc: 'type, value, onChange, autoComplete, inputMode, placeholder, ref and the rest' },
      ],
    }],
    when: ['Names, emails, phone numbers, references: anything on one line'],
    whenNot: ['Several lines: use a Text Area', 'Numbers people step through or that have limits: use a Number Input', 'Picking from a known list: use a Select or Combo Box'],
    builtIn: [
      zoom,
      labelled,
      errors,
      'A text prefix or suffix such as "kg" is read out with the field, so screen reader users know the unit too.',
      'Clicking the prefix or suffix focuses the field, so the whole box is the target.',
      'Every native attribute passes through. Set type="email" and autoComplete="email" and phones show the @ key and offer the saved address.',
      kit,
    ],
  },
  {
    slug: 'text-area',
    name: 'Text Area',
    group: G,
    description: 'Several lines of text. It grows with what is typed, then scrolls, and can count characters as a limit gets close.',
    install: ['text-area'],
    sources: [{ file: 'text-area.tsx', code: textAreaSrc }],
    Demo: TextAreaDemo,
    Thumb: () => (
      <div style={col(260)}>
        <TextArea label="Notes" minRows={2} maxLength={140} showCount defaultValue="Side gate code 4821." />
      </div>
    ),
    usage: `import { TextArea } from "@/components/ui/text-area";

<TextArea label="Notes for the technician" maxLength={280} showCount value={notes} onChange={(e) => setNotes(e.target.value)} />`,
    examples: [
      { title: 'Short to start, room to grow', code: `<TextArea label="Service report" minRows={2} maxRows={12} />` },
    ],
    props: [{
      component: 'TextArea',
      rows: [
        r.label, r.description, r.error, r.required, r.hideLabel,
        { name: 'minRows', type: 'number', def: '3', desc: 'Height when empty, in rows' },
        { name: 'maxRows', type: 'number', def: '10', desc: 'It grows up to this many rows, then scrolls' },
        { name: 'showCount', type: 'boolean', def: 'false', desc: 'Shows "120 / 280" under the box. Needs maxLength' },
        { name: '...props', type: 'textarea attributes', desc: 'value, onChange, maxLength, placeholder, name, ref and the rest' },
      ],
    }],
    when: ['Notes, descriptions, messages: anything that may run to several lines'],
    whenNot: ['A single line such as a name: use a Text Field', 'Formatted text with bold and lists: use a rich text editor'],
    builtIn: [
      'It grows as people type, so they can see everything they wrote without a scrollbar, up to a sensible height.',
      'The count turns amber close to the limit and red at it. Screen readers hear how many characters are left only once that matters, not on every key.',
      'Screen readers are told the limit up front, so nobody types a paragraph that gets cut off.',
      zoom,
      labelled,
      kit,
    ],
  },
  {
    slug: 'number-input',
    name: 'Number Input',
    group: G,
    description: 'A number with − and + buttons, limits and a step, an optional currency or unit, and the number pad on phones. The value is a number or null.',
    install: ['number-input'],
    sources: [{ file: 'number-input.tsx', code: numberSrc }],
    Demo: NumberDemo,
    Thumb: () => (
      <div style={col(220)}>
        <NumberInput label="Unit price" prefix="$" defaultValue={86.5} format={{ minimumFractionDigits: 2 }} />
      </div>
    ),
    usage: `import { NumberInput } from "@/components/ui/number-input";

const [qty, setQty] = useState<number | null>(1);
<NumberInput label="Quantity" min={1} max={99} value={qty} onChange={setQty} />`,
    examples: [
      { title: 'Money', code: `<NumberInput label="Unit price" prefix="$" min={0} step={0.5} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} value={price} onChange={setPrice} />` },
      { title: 'A reading with a unit and no steppers', code: `<NumberInput label="Chlorine" suffix="ppm" step={0.1} steppers={false} />` },
    ],
    props: [{
      component: 'NumberInput',
      rows: [
        { name: 'value', type: 'number | null', desc: 'The number, or null when empty' },
        { name: 'onChange', type: '(value: number | null) => void', desc: 'Called as people type and step' },
        { name: 'min / max', type: 'number', desc: 'Limits. A number outside them is brought back inside when the field is left' },
        { name: 'step', type: 'number', def: '1', desc: 'What the arrows and buttons add. Page Up and Page Down add ten times this' },
        { name: 'format', type: 'Intl.NumberFormatOptions', desc: 'How the number shows when not being edited, e.g. two decimals for money' },
        { name: 'prefix / suffix', type: 'ReactNode', desc: 'A currency or unit, e.g. "$" or "kg"' },
        { name: 'steppers', type: 'boolean', def: 'true', desc: 'Show the − and + buttons' },
        r.label, r.description, r.error, r.required, r.size,
      ],
    }],
    when: ['Quantities, prices, measurements, percentages'],
    whenNot: ['Numbers that are really labels, such as phone numbers, postcodes or invoice numbers: use a Text Field with inputMode="numeric"'],
    keyboard: [['Arrow Up / Down', 'Add or take away one step'], ['Page Up / Down', 'Ten steps'], ['Home / End', 'Jump to the minimum or maximum, if set'], ['Enter', 'Tidy the number and keep editing']],
    builtIn: [
      'It is a text field with the number pad, not type="number", which changes the value when someone scrolls the page over it and rejects commas in many countries.',
      'People can type numbers their own way: 1,250.50 in Australia, 1.250,50 in Germany. Your code gets 1250.5.',
      'A number outside the limits is brought back inside when the field is left, instead of being saved wrong.',
      'Holding + or − keeps counting. Tapping them on a phone does not pop up the keyboard.',
      'Steps add up exactly: 0.1 + 0.2 shows 0.3, not 0.30000000000000004.',
      'Screen readers hear it as a spin button with its value, limits and unit.',
      zoom,
      kit,
    ],
  },
  {
    slug: 'pin-input',
    name: 'PIN Input',
    group: G,
    description: 'A short code with one box per digit. Phones offer the code from a text message, pasting fills every box, and onComplete fires when it is full.',
    install: ['pin-input'],
    sources: [{ file: 'pin-input.tsx', code: pinSrc }],
    Demo: PinDemo,
    Thumb: () => <PinInput aria-label="Code" length={6} defaultValue="2468" />,
    usage: `import { PinInput } from "@/components/ui/pin-input";

<PinInput
  label="Enter the code we sent you"
  onComplete={(code) => verify(code)}
  error={wrong && "That code is not right."}
/>`,
    examples: [
      { title: 'A staff PIN, hidden as it is typed', code: `<PinInput label="Staff PIN" length={4} mask onComplete={signIn} />` },
      { title: 'Sent with a form', code: `<PinInput label="Code" name="code" />` },
    ],
    props: [{
      component: 'PinInput',
      rows: [
        { name: 'length', type: '4 | 5 | 6', def: '6', desc: 'How many digits' },
        { name: 'value', type: 'string', desc: 'The digits so far, when you control it' },
        { name: 'onChange', type: '(code: string) => void', desc: 'Called on every change' },
        { name: 'onComplete', type: '(code: string) => void', desc: 'Called once every box is filled' },
        { name: 'mask', type: 'boolean', def: 'false', desc: 'Dots instead of digits, for a PIN someone chose' },
        { name: 'name', type: 'string', desc: 'Sends the code with a form' },
        r.label, r.description, r.error, r.disabled,
      ],
    }],
    when: ['A one-time code sent by text or email', 'A short PIN for quick sign-in on a shared device'],
    whenNot: ['Passwords: use a Text Field with type="password"', 'Codes with letters: use a Text Field'],
    keyboard: [['Type a digit', 'Fills the box and moves on'], ['Backspace', 'Clears the box, or moves back and clears the one before'], ['Arrow Left / Right', 'Move between boxes'], ['Paste', 'Fills every box from the start']],
    builtIn: [
      'Phones offer the code from the text message above the keyboard, so people can fill it with one tap.',
      'Phones show the number pad, not the full keyboard.',
      'Pasting a whole code fills every box, even if it has spaces or a dash in it.',
      'Clicking a later box moves to the first empty one, so a code can never have a gap.',
      'Each box is named "Digit 2 of 6" for screen readers, and the group is named by the label.',
      'onComplete fires once the last digit is in, so the code can be checked without a button.',
      touch,
      kit,
    ],
  },
];
