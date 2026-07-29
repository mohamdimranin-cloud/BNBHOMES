// const GST = 0.18;
// const ADDITIONAL_DISCOUNT = 0.05;
// const COMMISION_AGENT = 100.00;
// const WITH_BREAKFAST = 100.00;
// const EXTRA_BED = 600.00;

// const RoomTypes = {
//   "studio": ["G01", "101", "104", "201", "204", "301", "304", "401", "404"],
//   "stu_tw": ["102", "103", "202", "203", "302", "303", "402", "403"],
//   "bhk1": ["G02", "105", "106", "205", "206", "305", "306", "405", "406"],
// };

// const Prices = {
//   days: {
//     oneDay: {
//       studio: 1500.00,
//       bhk1: 1700.00,
//     },
//     twoToSevenDays: {
//       studio: 1400.00,
//       bhk1: 1600.00,
//     },
//     eightAndAboveDays: {
//       studio: 1300.00,
//       bhk1: 1500.00,
//     },
//   },
//   BulkBookRoomDiscount: {
//     twoToFiveRooms: 5,
//     sixToTenRooms: 10,
//     elevenToAboveRooms: 15,
//   }
// };
// /*
 
//    checkInDate: dayjs(today),
//    checkOutDate: dayjs(tomorrow),
//    numberOfDays: 1,
//    bookingRef: "",
//    numOfRooms: 0,
//    bookingRefNum: "",
//    thirdPartyName: "",
//    selectedRooms: [],
//    roomBedType: [],
//    guestType: "", guestMobileNumber: "", guestName: "", guestWhatsappNumber: "", guestEmailId: "",
//    numOfAdults: 0 || "", numOfChildren: 0 || "", extraBed: 0 || "", idType: "",
//    otherIdName: "", idNumber: "", bikeCarNumber: "", breakfast: "", profitShareOrComission: "",
//    comissionAgent: "", comissionAgentName: "", specialDiscounts: "", specialDiscountsReason: "",
//    roomAmount: 0.00, gst: GST * 100, advanceAmount: 0.00, netPayable: 0.00, paymentMethod: "",
   
// */

// const PriceCalculator = ({ formData, setFormData }) => {
//   // Extract necessary data from formData
//   const {
//     selectedRooms,
//     numberOfDays,
//     extraBed,
//     breakfast,
//     specialDiscounts,
//     numOfRooms,
//     anyDiscountAmt,
//   } = formData;

//   let totalBeforeGST = 0;

//   // Iterate through all selected rooms and calculate price for each
//   selectedRooms.forEach((selectedRoom) => {
//     let roomType = "studio"; // Default to studio
//     if (RoomTypes.stu_tw.includes(selectedRoom)) {
//       roomType = "studio"; // Assuming studio price for stu_tw
//     } else if (RoomTypes.bhk1.includes(selectedRoom)) {
//       roomType = "bhk1";
//     }

//     //console.log(`Selected Room: ${selectedRoom}, Room Type: ${roomType}`);

//     // Determine base price based on number of days
//     let basePrice = 0;
//     if (numberOfDays === 1) {
//       basePrice = Prices.days.oneDay[roomType];
//     } else if (numberOfDays >= 2 && numberOfDays <= 7) {
//       basePrice = Prices.days.twoToSevenDays[roomType];
//     } else {
//       basePrice = Prices.days.eightAndAboveDays[roomType];
//     }
//     //console.log(`Base Price for room ${selectedRoom} for ${numberOfDays} day(s): ₹${basePrice}`);

//     // Add the base price of this room to the total
//     totalBeforeGST += basePrice;
//   });

//   // Add extra bed cost
//   if (extraBed > 0) {
//     totalBeforeGST += EXTRA_BED * extraBed;
//     //console.log(`Extra Bed Cost (₹${EXTRA_BED} per bed): ₹${EXTRA_BED * extraBed}`);
//   }

//   // Add breakfast cost if applicable
//   if (breakfast === "Yes") {
//     totalBeforeGST += WITH_BREAKFAST * selectedRooms.length;
//     //console.log(`Breakfast Cost: ₹${WITH_BREAKFAST * selectedRooms.length}`);
//   }

//   //console.log(`Total Before GST: ₹${totalBeforeGST}`);

//   // Calculate GST
//   const gstAmount = totalBeforeGST * GST;
//   const netPayable = totalBeforeGST + gstAmount;

//   //console.log(`GST (18%): ₹${gstAmount}`);
//   //console.log(`Total After GST: ₹${netPayable}`);

//   // Apply special discount if applicable (5% for now, assuming the "Other" option)
//   let finalNetPayable = netPayable;
//   if (specialDiscounts === "Other") {
//     const discountAmount = netPayable * ADDITIONAL_DISCOUNT;
//     finalNetPayable -= discountAmount;
//     //console.log(`Special Discount (5%): -₹${discountAmount}`);
//   }

//   //console.log(`Final Net Payable Amount: ₹${finalNetPayable}`);

//   // Set formData with calculated values
//   setFormData({
//     ...formData,
//     roomAmount: totalBeforeGST.toFixed(2),
//     gst: gstAmount.toFixed(2),
//     netPayable: finalNetPayable.toFixed(2),
//   });

//   return finalNetPayable.toFixed(2);
// };


// export {
//   PriceCalculator,
//   Prices,
//   GST,
//   ADDITIONAL_DISCOUNT,
//   COMMISION_AGENT,
//   WITH_BREAKFAST
// }