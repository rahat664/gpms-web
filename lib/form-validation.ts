export function requireText(value: string, fieldName: string) {
  const next = value.trim();
  if (!next) {
    throw new Error(`${fieldName} is required`);
  }
  return next;
}

export function requireDate(value: string, fieldName: string) {
  const next = requireText(value, fieldName);
  const time = Date.parse(next);
  if (Number.isNaN(time)) {
    throw new Error(`${fieldName} must be a valid date`);
  }
  return next;
}

export function requirePositiveNumber(
  value: string | number,
  fieldName: string,
  min = 1,
) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  return parsed;
}

export function ensureDateOrder(
  start: string,
  end: string,
  startField = "Start Date",
  endField = "End Date",
) {
  const startDate = requireDate(start, startField);
  const endDate = requireDate(end, endField);
  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    throw new Error(`${startField} must be on or before ${endField}`);
  }
}

