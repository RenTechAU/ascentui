"use client";
/**
 * Chart: bars, lines, areas, a pie or donut, a sparkline and a meter, from one component, so every
 * chart in an app shares one look: the same grid, axis text, tooltip and legend.
 * Series colours come from the theme's --asc-hue-* colours; numbers are formatted for the reader's
 * locale. Every chart carries its data as a table for screen readers, so it is never only a picture.
 * Built on recharts (an optional peer dependency: `npm i recharts`). Reads the shared theme (@ascentui/tokens).
 */
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement, type ReactNode, type RefObject } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@ascentui/ui/components/empty-state";

const css = `@layer asc {
.asc-chart{position:relative;min-width:0;color:var(--asc-ink);font:400 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);font-variant-numeric:tabular-nums}
.asc-chart__plot{position:relative;width:100%}
.asc-chart .recharts-wrapper{z-index:1}
.asc-chart .recharts-text{fill:var(--asc-muted);font-size:var(--asc-text-xs)}
.asc-chart .recharts-cartesian-grid line{stroke:var(--asc-border-strong);stroke-dasharray:3 3}
.asc-chart .recharts-reference-line line{stroke:var(--asc-faint);stroke-dasharray:5 4}
.asc-chart .recharts-reference-line .recharts-text{fill:var(--asc-muted);font-weight:500}
.asc-chart .recharts-tooltip-cursor{fill:var(--asc-subtle-strong);stroke:var(--asc-border-strong)}
.asc-chart .recharts-active-dot circle,.asc-chart .recharts-line-dot{stroke:var(--asc-surface)}
.asc-chart .recharts-pie-sector path{stroke:var(--asc-surface);stroke-width:2px}
.asc-chart .recharts-surface:focus,.asc-chart .recharts-wrapper:focus,.asc-chart .recharts-sector:focus{outline:none}
.asc-chart__tip{box-sizing:border-box;min-width:140px;padding:var(--asc-space-8);border-radius:var(--asc-radius);background:var(--asc-surface);color:var(--asc-ink);box-shadow:var(--asc-shadow-pop);font:400 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);font-variant-numeric:tabular-nums}
.asc-chart__tip-h{margin:0 0 var(--asc-space-4);font-weight:500}
.asc-chart__tip-r{display:flex;align-items:center;justify-content:space-between;gap:var(--asc-space-12)}
.asc-chart__tip-n{display:inline-flex;align-items:center;gap:var(--asc-space-6);color:var(--asc-muted)}
.asc-chart__tip-v{font-weight:500}
.asc-chart__sw{display:inline-block;flex:none;width:8px;height:8px;border-radius:2px;background:var(--c)}
.asc-chart__legend{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--asc-space-4) var(--asc-space-12);margin:var(--asc-space-8) 0 0;padding:0;list-style:none}
.asc-chart__lg{display:inline-flex;align-items:center;gap:var(--asc-space-6);min-height:var(--asc-control-sm);padding:0 var(--asc-space-4);border:0;border-radius:var(--asc-radius-sm);background:none;color:var(--asc-muted);font:500 var(--asc-text-xs)/var(--asc-leading-xs) var(--asc-font);font-variant-numeric:tabular-nums;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color var(--asc-duration),background-color var(--asc-duration)}
span.asc-chart__lg{cursor:default}
button.asc-chart__lg:hover{background:var(--asc-subtle-strong);color:var(--asc-ink)}
.asc-chart__lg:focus-visible{outline:2px solid var(--asc-focus);outline-offset:2px}
.asc-chart__lg[aria-pressed="false"]{color:var(--asc-faint);text-decoration:line-through}
.asc-chart__lg[aria-pressed="false"] .asc-chart__sw{background:var(--asc-subtle-strong)}
.asc-chart__lg-v{color:var(--asc-ink)}
.asc-chart__center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;text-align:center}
.asc-chart__center-v{font:500 var(--asc-text-xl)/var(--asc-leading-xl) var(--asc-font);letter-spacing:-.02em}
.asc-chart__center-l{color:var(--asc-muted)}
.asc-chart__empty{display:grid;place-items:center;border-radius:var(--asc-radius);background:var(--asc-subtle)}
.asc-chart__alt{position:absolute;top:0;left:0;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.asc-meter{position:relative;display:block;width:100%;min-width:40px;height:6px;border-radius:var(--asc-radius-full);background:var(--asc-subtle-strong);overflow:hidden}
.asc-meter[data-size="md"]{height:8px}
.asc-meter__fill{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:var(--asc-primary);transform-origin:left;transition:width var(--asc-duration-slow) var(--asc-ease)}
.asc-meter[data-tone="success"] .asc-meter__fill{background:var(--asc-success)}
.asc-meter[data-tone="warning"] .asc-meter__fill{background:var(--asc-warning)}
.asc-meter[data-tone="danger"] .asc-meter__fill{background:var(--asc-danger)}
}`;

