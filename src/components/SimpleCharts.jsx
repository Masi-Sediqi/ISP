import React from "react";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const DEFAULT_MARGIN = { top: 18, right: 24, bottom: 36, left: 48 };
const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#8b5cf6", "#f59e0b", "#0ea5e9"];

const isElementType = (child, type) => React.isValidElement(child) && child.type === type;

const getChildrenOfType = (children, type) =>
  React.Children.toArray(children).filter((child) => isElementType(child, type));

const getFirstChildOfType = (children, type) =>
  React.Children.toArray(children).find((child) => isElementType(child, type));

const getValue = (row, key) => Number(row?.[key] || 0);

const formatValue = (value, formatter) => {
  if (typeof formatter === "function") return formatter(value);
  return Number(value || 0).toLocaleString("en-US");
};

const getPlot = (margin = {}) => {
  const merged = { ...DEFAULT_MARGIN, ...margin };
  return {
    margin: merged,
    x: merged.left,
    y: merged.top,
    width: CHART_WIDTH - merged.left - merged.right,
    height: CHART_HEIGHT - merged.top - merged.bottom,
  };
};

const niceMax = (value) => {
  const max = Math.max(Number(value || 0), 1);
  const power = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / power) * power;
};

const collectSeries = (children) => [
  ...getChildrenOfType(children, Bar),
  ...getChildrenOfType(children, Line),
  ...getChildrenOfType(children, Area),
];

const getDomainMax = (data, series) =>
  niceMax(
    data.reduce(
      (max, row) =>
        Math.max(max, ...series.map((item) => Math.abs(getValue(row, item.props.dataKey)))),
      0
    )
  );

const pathFromPoints = (points) => points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");

const renderGrid = (children, plot) => {
  const grid = getFirstChildOfType(children, CartesianGrid);
  if (!grid) return null;

  return (
    <g stroke={grid.props.stroke || "#e5e7eb"} strokeDasharray={grid.props.strokeDasharray || "4 4"}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
        <line key={ratio} x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height * ratio} y2={plot.y + plot.height * ratio} />
      ))}
      {grid.props.vertical !== false &&
        [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line key={`v-${ratio}`} y1={plot.y} y2={plot.y + plot.height} x1={plot.x + plot.width * ratio} x2={plot.x + plot.width * ratio} />
        ))}
    </g>
  );
};

const renderAxes = (children, data, plot, maxValue, layout) => {
  const xAxis = getFirstChildOfType(children, XAxis);
  const yAxis = getFirstChildOfType(children, YAxis);
  const categoryKey = xAxis?.props?.dataKey || yAxis?.props?.dataKey || "name";
  const yFormatter = yAxis?.props?.tickFormatter;
  const labelStyle = { fill: "#64748b", fontSize: 11, fontFamily: "Arial, sans-serif" };

  if (layout === "vertical") {
    return (
      <g>
        <line x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height} y2={plot.y + plot.height} stroke="#cbd5e1" />
        <line x1={plot.x} x2={plot.x} y1={plot.y} y2={plot.y + plot.height} stroke="#cbd5e1" />
        {[0, 0.5, 1].map((ratio) => (
          <text key={ratio} x={plot.x + plot.width * ratio} y={plot.y + plot.height + 22} textAnchor="middle" style={labelStyle}>
            {formatValue(maxValue * ratio, xAxis?.props?.tickFormatter)}
          </text>
        ))}
        {data.map((row, index) => (
          <text key={index} x={plot.x - 8} y={plot.y + ((index + 0.5) * plot.height) / Math.max(data.length, 1)} textAnchor="end" dominantBaseline="middle" style={labelStyle}>
            {String(row[categoryKey] ?? "").slice(0, 14)}
          </text>
        ))}
      </g>
    );
  }

  return (
    <g>
      <line x1={plot.x} x2={plot.x + plot.width} y1={plot.y + plot.height} y2={plot.y + plot.height} stroke="#cbd5e1" />
      <line x1={plot.x} x2={plot.x} y1={plot.y} y2={plot.y + plot.height} stroke="#cbd5e1" />
      {[0, 0.5, 1].map((ratio) => (
        <text key={ratio} x={plot.x - 8} y={plot.y + plot.height - plot.height * ratio + 4} textAnchor="end" style={labelStyle}>
          {formatValue(maxValue * ratio, yFormatter)}
        </text>
      ))}
      {data.map((row, index) => (
        <text key={index} x={plot.x + ((index + 0.5) * plot.width) / Math.max(data.length, 1)} y={plot.y + plot.height + 22} textAnchor="middle" style={labelStyle}>
          {String(row[categoryKey] ?? "").slice(0, 10)}
        </text>
      ))}
    </g>
  );
};

