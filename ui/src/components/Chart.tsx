import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './Chart.css';

// ── One chart component for the whole console ────────────────────────────────
//
// Recharts under a shadcn-ish skin in our own palette: dashed horizontal grid,
// rounded bar ends, a hover card instead of the default tooltip, and a legend
// whose chips double as show/hide switches.
//
// It is ONE component with a `kind` rather than eight exported charts, because
// the thing that has to stay consistent across an analytics page is not the
// code — it is the axis type scale, the tooltip, the grid, the label weight and
// the animation. Eight components would each be free to drift on all five, and
// the Live/Funnel screens already show how quickly two near-copies of a visual
// diverge. A caller picks a kind and passes data; it does not get to restyle.
//
// Colours come from the CSS custom properties in @ascentui/tokens via
// `chartColor()`, so a token change moves the charts with the rest of the app.
// Recharts needs real colour strings (it interpolates them for animation), so
// they are read once from the computed root style rather than passed as var().

export type ChartKind =
  | 'bars' // grouped or stacked vertical columns over a category axis
  | 'lines' // the same data as lines with point markers
  | 'hbar' // horizontal bars, one row per category
  | 'waterfall' // horizontal floating bars (a bridge)
  | 'share' // a single 100% stacked bar with a legend
  | 'pie' // donut with centre total
  | 'spark' // tile sparkline, no axes
  | 'meter'; // a one-row progress bar for a table cell

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface ChartRefLine {
  /** Value on the measure axis. */
  at: number;
  label: string;
  color?: string;
}

export interface ChartDatum {
  /** Category label (x axis for bars/lines, y axis for hbar). */
  label?: string;
  name?: string;
  /** Per-row colour override — the `colorKey` opt-in below reads it. */
  color?: string;
  /** Text drawn at the end of a horizontal bar. */
  labelText?: string;
  /** Replaces the computed tooltip value when the row wants to say more. */
  tip?: string;
  [key: string]: string | number | undefined | [number, number];
}

export interface ChartProps {
  kind: ChartKind;
  data: ChartDatum[];
  series?: ChartSeries[];
  height?: number;
  /** Formats the measure axis, the tooltip and any value labels. */
  format?: (v: number) => string;
  stacked?: boolean;
  /** Stack to 100% instead of to the total. */
  percent?: boolean;
  /** Let bars cross a zero baseline (a diverging chart). */
  signed?: boolean;
  /** Draw the value above each column. Only when a single series is shown. */
  barLabels?: boolean;
  /** Label the last point of each line — the "where did it end up" reading. */
  endLabels?: boolean;
  refLines?: ChartRefLine[];
  /** Take each bar's fill from this key on its row rather than from the series. */
  colorKey?: string;
  /** Width reserved for hbar category labels, and for the value labels' gutter. */
  labelWidth?: number;
  labelSpace?: number;
  /** pie only. */
  centerValue?: string;
  centerLabel?: string;
  /** meter only: 0–100. */
  value?: number;
  color?: string;
  /** Sparkline / meter series key. */
  dataKey?: string;
  showLegend?: boolean;
  hideable?: boolean;
  /** Accessible description; also the empty-state text when there is no data. */
  emptyLabel?: string;
}

const MONO = "'Geist Mono', ui-monospace, monospace";

/** Read a design token as a real colour. Recharts animates between colour
 *  strings, so it cannot be handed `var(--accent)`. Cached per token: this is
 *  called once per series per render and getComputedStyle is not cheap. */
const tokenCache = new Map<string, string>();
export function chartColor(token: string, fallback: string): string {
  const hit = tokenCache.get(token);
  if (hit) return hit;
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const out = v || fallback;
  tokenCache.set(token, out);
  return out;
}

/** The categorical ramp, in the order a chart should use it. Chosen for
 *  distinguishability rather than prettiness, and reused everywhere a series
 *  needs a colour so the same channel is the same colour on every screen. */
export const CHART_COLORS = [
  '#0f9d8a',
  '#3a6ea5',
  '#b5563a',
  '#5a47b0',
  '#9a6a07',
  '#2f7d4f',
  '#c2255c',
  '#7a7a74',
];

const defaultFormat = (v: number) =>
  Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-AU') : String(Number(v.toFixed(1)));