export type ChartKind = "bar" | "line" | "area" | "pie" | "donut" | "spark" | "meter";
/** The theme's chart colours, in the order series use them */
export type ChartHue = "blue" | "green" | "amber" | "purple" | "red";
export const CHART_HUES: ChartHue[] = ["blue", "green", "amber", "purple", "red"];

export type ChartSeries = {
  /** The field on each row that holds this series' numbers */
  key: string;
  /** Its name in the legend, tooltip and data table */
  label: string;
  /** A theme hue, or any CSS colour. Defaults to the next hue in CHART_HUES */
  color?: ChartHue | (string & {});
};

/** One row: the category under xKey ("label" by default), then a number per series */
export type ChartDatum = Record<string, string | number | null | undefined>;

export type ChartReference = { value: number; label: string };

export type ChartProps = {
  kind: ChartKind;
  /** What the chart shows, e.g. "Cases closed per week". Read out by screen readers and the caption of their data table */
  label: string;
  /** Rows. For pie and donut, one row per slice: { label, value, color? } */
  data?: ChartDatum[];
  /** The numbers to draw, for bar, line and area. Pie, donut and spark read series[0], or "value" */
  series?: ChartSeries[];
  /** The field that names each row. Default "label" */
  xKey?: string;
  /** What the rows are, for the data table heading, e.g. "Week" */
  xLabel?: string;
  /** Plot height in px. Default 240; 40 for spark */
  height?: number;
  /** How numbers read: Intl options such as { style: "currency", currency: "USD" }, or a function */
  format?: Intl.NumberFormatOptions | ((value: number) => string);
  /** Bars, lines and areas: stack the series */
  stacked?: boolean;
  /** Stack to 100%, to compare shares */
  percent?: boolean;
  /** Bars run sideways, one row per category. Good for long names */
  horizontal?: boolean;
  /** Dashed lines across the plot, such as a target */
  references?: ChartReference[];
  /** Show the legend. On by default with more than one series, and for pie and donut */
  legend?: boolean;
  /** Legend entries show and hide their series. Default true */
  hideable?: boolean;
  /** Donut: the big number in the middle, and its label */
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  /** Meter: the value, out of max */
  value?: number;
  max?: number;
  /** Meter: colour only when it means something, e.g. danger when a budget is nearly spent */
  tone?: "neutral" | "success" | "warning" | "danger";
  /** Shown instead of empty axes when there is no data */
  emptyText?: ReactNode;
  /** A sentence that sums the chart up for screen readers, e.g. "Closed cases rose 20% over six weeks" */
  summary?: string;
  /** Horizontal bars: room for the category names, in px */
  labelWidth?: number;
  className?: string;
  style?: CSSProperties;
};

const colorOf = (c: string | undefined, i: number) => {
  const hue = c ?? CHART_HUES[i % CHART_HUES.length]!;
  return (CHART_HUES as string[]).includes(hue) ? `var(--asc-hue-${hue})` : hue;
};

/** Numbers in the reader's locale. Axes switch to short forms (18K) when the biggest value is large */
function formatter(format: ChartProps["format"], compact = false): (v: number) => string {
  if (typeof format === "function") return format;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, ...format, ...(compact ? { notation: "compact" } : {}) }).format;
}
const pct = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 });

/** Corner radius and motion length, read from the theme where the chart sits */
function useThemeNumbers(ref: RefObject<HTMLElement | null>) {
  const [n, setN] = useState({ radius: 4, duration: 240 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const s = getComputedStyle(el);
    const radius = parseFloat(s.getPropertyValue("--asc-radius-sm")) || 0;
    const raw = s.getPropertyValue("--asc-duration-slow").trim();
    const duration = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : 240;
    setN({ radius: Math.min(radius, 4), duration: Number.isFinite(duration) ? duration * 2 : 480 });
  }, [ref]);
  return n;
}

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number | string; name?: string; color?: string; fill?: string; payload?: ChartDatum & { fill?: string } }[];
  fmt: (v: number) => string;
  hideLabel?: boolean;
  total?: number;
};

