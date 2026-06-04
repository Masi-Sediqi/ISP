import { useMemo, useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./Reports.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const getDestinationColor = (index) => {
  const hue = Math.round((index * 137.508) % 360);
  return {
    stroke: `hsl(${hue} 78% 34%)`,
    fill: `hsl(${hue} 62% 43%)`,
  };
};

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getDateRange = (dateValue, period) => {
  const selected = parseDate(dateValue) || new Date();
  const start = new Date(selected);
  const end = new Date(selected);

  if (period === "weekly") {
    const daysFromSaturday = (selected.getDay() + 1) % 7;
    start.setDate(selected.getDate() - daysFromSaturday);
    end.setTime(start.getTime());
    end.setDate(start.getDate() + 6);
  } else if (period === "monthly") {
    start.setDate(1);
    end.setMonth(start.getMonth() + 1, 0);
  }

  return { start: toDateValue(start), end: toDateValue(end) };
};

const periodLabels = {
  all: "همه سفرها",
  daily: "روزانه",
  weekly: "هفته‌وار",
  monthly: "ماهانه",
};

function TravelReport() {
  const [travels] = useJsonCollection("travels");
  const [destinations] = useJsonCollection("destinations");
  const latestTravelDate = useMemo(
    () => [...travels].map((travel) => travel.date).filter(Boolean).sort().at(-1) || toDateValue(new Date()),
    [travels]
  );
  const [period, setPeriod] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");
  const activeDate = selectedDate || latestTravelDate;
  const { start, end } = getDateRange(activeDate, period);

  const filteredTravels = travels.filter((travel) =>
    travel.to && (period === "all" || (travel.date && travel.date >= start && travel.date <= end))
  );

  const destinationNames = [...new Set(filteredTravels.map((travel) => travel.to))].filter(Boolean);
  const mapHeight = Math.max(520, 160 + destinationNames.length * 135);
  const originY = mapHeight / 2;
  const originX = 95;

  const destinationData = destinationNames.map((name) => {
    const destinationTravels = filteredTravels.filter((travel) => travel.to === name);
    const destination = destinations.find((item) => item.name === name);
    const totalKilometers = destinationTravels.reduce(
      (sum, travel) => sum + Number(travel.kilometers || 0),
      0
    );
    const distanceKilometers = Number(
      destination?.kilometers ||
      destinationTravels.map((travel) => Number(travel.kilometers || 0)).find((value) => value > 0) ||
      0
    );
    return {
      name,
      count: destinationTravels.length,
      totalKilometers,
      distanceKilometers,
      description: destination?.description || "",
    };
  }).sort((a, b) => a.distanceKilometers - b.distanceKilometers || a.name.localeCompare(b.name));

  const maxDistance = Math.max(...destinationData.map((destination) => destination.distanceKilometers), 1);
  const destinationStats = destinationData.map((destination, index) => ({
    ...destination,
    color: getDestinationColor(index),
    x: 285 + (destination.distanceKilometers / maxDistance) * 545,
    y: destinationData.length === 1 ? originY - 90 : 95 + index * 135,
  }));

  const tripLines = filteredTravels.map((travel, index) => {
    const point = destinationStats.find((destination) => destination.name === travel.to);
    const repeatIndex = filteredTravels
      .slice(0, index)
      .filter((previousTravel) => previousTravel.to === travel.to).length;
    const controlX = point ? (originX + point.x) / 2 : 250;
    const lineOffset = point ? (repeatIndex - (point.count - 1) / 2) * 48 : 0;
    const controlY = point ? (originY + point.y) / 2 + lineOffset : originY;
    return {
      id: `${travel.to}-${index}`,
      point,
      repeatIndex,
      path: point ? `M ${originX} ${originY} Q ${controlX} ${controlY} ${point.x} ${point.y}` : "",
    };
  }).filter((line) => line.point);

  const totalKilometers = filteredTravels.reduce(
    (sum, travel) => sum + Number(travel.kilometers || 0),
    0
  );

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>راپور سفرها</h1>
        <p>نمایش مسیرها، تعداد سفرها و کیلومتر پیموده‌شده برای هر مقصد</p>
      </div>

      <div className="report-filters">
        <div className="report-filter-group">
          <label>حالت راپور</label>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="all">همه سفرها</option>
            <option value="daily">روزانه</option>
            <option value="weekly">هفته‌وار</option>
            <option value="monthly">ماهانه</option>
          </select>
        </div>
        <div className="report-filter-group">
          <label>انتخاب تاریخ</label>
          <input type="date" value={activeDate} onChange={(event) => setSelectedDate(event.target.value)} disabled={period === "all"} />
        </div>
        <div className="report-filter-summary">
          <span>بازه راپور {periodLabels[period]}</span>
          <strong>{period === "all" ? "تمام تاریخ‌های ثبت‌شده" : start === end ? start : `${start} تا ${end}`}</strong>
        </div>
      </div>

      <div className="report-stats">
        <div><span>کل سفرها</span><strong>{filteredTravels.length}</strong><p>سفر در بازه انتخاب‌شده</p></div>
        <div><span>کل مقصدها</span><strong>{destinationStats.length}</strong><p>مقصد دارای سفر</p></div>
        <div><span>مجموع کیلومتر</span><strong>{money(totalKilometers)}</strong><p>کیلومتر پیموده‌شده</p></div>
      </div>

      <div className="travel-map-card">
        <div className="travel-map-title">
          <h3>نقشه مسیر سفرها</h3>
          <p>هر مقصد رنگ مخصوص دارد و هر خط یک سفر مستقل را نشان می‌دهد</p>
        </div>
        <div className="travel-map-wrap">
          {destinationStats.length > 0 ? (
            <svg viewBox={`0 0 900 ${mapHeight}`} role="img" aria-label="نقشه مسیر سفرها">
              <defs>
                {destinationStats.map((destination, index) => (
                  <marker
                    key={destination.name}
                    id={`arrow-${index}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="7"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 z" fill={destination.color.stroke} />
                  </marker>
                ))}
              </defs>
              <rect x="15" y="15" width="870" height={mapHeight - 30} rx="28" className="map-background" />
              {tripLines.map((line) => {
                const destinationIndex = destinationStats.findIndex(
                  (destination) => destination.name === line.point.name
                );
                return (
                  <path
                    key={line.id}
                    d={line.path}
                    className="trip-map-line"
                    style={{
                      stroke: line.point.color.stroke,
                      strokeWidth: 3 + Math.min(line.repeatIndex, 3) * 0.45,
                      strokeDasharray: line.repeatIndex % 2 === 1 ? "9 5" : "none",
                    }}
                    markerEnd={`url(#arrow-${destinationIndex})`}
                  />
                );
              })}
              <circle cx={originX} cy={originY} r="35" className="origin-node" />
              <text x={originX} y={originY + 5} textAnchor="middle" className="map-node-title">مبدأ</text>
              {destinationStats.map((destination) => (
                <g key={destination.name}>
                  <circle
                    cx={destination.x}
                    cy={destination.y}
                    r="38"
                    className="destination-node"
                    style={{ fill: destination.color.fill, stroke: destination.color.stroke }}
                  />
                  <text x={destination.x} y={destination.y - 4} textAnchor="middle" className="map-node-title destination-node-label">{destination.name}</text>
                  <text x={destination.x} y={destination.y + 15} textAnchor="middle" className="map-node-subtitle destination-node-label">
                    {destination.count} سفر | فاصله {money(destination.distanceKilometers)} km
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <div className="report-map-empty">در بازه انتخاب‌شده سفری ثبت نشده است.</div>
          )}
        </div>
      </div>

      <div className="travel-report-table">
        <div className="travel-map-title"><h3>خلاصه مقصدها</h3><p>فقط مقصدهایی که در بازه انتخاب‌شده سفر دارند</p></div>
        <table>
          <thead><tr><th>رنگ</th><th>مقصد</th><th>تعداد سفر</th><th>فاصله مقصد</th><th>مجموع کیلومتر سفرها</th><th>توضیحات</th></tr></thead>
          <tbody>
            {destinationStats.map((destination) => (
              <tr key={destination.name}>
                <td><span className="destination-color" style={{ background: destination.color.stroke }} /></td>
                <td>{destination.name}</td>
                <td>{destination.count}</td>
                <td>{money(destination.distanceKilometers)} کیلومتر</td>
                <td>{money(destination.totalKilometers)} کیلومتر</td>
                <td>{destination.description || "-"}</td>
              </tr>
            ))}
            {destinationStats.length === 0 && <tr><td colSpan="6" className="report-empty">در بازه انتخاب‌شده سفری ثبت نشده است</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TravelReport;