type TipProps = {
  active?: boolean;
  payload?: { value: number | [number, number]; name?: string; color?: string; payload?: ChartDatum }[];
  label?: string | number;
  format: (v: number) => string;
  hideLabel?: boolean;
};

/** The hover card. One row per visible series, colour chip, value in mono so
 *  the digits line up between rows. */
function TipCard({ active, payload, label, format, hideLabel }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ch-tip">
      {!hideLabel && label != null && label !== '' && <div className="ch-tip-h">{label}</div>}
      {payload.map((p, i) => {
        const raw = p.value;
        const v = Array.isArray(raw) ? raw[1] - raw[0] : raw;
        return (
          <div className="ch-tip-r" key={i}>
            <span className="ch-tip-n">
              <span className="ch-sw" style={{ background: p.color ?? p.payload?.color ?? 'var(--dim)' }} />
              {p.name}
            </span>
            <b>{p.payload?.tip ?? format(v)}</b>
          </div>
        );
      })}
    </div>
  );
}

function ChartLegend({
  series,
  hidden,
  onToggle,
  hideable,
}: {
  series: ChartSeries[];
  hidden: string[];
  onToggle: (k: string) => void;
  hideable: boolean;
}) {
  return (
    <div className="ch-legend">
      {series.map((s) => {
        const off = hidden.includes(s.key);
        return (
          <button
            key={s.key}
            className={`ch-lg${off ? ' off' : ''}`}
            onClick={hideable ? () => onToggle(s.key) : undefined}
            // A legend that isn't a control shouldn't answer to a keyboard or
            // announce itself as one.
            {...(hideable ? { title: 'Click to show or hide' } : { tabIndex: -1, 'aria-hidden': true })}
          >
            <span className="ch-sw" style={{ background: off ? 'var(--surface3-hi)' : s.color }} />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chart(props: ChartProps) {
  const {
    kind,
    data,
    height = 350,
    format = defaultFormat,
    stacked = false,
    percent = false,
    signed = false,
    barLabels = false,
    endLabels = false,
    refLines = [],
    colorKey,
    labelWidth = 150,
    labelSpace = 70,
    centerValue,
    centerLabel,
    value = 0,
    color,
    dataKey = 'v',
    hideable = true,
    emptyLabel = 'No data in this window.',
  } = props;

  const allSeries = useMemo(() => props.series ?? [], [props.series]);
  const [hidden, setHidden] = useState<string[]>([]);
  const shown = allSeries.filter((s) => !hidden.includes(s.key));
  const showLegend = (props.showLegend ?? true) && allSeries.length > 1;
  const toggle = (k: string) =>
    setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));

  const accent = chartColor('--accent', '#0f9d8a');
  const grid = 'rgba(0,0,0,.09)';
  const muted = chartColor('--dim', '#9b9b96');
  const ink = chartColor('--text', '#1b1b1a');
  const axisTick = { fontSize: 10.5, fill: muted, fontFamily: MONO };
  const cursor = { fill: 'rgba(0,0,0,.035)' };

  // An empty chart says so rather than drawing empty axes, which read as a
  // broken chart rather than as an honest "nothing here yet".
  if (!data.length) return <div className="ch-empty" style={{ height }}>{emptyLabel}</div>;

  if (kind === 'spark') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color ?? accent}
            strokeWidth={2}
            dot={false}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'meter') {
    const v = Math.max(0, Math.min(100, value));
    return (
      <ResponsiveContainer width="100%" height={10}>
        <BarChart layout="vertical" data={[{ name: '', v }]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barCategoryGap={0}>
          <XAxis type="number" hide domain={[0, 100]} />
          <YAxis type="category" dataKey="name" hide />
          <Bar
            dataKey="v"
            fill={color ?? accent}
            radius={4}
            background={{ fill: '#e9e7df', radius: 4 } as never}
            barSize={8}
            animationDuration={600}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kind === 'pie') {
    const total = data.reduce((a, d) => a + Number(d.value ?? 0), 0);
    return (
      <div className="ch-pie" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="86%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              labelLine={false}
              animationDuration={700}
              // A slice under 6% has no room for a legible percentage inside
              // it; the legend beside the ring carries those.
              label={(p: { value?: number; percent?: number; x?: number; y?: number }) =>
                (p.percent ?? 0) < 0.06 ? null : `${Math.round((p.percent ?? 0) * 100)}%`
              }
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length] ?? '#0f9d8a'} />
              ))}
            </Pie>
            <Tooltip
              content={
                <TipCard
                  format={(v) => `${format(v)} · ${total ? Math.round((v / total) * 100) : 0}%`}
                  hideLabel
                />
              }
            />
          </PieChart>
        </ResponsiveContainer>
        {centerValue != null && (
          <div className="ch-pie-c">
            <div className="ch-pie-v">{centerValue}</div>
            {centerLabel && <div className="ch-pie-l">{centerLabel}</div>}
          </div>
        )}
      </div>
    );
  }

  if (kind === 'hbar' || kind === 'waterfall' || kind === 'share') {
    // A share bar is one row whatever the data; the other two grow a row per
    // category, so the SVG is sized from the data instead of squeezing rows
    // into a fixed height (which is how bars end up overlapping their labels).
    const rowH = allSeries.length > 1 ? 46 + 26 * (allSeries.length - 1) : 46;
    const h = kind === 'share' ? 54 : Math.max(height, data.length * rowH + 20);
    const shareRow = kind === 'share' ? [Object.assign({ name: '' }, ...data.map((d) => ({ [String(d.name)]: d.value }))) as ChartDatum] : data;

    const chart = (
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          layout="vertical"
          data={shareRow}
          // A reference line labels itself above the plot, so it needs
          // headroom that a plain bar chart does not.
          margin={{ top: refLines.length ? 20 : 4, right: kind === 'share' ? 0 : labelSpace, bottom: 4, left: 0 }}
          barCategoryGap={kind === 'share' ? 0 : '18%'}
          barGap={3}
          stackOffset={kind === 'share' ? 'expand' : 'none'}
        >
          {kind !== 'share' && <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={grid} />}
          <XAxis
            type="number"
            hide={kind === 'share'}
            tickLine={false}
            axisLine={false}
            tick={axisTick}
            tickFormatter={format}
            domain={kind === 'waterfall' ? [0, 'dataMax'] : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            hide={kind === 'share'}
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12.5, fill: ink, fontWeight: 700 }}
            interval={0}
          />
          <Tooltip cursor={cursor} content={<TipCard format={format} hideLabel={kind === 'share'} />} />
          {kind !== 'share' &&
            refLines.map((r, i) => (
              <ReferenceLine
                key={i}
                x={r.at}
                stroke={r.color ?? 'var(--warn)'}
                strokeDasharray="5 4"
                strokeWidth={1.4}
                ifOverflow="extendDomain"
                label={{ value: r.label, position: 'top', fontSize: 10.5, fontWeight: 700, fill: r.color ?? '#9a6a07' }}
              />
            ))}
          {kind === 'share'
            ? data.map((d, i) => (
                <Bar
                  key={String(d.name)}
                  dataKey={String(d.name)}
                  name={String(d.name)}
                  stackId="a"
                  fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length] ?? '#0f9d8a'}
                  animationDuration={700}
                  radius={i === 0 ? [6, 0, 0, 6] : i === data.length - 1 ? [0, 6, 6, 0] : 0}
                />
              ))
            : allSeries.length
              ? shown.map((s, i) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.label}
                    fill={s.color}
                    radius={[0, 4, 4, 0]}
                    // The track behind the first series shows the full width,
                    // so each bar reads as a share of its row.
                    background={i === 0 ? ({ fill: 'rgba(0,0,0,.035)', radius: 4 } as never) : false}
                    animationDuration={700}
                    minPointSize={2}
                    maxBarSize={26}
                  />
                ))
              : (
                  <Bar
                    dataKey={kind === 'waterfall' ? 'range' : 'value'}
                    name="Value"
                    radius={kind === 'waterfall' ? 4 : [0, 4, 4, 0]}
                    // A waterfall bar's POSITION carries its meaning, so a
                    // full-width track behind it would read as a second value.
                    background={kind === 'waterfall' ? false : ({ fill: 'rgba(0,0,0,.035)', radius: 4 } as never)}
                    animationDuration={700}
                    minPointSize={2}
                    maxBarSize={34}
                  >
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color ?? color ?? accent} />
                    ))}
                    {/* Rendered by hand rather than by LabelList's own text
                        layout: given a short bar it decides the label must wrap
                        and splits it into tspans, so "38 · 9%" came out over two
                        lines. A single <text> cannot wrap. */}
                    <LabelList
                      dataKey="labelText"
                      content={(p) => {
                        const { x, y, width, height, value } = p as {
                          x?: number; y?: number; width?: number; height?: number; value?: string;
                        };
                        if (value == null) return null;
                        return (
                          <text
                            className="ch-vlabel"
                            x={(x ?? 0) + (width ?? 0) + 8}
                            y={(y ?? 0) + (height ?? 0) / 2}
                            dominantBaseline="central"
                          >
                            {value}
                          </text>
                        );
                      }}
                    />
                  </Bar>
                )}
        </BarChart>
      </ResponsiveContainer>
    );

    if (kind === 'share') {
      return (
        <div>
          {chart}
          <ChartLegend
            series={data.map((d, i) => ({
              key: String(d.name),
              label: String(d.name),
              color: d.color ?? CHART_COLORS[i % CHART_COLORS.length] ?? '#0f9d8a',
            }))}
            hidden={[]}
            onToggle={() => {}}
            hideable={false}
          />
        </div>
      );
    }
    return allSeries.length > 1 && showLegend ? (
      <div>
        {chart}
        <ChartLegend series={allSeries} hidden={hidden} onToggle={toggle} hideable={hideable} />
      </div>
    ) : (
      chart
    );
  }

  // bars / lines over a category axis
  const isLines = kind === 'lines';
  const Cartesian = isLines ? LineChart : BarChart;
  const chart = (
    <ResponsiveContainer width="100%" height={height}>
      <Cartesian
        data={data}
        margin={{ top: 18, right: 8, bottom: 0, left: -8 }}
        stackOffset={percent ? 'expand' : signed ? 'sign' : 'none'}
        barCategoryGap="22%"
        barGap={3}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: muted }} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          tickFormatter={percent ? (v: number) => `${Math.round(v * 100)}%` : format}
          width={56}
        />
        <Tooltip cursor={isLines ? { stroke: grid } : cursor} content={<TipCard format={format} />} />
        {signed && <ReferenceLine y={0} stroke="rgba(0,0,0,.45)" />}
        {shown.map((s, i) =>
          isLines ? (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.4}
              dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 5 }}
              animationDuration={700}
            >
              {endLabels && (
                <LabelList
                  dataKey={s.key}
                  content={(p) => {
                    const { index, x, y, value } = p as { index?: number; x?: number; y?: number; value?: number };
                    if (index !== data.length - 1 || value == null) return null;
                    return (
                      <text x={x} y={(y ?? 0) - 9} textAnchor="end" fill={s.color} fontSize={11} fontWeight={800}>
                        {format(value)}
                      </text>
                    );
                  }}
                />
              )}
            </Line>
          ) : (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId={stacked ? 'a' : undefined}
              fill={s.color}
              radius={stacked ? (i === shown.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
              animationDuration={700}
              maxBarSize={56}
            >
              {colorKey && data.map((d, j) => <Cell key={j} fill={String(d[colorKey] ?? s.color)} />)}
              {/* A value over every column only reads when there is one series;
                  with two they collide, and the hover card already answers. */}
              {barLabels && shown.length === 1 && (
                <LabelList dataKey={s.key} position="top" formatter={format} className="ch-blabel" />
              )}
            </Bar>
          ),
        )}
        {refLines.map((r, i) => (
          <ReferenceLine
            key={i}
            y={r.at}
            stroke={r.color ?? '#9a6a07'}
            strokeDasharray="6 4"
            strokeWidth={1.6}
            ifOverflow="extendDomain"
            // In front, or a column drawn after it hides the line the reader
            // is meant to compare the columns against.
            isFront
            label={{ value: r.label, position: 'right', fontSize: 10.5, fontWeight: 700, fill: r.color ?? '#9a6a07', offset: 4 }}
          />
        ))}
      </Cartesian>
    </ResponsiveContainer>
  );

  return (
    <div>
      {chart}
      {showLegend && <ChartLegend series={allSeries} hidden={hidden} onToggle={toggle} hideable={hideable} />}
    </div>
  );
}
