export function getSeatCount(car) {
  const value = Number(car?.seatCount || car?.seats || car?.seatCapacity || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function getOccupiedSeats(records) {
  return new Map(
    records
      .filter((record) => String(record.seatNo || "").trim() !== "")
      .map((record) => [String(record.seatNo), record])
  );
}

export function getAvailableSeatNumbers(car, records) {
  const seatCount = getSeatCount(car);
  if (!seatCount) return [];
  const occupied = new Set(records.map((record) => String(record.seatNo)));
  return Array.from({ length: seatCount }, (_, index) => String(index + 1)).filter(
    (seatNo) => !occupied.has(seatNo)
  );
}

export function getSeatAssignments(car, records) {
  const seatCount = getSeatCount(car);
  const assignments = [];
  const occupiedMap = getOccupiedSeats(records);

  for (let seat = 1; seat <= seatCount; seat += 1) {
    const seatNo = String(seat);
    assignments.push({
      seatNo,
      record: occupiedMap.get(seatNo) || null,
    });
  }

  return assignments;
}