/** The hover card: the category, then one row per series with its colour */
function Tip({ active, payload, label, fmt, hideLabel, total }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="asc-chart__tip">
      {!hideLabel && label != null && label !== "" && <p className="asc-chart__tip-h">{label}</p>}
      {payload.map((p, i) => {
        const v = Number(p.value ?? 0);
        return (
          <div className="asc-chart__tip-r" key={i}>
            <span className="asc-chart__tip-n">
              <span className="asc-chart__sw" style={{ "--c": p.color ?? p.payload?.fill ?? p.fill } as CSSProperties} />
              {p.name}
            </span>
            <span className="asc-chart__tip-v">
              {fmt(v)}
              {total ? ` · ${pct.format(v / total)}` : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** What screen readers get instead of the picture: the same numbers, as a table */
function DataTableAlt({ label, summary, xKey, xLabel, rows, series, fmt }: {
  label: string; summary?: string; xKey: string; xLabel: string; rows: ChartDatum[]; series: ChartSeries[]; fmt: (v: number) => string;
}) {
  return (
    <div className="asc-chart__alt">
    <table>
      <caption>{summary ? `${label}. ${summary}` : label}</caption>
      <thead>
        <tr>
          <th scope="col">{xLabel}</th>
          {series.map((s) => <th key={s.key} scope="col">{s.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <th scope="row">{String(r[xKey] ?? "")}</th>
            {series.map((s) => <td key={s.key}>{r[s.key] == null ? "–" : fmt(Number(r[s.key]))}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export function Chart({
  kind, label, data = [], series: seriesProp, xKey = "label", xLabel = "Category", height, format, stacked = false,
  percent = false, horizontal = false, references = [], legend, hideable = true, centerValue, centerLabel, value = 0,
  max = 100, tone = "neutral", emptyText = "No data yet", summary, labelWidth = 112, className, style,
}: ChartProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const { radius, duration } = useThemeNumbers(wrap);
  const [hidden, setHidden] = useState<string[]>([]);
  const fmt = useMemo(() => formatter(format), [format]);
  const biggest = useMemo(
    () => Math.max(0, ...data.flatMap((d) => (seriesProp ?? []).map((s) => Math.abs(Number(d[s.key] ?? 0))))) * (stacked ? (seriesProp?.length ?? 1) : 1),
    [data, seriesProp, stacked],
  );
  const axisFmt = useMemo(() => (percent ? (v: number) => pct.format(v) : formatter(format, biggest >= 10000)), [format, percent, biggest]);
  const round = kind === "pie" || kind === "donut";
  const valueKey = seriesProp?.[0]?.key ?? "value";
  const series: ChartSeries[] = useMemo(
    () => (seriesProp?.length ? seriesProp : [{ key: valueKey, label: "Value" }]).map((s, i) => ({ ...s, color: colorOf(s.color, i) })),
    [seriesProp, valueKey],
  );
  const shown = series.filter((s) => !hidden.includes(s.key));
  const cls = ["asc-chart", className].filter(Boolean).join(" ");
  const styles = <style href="asc-chart" precedence="asc">{css}</style>;

  // ---- meter: a bar for a table cell or a card, no axes
  if (kind === "meter") {
    const v = Math.max(0, Math.min(max, value));
    return (
      <>
        {styles}
        <span
          className={["asc-meter", className].filter(Boolean).join(" ")}
          style={style}
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={v}
          aria-valuetext={`${fmt(v)} of ${fmt(max)}`}
          data-tone={tone}
          data-size={height && height > 6 ? "md" : undefined}
        >
          <span className="asc-meter__fill" style={{ width: `${max ? (v / max) * 100 : 0}%` }} />
        </span>
      </>
    );
  }

  const h = height ?? (kind === "spark" ? 40 : 240);

  if (!data.length) {
    return (
      <div className={cls} style={style} ref={wrap}>
        {styles}
        <div className="asc-chart__empty" style={{ height: h }}>
          <EmptyState size="sm" title={emptyText} description={kind === "spark" ? undefined : label} />
        </div>
      </div>
    );
  }

  const tip = (extra?: Partial<TipProps>) => <Tooltip cursor content={<Tip fmt={fmt} {...extra} />} isAnimationActive={false} />;
  const motion = { isAnimationActive: duration > 0, animationDuration: duration };

  let plot: ReactNode;
  let legendItems: { key: string; label: string; color: string; value?: string }[] = [];
  let showLegend = false;
  let tableSeries = series;

  if (kind === "spark") {
    const s = series[0]!;
    plot = (
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Line type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={1.75} dot={false} {...motion} />
      </LineChart>
    );
  } else if (round) {
    const total = data.reduce((a, d) => a + Number(d[valueKey] ?? 0), 0);
    const slices: (ChartDatum & { fill: string })[] = data.map((d, i) => ({ ...d, fill: colorOf(d.color == null ? undefined : String(d.color), i) }));
    plot = (
      <PieChart>
        <Pie
          data={slices}
          dataKey={valueKey}
          nameKey={xKey}
          innerRadius={kind === "donut" ? "62%" : 0}
          outerRadius="92%"
          paddingAngle={kind === "donut" ? 1 : 0}
          cornerRadius={kind === "donut" ? radius : 0}
          startAngle={90}
          endAngle={-270}
          {...motion}
        >
          {slices.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Pie>
        {tip({ hideLabel: true, total })}
      </PieChart>
    );
    showLegend = legend ?? true;
    legendItems = slices.map((d) => ({ key: String(d[xKey]), label: String(d[xKey]), color: d.fill, value: fmt(Number(d[valueKey] ?? 0)) }));
    tableSeries = [{ key: valueKey, label: series[0]!.label }];
  } else {
    const common = { data, margin: { top: 8, right: 8, bottom: 0, left: 0 }, stackOffset: percent ? ("expand" as const) : ("none" as const), accessibilityLayer: false };
    const stack = stacked || percent ? "a" : undefined;
    const catAxis = horizontal ? (
      <YAxis type="category" dataKey={xKey} width={labelWidth} tickLine={false} axisLine={false} interval={0} />
    ) : (
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={4} interval="preserveStartEnd" />
    );
    const numAxis = horizontal ? (
      <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={axisFmt} />
    ) : (
      <YAxis tickLine={false} axisLine={false} tickFormatter={axisFmt} width={48} />
    );
    const refs = references.map((r, i) => (
      <ReferenceLine
        key={i}
        {...(horizontal ? { x: r.value } : { y: r.value })}
        ifOverflow="extendDomain"
        isFront
        label={{ value: r.label, position: horizontal ? "top" : "insideTopRight" }}
      />
    ));
    const grid = <CartesianGrid vertical={horizontal} horizontal={!horizontal} />;
    if (kind === "bar") {
      plot = (
        <BarChart {...common} layout={horizontal ? "vertical" : "horizontal"} barCategoryGap="24%" barGap={2}>
          {grid}
          {catAxis}
          {numAxis}
          {tip()}
          {shown.map((s, i) => {
            const top = !stack || i === shown.length - 1;
            const r = top ? radius : 0;
            return (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                fill={s.color}
                stackId={stack}
                maxBarSize={40}
                radius={horizontal ? [0, r, r, 0] : [r, r, 0, 0]}
                {...motion}
              />
            );
          })}
          {refs}
        </BarChart>
      );
    } else if (kind === "line") {
      plot = (
        <LineChart {...common}>
          {grid}
          {catAxis}
          {numAxis}
          {tip()}
          {shown.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={data.length <= 12 ? { r: 3, fill: s.color, strokeWidth: 1.5 } : false} activeDot={{ r: 4.5, strokeWidth: 2 }} {...motion} />
          ))}
          {refs}
        </LineChart>
      );
    } else {
      plot = (
        <AreaChart {...common}>
          {grid}
          {catAxis}
          {numAxis}
          {tip()}
          {shown.map((s) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} fill={s.color} fillOpacity={stack ? 0.55 : 0.16} strokeWidth={2} stackId={stack} activeDot={{ r: 4.5, strokeWidth: 2 }} {...motion} />
          ))}
          {refs}
        </AreaChart>
      );
    }
    showLegend = legend ?? series.length > 1;
    legendItems = series.map((s) => ({ key: s.key, label: s.label, color: s.color! }));
  }

  const toggle = (k: string) => setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]));
  const canHide = hideable && !round && series.length > 1;

  return (
    <div className={cls} style={style} ref={wrap}>
      {styles}
      {/* The picture is for eyes; screen readers get the table below, with the same numbers */}
      <div className="asc-chart__plot" style={{ height: h }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">{plot as ReactElement}</ResponsiveContainer>
        {kind === "donut" && centerValue != null && (
          <div className="asc-chart__center">
            <span className="asc-chart__center-v">{centerValue}</span>
            {centerLabel != null && <span className="asc-chart__center-l">{centerLabel}</span>}
          </div>
        )}
      </div>
      {showLegend && legendItems.length > 0 && (
        <ul className="asc-chart__legend" aria-label={canHide ? `${label}: show or hide series` : undefined} aria-hidden={canHide ? undefined : true}>
          {legendItems.map((it) => (
            <li key={it.key}>
              {canHide ? (
                <button type="button" className="asc-chart__lg" aria-pressed={!hidden.includes(it.key)} onClick={() => toggle(it.key)}>
                  <span className="asc-chart__sw" style={{ "--c": it.color } as CSSProperties} />
                  {it.label}
                </button>
              ) : (
                <span className="asc-chart__lg">
                  <span className="asc-chart__sw" style={{ "--c": it.color } as CSSProperties} />
                  {it.label}
                  {it.value != null && <span className="asc-chart__lg-v">{it.value}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <DataTableAlt label={label} summary={summary} xKey={xKey} xLabel={xLabel} rows={data} series={tableSeries} fmt={fmt} />
    </div>
  );
}
