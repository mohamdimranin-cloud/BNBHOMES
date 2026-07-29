const GST = 0.12; // 12% GST
const EXTRA_GUEST_COST = 300.00; // Cost per extra guest (excluding GST)
const ADDITIONAL_DISCOUNT = 0.05; // 5% discount for bulk booking

const Prices = {
  days: {
    oneDay: {
      SK: 1500.00, // Single King
      ST: 1400.00, // Single Twin
      FM: 1800.00, // Family Room
      SU: 2000.00, // Suite
      SL: 1700.00, // Studio Large
    },
    twoToSevenDays: {
      SK: 1400.00,
      ST: 1300.00,
      FM: 1700.00,
      SU: 1900.00,
      SL: 1600.00,
    },
    eightAndAboveDays: {
      SK: 1300.00,
      ST: 1200.00,
      FM: 1600.00,
      SU: 1800.00,
      SL: 1500.00,
    },
  },
  BulkBookRoomDiscount: {
    twoToFiveRooms: 5, // 5% discount for 2-5 rooms
    sixToTenRooms: 10, // 10% discount for 6-10 rooms
    elevenToAboveRooms: 15, // 15% discount for 11+ rooms
  }
};

const calculateFinalAdvanceBookingPrice = ({ advanceBooking, setAdvanceBooking, rooms }) => {

  let totalBeforeGST = 0;
  let extraGuestCost = 0;
  let numOfRooms = 0;

  rooms.forEach((room) => {
    const { room_type, num_of_rooms } = room;

    if (room_type === "") return;
    
    numOfRooms += num_of_rooms;

    // Determine base price based on number of nights
    let basePrice = 0;
    if (advanceBooking.num_of_nights === 1) {
      basePrice = Prices.days.oneDay[room_type] * num_of_rooms * advanceBooking.num_of_nights;
    } else if (advanceBooking.num_of_nights >= 2 && advanceBooking.num_of_nights <= 7) {
      basePrice = Prices.days.twoToSevenDays[room_type] * num_of_rooms * advanceBooking.num_of_nights;
    } else {
      basePrice = Prices.days.eightAndAboveDays[room_type] * num_of_rooms * advanceBooking.num_of_nights;
    }

    totalBeforeGST += basePrice;
  });

  // Extra guest calculation (Each room is for 2 guests, extra guests cost 300 per night)
  const includedGuests = numOfRooms * 2;
  if (advanceBooking.num_of_guest > includedGuests) {
    const extraGuests = advanceBooking.num_of_guest - includedGuests;
    extraGuestCost = extraGuests * EXTRA_GUEST_COST * advanceBooking.num_of_nights;
  }

  totalBeforeGST += extraGuestCost;

  // Apply bulk booking discount
  let discountPercentage = 0;
  if (numOfRooms >= 2 && numOfRooms <= 5) {
    discountPercentage = Prices.BulkBookRoomDiscount.twoToFiveRooms;
  } else if (numOfRooms >= 6 && numOfRooms <= 10) {
    discountPercentage = Prices.BulkBookRoomDiscount.sixToTenRooms;
  } else if (numOfRooms >= 11) {
    discountPercentage = Prices.BulkBookRoomDiscount.elevenToAboveRooms;
  }
  const bulkDiscount = (totalBeforeGST * discountPercentage) / 100;
  totalBeforeGST -= bulkDiscount;

  // Calculate GST (if guest type is not DG)
  const gstAmount = advanceBooking.guest_type === "DG" ? 0 : totalBeforeGST * GST;
  const totalAmount = totalBeforeGST + gstAmount;

  // Apply additional discount if any
  const discountAny = advanceBooking.discount_any ? parseFloat(advanceBooking.discount_any) : 0;
  const finalAmount = totalAmount - discountAny;

  // Calculate balance amount
  const advanceAmount = advanceBooking.advance_amount ? parseFloat(advanceBooking.advance_amount) : 0;
  const balanceAmount = finalAmount - advanceAmount;

  // Update state with calculated values
  setAdvanceBooking((prev) => ({
    ...prev,
    room_with_gst: totalBeforeGST.toFixed(2),
    total_amount: totalAmount.toFixed(2),
    final_amount: finalAmount.toFixed(2),
    balance_amount: balanceAmount.toFixed(2),
  }));

  return {
    totalBeforeGST: totalBeforeGST.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
    finalAmount: finalAmount.toFixed(2),
    balanceAmount: balanceAmount.toFixed(2),
  };
};

export { calculateFinalAdvanceBookingPrice };