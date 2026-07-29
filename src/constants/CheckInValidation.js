export const CheckInValidation = ({ formData }) => {  
  if (!formData.bookingRef || formData.bookingRef.trim() === "") {
    return {field: "Booking Reference", valid: false};
  }

  if (formData.guestDetails.length === 0) {
    return {field: "GuestDetails", valid: false};
  }

  for (let guest of formData.guestDetails) {
    if (!guest?.name || guest?.name.trim() === "" ) return {field: "Guest Name", valid: false};
    if(!guest?.mobileNo || guest?.mobileNo.trim() === "") return {field: "Guest Mobile No", valid: false};
    if(!guest?.idPhotoUrl || guest?.idPhotoUrl.trim() === "") return {field: "Guest Id Photo", valid: false};
    if(!guest?.userPhotoUrl || guest?.userPhotoUrl.trim() === "") return {field: "Guest Photo", valid: false};
  }

  if (!formData.paymentAmount || formData.paymentAmount.trim() === "") {
    return {field: "Payment", valid: false};
  }

  return {field: "", valid: true};
}