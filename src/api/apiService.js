import axios from "axios";

// const BASE_URL = "https://web.bnbhomes.in/api";
// const BASE_URL = "https://fast-bnbapi.onrender.com";
// const BASE_URL = "https://neat-bevvy-vtpl-testing-b9d1ac69.koyeb.app";
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// const fileApiAxios = axios.create({
//   baseURL: "https://web.bnbhomes.in"
// });

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    // For 409 and other known errors, return the error response so callers can check status
    if (error.response) {
      return error.response;
    }
    return Promise.reject(error);
  }
);

// fileApiAxios.interceptors.response.use(
//   response => response,
//   error => error
// );

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response;
  },

  signup: async (userData) => {
    const response = await api.post('/register', userData);
    return response;
  },
};

export const roomApi = {
  getAllRomms: async () => {
    const response = await api.get("/rooms");
    return response;
  },

  getSingleRomm: async () => {
    const response = await api.get();
    return response;
  },

  updateRoomStatus: async (room_number, updatedStatus) => {
    const response = await api.patch(`/rooms/${room_number}`, updatedStatus);
    return response;
  },

  getGuestDetailByRoomNum: async (roomNum) => {
    const response = await api.get(`/bookings/guestDetail/${roomNum}`);
    return response;
  },

  updateRoomStatusToStayBack: async (roomNum) => {
    const response = await api.patch(`/bookings/stayback/${roomNum}`);
    return response;
  },

  updateRoomStatusToOverStay: async (roomNum) => {
    const response = await api.patch(`/bookings/overstay/${roomNum}`);
    return response;
  }
}

export const roomBookingApi = {
  submitCheckIn: async (checkInData) => {
    const response = await api.post("/bookings", checkInData);
    return response;
  },

  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response;
  },

  getCheckoutData: async (roomNum) => {
    const response = await api.get(`/bookings/getCheckout/${roomNum}`);
    return response;
  },

  doCheckOut: async (bookingId) => {
    const response = await api.patch(`/bookings/doCheckout/${bookingId}`);
    return response;
  },

  getExtraCharges: async (bookingId) => api.get(`/bookings/${bookingId}/extraCharges`),
  addExtraCharge: async (bookingId, data) => api.post(`/bookings/${bookingId}/extraCharges`, data),
  getMoneyEntries: async (bookingId) => api.get(`/bookings/${bookingId}/moneyEntries`),
  addMoneyEntry: async (bookingId, data) => api.post(`/bookings/${bookingId}/moneyEntries`, data),
  extendBooking: async (bookingId, data) => api.patch(`/bookings/${bookingId}/extend`, data),
  roomShift: async (bookingId, data) => api.post(`/bookings/${bookingId}/roomShift`, data),
  addGuest: async (bookingId, data) => api.post(`/bookings/${bookingId}/addGuest`, data),
}

export const fileApi = {
  imageUpload: async (fileData) => {
    const response = await axios.post(`${BASE_URL}/upload`, fileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  },

  getUploadedFile: async (filePath) => {
    // If it's already a full URL (e.g. Cloudinary), fetch it directly
    if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
      const response = await axios.get(filePath, { responseType: "blob" });
      return response;
    }
    // Legacy: filename only — proxy through our backend
    const cleanPath = filePath ? filePath.replace(/^\/+/, '') : filePath;
    const response = await axios.get(`${BASE_URL}/files?path=${cleanPath}`, {
      responseType: "blob"
    });
    return response;
  }
}

