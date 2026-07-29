export const columns = [
  { field: "id", headerName: "Sl.No", width: 80, align: "center", headerAlign: 'center' },
  { field: "amc", headerName: "BnB AMCs", flex: 1, headerAlign: 'center' },
  { field: "period", headerName: "Period", flex: 1, headerAlign: 'center', align: "center" },
  { field: "dayDate", headerName: "Day/Date", flex: 1, headerAlign: 'center' },
  { field: "auditing", headerName: "Auditing", flex: 1, headerAlign: 'center' },
];

const getNextDate = (dayDate) => {
  const today = new Date();
  const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)

  if (dayDate.includes("Every Saturday")) {
    // Get the next Saturday
    const daysUntilSaturday = (6 - day + 7) % 7 || 7; // Ensure it's always the next one
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toLocaleDateString("en-GB");
  }

  if (dayDate.includes("1st & 15th")) {
    // Get next 1st or 15th of the month
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const fifteenth = new Date(today.getFullYear(), today.getMonth(), 15);
    const nextDate = today.getDate() < 1 ? first : today.getDate() < 15 ? fifteenth : new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextDate.toLocaleDateString("en-GB");
  }

  if (dayDate.includes("1st of Every Month")) {
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString("en-GB");
  }

  if (dayDate.includes("Jan & July")) {
    const nextMonth = today.getMonth() < 6 ? new Date(today.getFullYear(), 0, 1) : new Date(today.getFullYear(), 6, 1);
    return nextMonth.toLocaleDateString("en-GB");
  }

  if (dayDate.includes("Jan, Apr, July & Oct")) {
    const months = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct
    let nextMonth = months.find((m) => m >= today.getMonth());
    if (nextMonth === undefined) nextMonth = months[0] + 12; // Next year's Jan
    const nextDate = new Date(today.getFullYear(), nextMonth, 1);
    return nextDate.toLocaleDateString("en-GB");
  }

  if (dayDate.includes("Every Day")) {
    return `${today.toLocaleDateString("en-GB")} (6:00 PM)`;
  }

  if (dayDate.includes("Jan")) {
    const nextJan = new Date(today.getFullYear(), 0, 1);
    return nextJan.toLocaleDateString("en-GB");
  }

  return "Unknown";
};

export const rows = [
  { id: 1, amc: "Water Filter Back Wash", dayDate: "Every Saturday", auditing: "Every Saturday" },
  { id: 2, amc: "Genset Run Test", dayDate: "Every Saturday", auditing: "Every Saturday" },
  { id: 3, amc: "Genset Annual Test - Company", dayDate: "Jan", auditing: "Jan" },
  { id: 4, amc: "Waste water Net cleaning", dayDate: "Every Saturday", auditing: "Every Saturday" },
  { id: 5, amc: "Pest Control", dayDate: "1st & 15th of the Month", auditing: "1st & 15th of the Month" },
  { id: 6, amc: "AC Filter Cleaning", dayDate: "1st of Every Month", auditing: "1st of Every Month" },
  { id: 7, amc: "AC Maintenance - By Company", dayDate: "Jan & July of the Month", auditing: "Jan & July of the Month" },
  { id: 8, amc: "Fire Pump - By Company", dayDate: "Jan, Apr, July & Oct", auditing: "Jan, Apr, July & Oct" },
  { id: 9, amc: "Lift Maintenance - By Company", dayDate: "1st of Every Month", auditing: "1st of Every Month" },
  { id: 10, amc: "Roof Water Tank Water Level", dayDate: "Every Day (Evening 6.00 PM)", auditing: "" },
].map((row) => ({
  ...row,
  period: getNextDate(row.dayDate), // Automatically compute the date
}));