const renderLegend = (children, series) => {
  if (!getFirstChildOfType(children, Legend)) return null;

  return (
    <g transform={`translate(${DEFAULT_MARGIN.left}, ${CHART_HEIGHT - 10})`}>
      {series.map((item, index) => (
        <g key={`${item.props.dataKey}-${index}`} transform={`translate(${index * 120}, 0)`}>
          <rect width="10" height="10" rx="2" fill={item.props.fill || item.props.stroke || COLORS[index % COLORS.length]} />
          <text x="16" y="9" style={{ fill: "#475569", fontSize: 11, fontFamily: "Arial, sans-serif" }}>
            {item.props.name || item.props.dataKey}
          </text>
        </g>
      ))}
    </g>
  );
};

const ChartFrame = ({ children, data = [], margin, layout, type = "combo" }) => {
  const plot = getPlot(margin);
  const series = collectSeries(children);
  const maxValue = getDomainMax(data, series);
  const barSeries = getChildrenOfType(children, Bar);
  const lineSeries = [...getChildrenOfType(children, Line), ...getChildrenOfType(children, Area)];
  const count = Math.max(data.length, 1);
  const groupSize = layout === "vertical" ? plot.height / count : plot.width / count;
  const scaleY = (value) => plot.y + plot.height - (Number(value || 0) / maxValue) * plot.height;
  const scaleX = (value) => plot.x + (Number(value || 0) / maxValue) * plot.width;

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" height="100%" role="img" preserveAspectRatio="none">
      {React.Children.toArray(children).filter((child) => React.isValidElement(child) && child.type === "defs")}
      {renderGrid(children, plot)}
      {renderAxes(children, data, plot, maxValue, layout)}
      {barSeries.map((bar, seriesIndex) => {
        const color = bar.props.fill || COLORS[seriesIndex % COLORS.length];
        const barCount = Math.max(barSeries.length, 1);
        const barThickness = Math.min(layout === "vertical" ? 18 : Number(bar.props.maxBarSize || 42), (groupSize * 0.7) / barCount);

        return (
          <g key={`bar-${bar.props.dataKey}-${seriesIndex}`}>
            {data.map((row, index) => {
              const value = getValue(row, bar.props.dataKey);
              const label = `${bar.props.name || bar.props.dataKey}: ${formatValue(value)}`;

              if (layout === "vertical") {
                const y = plot.y + index * groupSize + groupSize * 0.15 + seriesIndex * barThickness;
                const width = Math.max(scaleX(value) - plot.x, 1);
                return <rect key={index} x={plot.x} y={y} width={width} height={barThickness * 0.9} rx="5" fill={color}><title>{label}</title></rect>;
              }

              const x = plot.x + index * groupSize + groupSize * 0.15 + seriesIndex * barThickness;
              const y = scaleY(value);
              return <rect key={index} x={x} y={y} width={barThickness * 0.9} height={plot.y + plot.height - y} rx="5" fill={color}><title>{label}</title></rect>;
            })}
          </g>
        );
      })}
      {lineSeries.map((line, seriesIndex) => {
        const color = line.props.stroke || line.props.fill || COLORS[(seriesIndex + barSeries.length) % COLORS.length];
        const points = data.map((row, index) => ({
          x: plot.x + ((index + 0.5) * plot.width) / count,
          y: scaleY(getValue(row, line.props.dataKey)),
          value: getValue(row, line.props.dataKey),
        }));
        const path = pathFromPoints(points);
        const fill = line.type === Area ? line.props.fill || `${color}22` : "none";

        return (
          <g key={`line-${line.props.dataKey}-${seriesIndex}`}>
            {line.type === Area && points.length > 0 && (
              <path d={`${path} L${points[points.length - 1].x},${plot.y + plot.height} L${points[0].x},${plot.y + plot.height} Z`} fill={fill} opacity="0.45" />
            )}
            <path d={path} fill="none" stroke={color} strokeWidth={line.props.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((point, index) => (
              <circle key={index} cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2">
                <title>{`${line.props.name || line.props.dataKey}: ${formatValue(point.value)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {renderLegend(children, series)}
      {type === "combo" && getFirstChildOfType(children, Tooltip) ? <title>Chart values are available by hovering each shape.</title> : null}
    </svg>
  );
};

const PieFrame = ({ children }) => {
  const pie = getFirstChildOfType(children, Pie);
  const data = pie?.props?.data || [];
  const total = data.reduce((sum, row) => sum + getValue(row, pie.props.dataKey), 0) || 1;
  const cells = getChildrenOfType(pie?.props?.children, Cell);
  const cx = CHART_WIDTH / 2;
  const cy = CHART_HEIGHT / 2 - 4;
  const radius = Number(pie?.props?.outerRadius || 88);
  const innerRadius = Number(pie?.props?.innerRadius || 0);
  let start = -90;

  const arcPath = (startAngle, endAngle) => {
    const toPoint = (angle, r) => {
      const rad = (Math.PI / 180) * angle;
      return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
    };
    const [x1, y1] = toPoint(startAngle, radius);
    const [x2, y2] = toPoint(endAngle, radius);
    const [ix1, iy1] = toPoint(endAngle, innerRadius);
    const [ix2, iy2] = toPoint(startAngle, innerRadius);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M${x1},${y1} A${radius},${radius} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${innerRadius},${innerRadius} 0 ${large} 0 ${ix2},${iy2} Z`;
  };

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" height="100%" role="img" preserveAspectRatio="xMidYMid meet">
      {data.map((row, index) => {
        const value = getValue(row, pie.props.dataKey);
        const angle = (value / total) * 360;
        const end = start + angle;
        const color = cells[index]?.props?.fill || COLORS[index % COLORS.length];
        const path = arcPath(start, end);
        start = end + Number(pie.props.paddingAngle || 0);
        return (
          <path key={index} d={path} fill={color}>
            <title>{`${row[pie.props.nameKey] || row.name || ""}: ${formatValue(value)}`}</title>
          </path>
        );
      })}
      {getFirstChildOfType(children, Legend) && (
        <g transform={`translate(${CHART_WIDTH - 190}, 40)`}>
          {data.slice(0, 6).map((row, index) => (
            <g key={index} transform={`translate(0, ${index * 22})`}>
              <rect width="10" height="10" rx="2" fill={cells[index]?.props?.fill || COLORS[index % COLORS.length]} />
              <text x="16" y="10" style={{ fill: "#475569", fontSize: 12, fontFamily: "Arial, sans-serif" }}>
                {String(row[pie.props.nameKey] || row.name || "").slice(0, 18)}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

export function ResponsiveContainer({ width = "100%", height = "100%", children }) {
  return (
    <div style={{ width, height, minWidth: 0, minHeight: 0 }}>
      {children}
    </div>
  );
}

export function BarChart(props) {
  return <ChartFrame {...props} />;
}

export function LineChart(props) {
  return <ChartFrame {...props} />;
}

export function AreaChart(props) {
  return <ChartFrame {...props} />;
}

export function ComposedChart(props) {
  return <ChartFrame {...props} />;
}

export function PieChart({ children }) {
  return <PieFrame>{children}</PieFrame>;
}

export function Bar() {
  return null;
}

export function Line() {
  return null;
}

export function Area() {
  return null;
}

export function Pie() {
  return null;
}

export function Cell() {
  return null;
}

export function CartesianGrid() {
  return null;
}

export function XAxis() {
  return null;
}

export function YAxis() {
  return null;
}

export function Tooltip() {
  return null;
}

export function Legend() {
  return null;
}
