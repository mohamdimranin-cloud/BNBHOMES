export const incrementBookingReference = (latestRef) => {
  const currentYear = new Date().getFullYear().toString().slice(-2);

  // Handle case when no record exists
  if (!latestRef || latestRef.length === 0) {
    return `AD001/${currentYear}`;
  }

  // Extract number and year (e.g., "AD001/24" → "001" and "24")
  const match = latestRef.match(/AD(\d+)\/(\d+)/);
  if (match) {
    let lastNumber = parseInt(match[1], 10);
    let lastYear = match[2];

    // If the year is the same, increment; otherwise, reset to 1
    const newNumber = lastYear === currentYear ? lastNumber + 1 : 1;

    // Format as AD###/YY
    return `AD${String(newNumber).padStart(3, "0")}/${currentYear}`;
  }

  // Fallback in case of an unexpected format
  return `AD001/${currentYear}`;
};

export const validateForm = (formData) => {
  if (formData.guest_name === "") return "Guest Naem needed";
  if (formData.mobile_num === "") return "Guest Mobile Number needed";
  if (formData.whatsapp_num === "") return "Guest Whatsapp Number needed";
  if(formData.guest_type === "DG" && formData.prev_booking_ref === "") return "Previous Booking Reference neede"

  return null;
}