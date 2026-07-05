const GEORGIA_TZ = "Asia/Tbilisi";

const getPartsMap = (date, timeZone) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const map = {};
  parts.forEach(({ type, value }) => {
    map[type] = value;
  });
  return map;
};

export const formatDateOnly = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const formatDateTime = (date, timeZone = GEORGIA_TZ) => {
  if (!date) return "";
  const p = getPartsMap(date, timeZone);
  if (!p) return "";
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
};