export const addtionalApi = {
  getGuestDataByBookingId: async (bookingId) => {
    const response = await api.get(`/bookings/guestData/${bookingId}`);
    return response;
  },

  getAllGuestData: async () => {
    const response = await api.get("/all/bookingData");
    return response;
  },

  getAllCalendarData: async () => {
    const response = await api.get("/all/calendarData");
    return response;
  },

  getAdvanceBookingReference: async () => {
    const response = await api.get("/latest/advanceBooking");
    return response;
  },

  getCheckinBookingReference: async () => {
    const response = await api.get("/latest/checkinBooking");
    return response;
  },

  lookupBookingRef: async (ref) => {
    const response = await api.get("/lookup/bookingRef", { params: { ref } });
    return response;
  },

  getAdvanceBookingById: async (id) => {
    const response = await api.get(`/advanceBooking/${id}`);
    return response;
  },

  updateAdvanceBooking: async (id, data) => {
    const ab = data.advanceBooking != null ? data.advanceBooking : data;
    const rooms = data.rooms != null ? data.rooms : [];
    const primaryRoom = rooms[0] != null ? rooms[0] : {};
    const guestEmail = (ab.email_id != null ? ab.email_id : ab.guest_email) || null;
    const bookingRef = (ab.advance_booking_ref != null ? ab.advance_booking_ref : ab.booking_ref) || null;
    const previousRef = (ab.prev_booking_ref != null ? ab.prev_booking_ref : ab.previous_ref) || null;
    const roomType = primaryRoom.room_type != null ? primaryRoom.room_type : (ab.room_type || '');
    const nights = Number(ab.num_of_nights != null ? ab.num_of_nights : ab.number_of_nights) || 1;
    const rate = Number(ab.room_with_gst != null ? ab.room_with_gst : ab.rate_per_room) || 0;
    const discount = Number(ab.discount_any != null ? ab.discount_any : ab.discount_amt) || 0;
    const checkIn = ab.checkin_date
      ? (typeof ab.checkin_date === 'string' ? ab.checkin_date : ab.checkin_date.format('YYYY-MM-DD'))
      : (ab.check_in_date || '');
    const checkOut = ab.checkout_date
      ? (typeof ab.checkout_date === 'string' ? ab.checkout_date : ab.checkout_date.format('YYYY-MM-DD'))
      : (ab.check_out_date || '');
    const numRooms = rooms.length > 0
      ? rooms.reduce((s, r) => s + (Number(r.num_of_rooms) || 0), 0)
      : (Number(ab.number_of_rooms) || 1);
    const payload = {
      guestName:      ab.guest_name     || '',
      guestMobile:    String(ab.mobile_num  || ab.guest_mobile  || ''),
      guestWhatsapp:  String(ab.whatsapp_num || ab.guest_whatsapp || ''),
      guestEmail,
      guestType:      ab.guest_type     || '',
      corporateName:  ab.corporate_name || null,
      checkInDate:    checkIn,
      checkOutDate:   checkOut,
      numberOfNights: nights,
      roomType,
      numberOfRooms:  numRooms,
      ratePerRoom:    rate,
      totalAmount:    Number(ab.total_amount)   || 0,
      discountAmt:    discount,
      finalAmount:    Number(ab.final_amount)   || 0,
      advanceAmount:  Number(ab.advance_amount) || 0,
      paidVia:        ab.paid_via        || '',
      paidReference:  ab.paid_reference  || null,
      balanceAmount:  Number(ab.balance_amount) || 0,
      remarks:        ab.remarks         || null,
      bookingRef,
      previousRef,
    };
    const response = await api.put(`/advanceBooking/${id}`, payload);
    return response;
  },

  advanceBookingCreate: async (data) => {
    const ab = data.advanceBooking;
    const rooms = data.rooms != null ? data.rooms : [];
    const primaryRoom = rooms[0] != null ? rooms[0] : {};
    const payload = {
      guestName:       ab.guest_name        ?? '',
      guestMobile:     String(ab.mobile_num  ?? ''),
      guestWhatsapp:   String(ab.whatsapp_num ?? ''),
      guestEmail:      ab.email_id          || null,
      guestType:       ab.guest_type        ?? '',
      corporateName:   ab.corporate_name    || null,
      checkInDate:     ab.checkin_date  ? (typeof ab.checkin_date === 'string' ? ab.checkin_date : ab.checkin_date.format('YYYY-MM-DD')) : '',
      checkOutDate:    ab.checkout_date ? (typeof ab.checkout_date === 'string' ? ab.checkout_date : ab.checkout_date.format('YYYY-MM-DD')) : '',
      numberOfNights:  Number(ab.num_of_nights) || 1,
      roomType:        primaryRoom.room_type ?? '',
      numberOfRooms:   rooms.reduce((s, r) => s + (Number(r.num_of_rooms) || 0), 0) || Number(primaryRoom.num_of_rooms) || 1,
      ratePerRoom:     Number(ab.room_with_gst) || 0,
      totalAmount:     Number(ab.total_amount)  || 0,
      discountAmt:     Number(ab.discount_any)  || 0,
      finalAmount:     Number(ab.final_amount)  || 0,
      advanceAmount:   Number(ab.advance_amount) || 0,
      paidVia:         ab.paid_via         ?? '',
      paidReference:   ab.paid_reference   || null,
      balanceAmount:   Number(ab.balance_amount) || 0,
      remarks:         ab.remarks          || null,
      bookingRef:      ab.advance_booking_ref || null,
      previousRef:     ab.prev_booking_ref || null,
    };
    const response = await api.post('/advanceBooking', payload);
    return response;
  },

  getAdvanceBookingByRef: async (booking_ref) => {
    const response = await api.get("/get/advanceBooking", {
      params: { advance_booking_ref: booking_ref }
    });
    return response;
  },

  getAdvanceCalendar: async () => {
    const response = await api.get("/advanceCalendar");
    return response;
  },

  getAllAdvanceBookings: async () => {
    const response = await api.get("/all/advanceBookings");
    return response;
  }
}

