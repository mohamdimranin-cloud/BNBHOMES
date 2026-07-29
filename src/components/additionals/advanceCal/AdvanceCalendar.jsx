import React, { useEffect, useState, useMemo } from "react";
import {
  addMonths, subMonths, format, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth,
  isToday, isSameDay, parseISO, isWithinInterval,
} from "date-fns";
import {
  Backdrop, Button, CircularProgress, Dialog, DialogContent,
  DialogTitle, Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { addtionalApi } from "../../../api/apiService";
import AdvanceBookingTable from "./AdvanceBookingTable";

const ROOM_COLORS = [
  "#1976d2", "#388e3c", "#f57c00", "#7b1fa2",
  "#c62828", "#00796b", "#5d4037", "#0288d1",
];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AdvanceCalendar = () => {
  const navigate = useNavigate();
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [calendarData, setCalendarData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        setIsDataLoading(true);
        const res = await addtionalApi.getAdvanceCalendar();
        if (res.status === 200) setCalendarData(res.data || []);
      } catch (e) {
        console.error("Calendar fetch error:", e);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  // Color map per room type
  const roomTypeColors = useMemo(() => {
    const types = [...new Set(calendarData.map((b) => b.room_type).filter(Boolean))];
    const map = {};
    types.forEach((t, i) => { map[t] = ROOM_COLORS[i % ROOM_COLORS.length]; });
    return map;
  }, [calendarData]);

  // All calendar grid days (6 weeks)
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get bookings that fall on a given day
  const getBookingsForDay = (day) => {
    return calendarData.filter((b) => {
      if (!b.check_in_date || !b.check_out_date) return false;
      try {
        const start = parseISO(b.check_in_date);
        const end = parseISO(b.check_out_date);
        return isWithinInterval(day, { start, end }) || isSameDay(day, start);
      } catch (_) { return false; }
    });
  };

  const booking = selectedBooking;

  return (
    <>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isDataLoading}>
        <div className="flex items-center justify-center gap-4">
          <CircularProgress />
          <span className="text-blue-500 text-xl font-bold">Loading...</span>
        </div>
      </Backdrop>

      {/* Header */}
      <div className="bg-white my-2 px-5 py-4 rounded-lg shadow">
        <div className="bg-primary w-full rounded-lg px-10 py-5 flex items-center justify-between">
          <Typography className="text-white" fontSize={25} fontWeight={500}>
            Advance Calendar
          </Typography>
          <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={() => navigate("/")}>
            Go Back
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="contained" color="secondary" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            ← Previous
          </Button>
          <Typography variant="h6" fontWeight={700}>
            {format(currentMonth, "MMMM yyyy")}
          </Typography>
          <Button variant="contained" color="secondary" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            Next →
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-sm font-semibold text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l">
          {calendarDays.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={format(day, "yyyy-MM-dd")}
                className={`border-b border-r min-h-[90px] p-1 ${inMonth ? "bg-white" : "bg-gray-50"}`}
              >
                {/* Date number */}
                <div className={`text-right text-sm font-medium mb-1 w-7 h-7 rounded-full flex items-center justify-center ml-auto
                  ${today ? "bg-primary text-white" : inMonth ? "text-gray-800" : "text-gray-400"}`}>
                  {format(day, "d")}
                </div>

                {/* Booking bars */}
                <div className="flex flex-col gap-[2px]">
                  {dayBookings.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="rounded text-white text-[10px] px-1 py-[1px] truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: roomTypeColors[b.room_type] || "#1976d2" }}
                      onClick={() => setSelectedBooking(b)}
                      title={`${b.guest_name} — ${b.room_type} (${b.check_in_date} → ${b.check_out_date})`}
                    >
                      {b.guest_name || "Guest"} · {b.room_type}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-gray-500 pl-1">+{dayBookings.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        {Object.keys(roomTypeColors).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3 px-1">
            {Object.entries(roomTypeColors).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1 text-xs text-gray-600">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                {type}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Booking detail dialog */}
      {booking && (
        <Dialog open={Boolean(selectedBooking)} onClose={() => setSelectedBooking(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: "primary.main", color: "white" }}>
            Booking Details
          </DialogTitle>
          <DialogContent className="mt-3 pt-3">
            <table className="w-full text-sm mt-2">
              <tbody>
                {[
                  ["Booking Ref",   booking.booking_ref],
                  ["Guest Name",    booking.guest_name],
                  ["Mobile",        booking.guest_mobile],
                  ["Guest Type",    booking.guest_type],
                  ["Check-in",      booking.check_in_date],
                  ["Check-out",     booking.check_out_date],
                  ["Nights",        booking.number_of_nights],
                  ["Room Type",     booking.room_type],
                  ["Rooms",         booking.number_of_rooms],
                  ["Final Amount",  booking.final_amount ? `₹ ${booking.final_amount}` : null],
                  ["Advance Paid",  booking.advance_amount ? `₹ ${booking.advance_amount}` : null],
                  ["Balance",       booking.balance_amount ? `₹ ${booking.balance_amount}` : null],
                  ["Status",        booking.status],
                  ["Remarks",       booking.remarks],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <tr key={label} className="border-b">
                      <td className="py-1 pr-4 text-gray-500 w-32">{label}</td>
                      <td className="py-1 font-medium">{value}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end">
              <Button variant="outlined" onClick={() => setSelectedBooking(null)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AdvanceBookingTable />
    </>
  );
};

export default AdvanceCalendar;