export const staffApi = {
  addStaff: async (data) => api.post('/staff', data),
  getStaff: function(type) { return api.get('/staff', type ? { params: { staff_type: type } } : {}); },
  updateStaff: async (id, data) => api.put('/staff/' + id, data),
  deleteStaff: async (id) => api.delete('/staff/' + id),
  addDuty: async (data) => api.post('/staff/duty', data),
  getDuties: function(month, staffId) { return api.get('/staff/duty', { params: { month: month, staff_id: staffId } }); },
  addSalary: async (data) => api.post('/staff/salary', data),
  getSalaries: function(month, staffId) { return api.get('/staff/salary', { params: { month: month, staff_id: staffId } }); },
  getPayslipAlert: async () => api.get('/staff/payslipAlert'),
  addCleanerSalary: async (data) => api.post('/staff/cleanerSalary', data),
  getCleanerSalaries: async () => api.get('/staff/cleanerSalary'),
}

export const accountApi = {  addExpense: async (data) => api.post('/account/expenses', data),
  getExpenses: function(startDate, endDate) { return api.get('/account/expenses', { params: { start_date: startDate, end_date: endDate } }); },
  deleteExpense: async (id) => api.delete('/account/expenses/' + id),
  getPendingPayments: async () => api.get('/account/pendingPayments'),
  addBalance: async (data) => api.post('/account/balances', data),
  getBalances: function(bankName) { return api.get('/account/balances', bankName ? { params: { bank_name: bankName } } : {}); },
  addCreditCard: async (data) => api.post('/account/creditCards', data),
  getCreditCards: async () => api.get('/account/creditCards'),
  addGuestReturn: async (data) => api.post('/account/guestReturns', data),
  getGuestReturns: async () => api.get('/account/guestReturns'),
  getTransactionReport: function(startDate, endDate) { return api.get('/account/transactionReport', { params: { start_date: startDate, end_date: endDate } }); },
}

export const settingsApi = {
  getItems: function(category) { return api.get('/settings/' + category); },
  addItem: async (data) => api.post('/settings', data),
  deleteItem: async (id) => api.delete('/settings/' + id),
  // User management
  getUsers: async () => api.get('/users'),
  createUser: async (data) => api.post('/register', data),
  deleteUser: async (id) => api.delete('/users/' + id),
}
