import { Backdrop, Button, CircularProgress, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from "react-toastify";
import { addtionalApi, fileApi, roomBookingApi } from '../../../api/apiService';

// Reusable row for the detail tables
const Row = ({ label, value }) => (
  <tr className="border-b last:border-0">
    <td className="py-2 pr-6 text-gray-500 font-medium whitespace-nowrap w-48">{label}</td>
    <td className="py-2 text-gray-800 font-semibold break-all">{value ?? '-'}</td>
  </tr>
);

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" fontWeight={700} className="text-primary mt-6 mb-2 border-b pb-1">
    {children}
  </Typography>
);

const GuestData = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();

  const [isDataLoading, setIsDataLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [extraCharges, setExtraCharges] = useState([]);
  const [moneyEntries, setMoneyEntries] = useState([]);
  const [guestPhotos, setGuestPhotos] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsDataLoading(true);
        const res = await addtionalApi.getGuestDataByBookingId(booking_id);

        if (res.status === 200) {
          const data = res.data;
          const bookingObj = Array.isArray(data) ? data[0] : data;
          if (!bookingObj) {
            toast.warn("No guest data found for this booking.");
            setIsDataLoading(false);
            return;
          }
          setBooking(bookingObj);

          // Fetch extra charges + money entries in parallel
          const [ecRes, meRes] = await Promise.all([
            roomBookingApi.getExtraCharges(booking_id).catch(() => null),
            roomBookingApi.getMoneyEntries(booking_id).catch(() => null),
          ]);
          if (ecRes?.status === 200) setExtraCharges(ecRes.data ?? []);
          if (meRes?.status === 200) setMoneyEntries(meRes.data ?? []);

          // Fetch guest photos
          const guests = bookingObj.guestDetails ?? [];
          const photoMap = {};
          await Promise.all(guests.map(async (g, idx) => {
            const url = g.guest_photo_url || g.photo_url;
            if (url) {
              try {
                const pr = await fileApi.getUploadedFile(url);
                if (pr.status === 200) {
                  photoMap[idx] = URL.createObjectURL(pr.data);
                }
              } catch (_) {}
            }
          }));
          setGuestPhotos(photoMap);
        } else {
          toast.error("Failed to load guest data.");
        }
      } catch (error) {
        console.error("Guest Data fetch error:", error);
        toast.error("Guest Data fetch error");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchAll();
  }, [booking_id]);

  const totalExtraCharges = extraCharges.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const totalMoneyEntries = moneyEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const finalBalance = booking
    ? (parseFloat(booking.netPayable) || 0) + totalExtraCharges - totalMoneyEntries - (parseFloat(booking.advanceAmount) || 0)
    : 0;

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
          <Typography className="text-white" fontSize={25} fontWeight={500}>Guest Data</Typography>
          <Button variant="contained" color="primary" sx={{ textTransform: "none" }} onClick={() => navigate("/guest-data")}>
            Go Back
          </Button>
        </div>
      </div>

      <Paper sx={{ borderRadius: 2, padding: 3 }}>
        {booking ? (
          <div className="max-w-5xl mx-auto">

            {/* ── Booking Info ── */}
            <SectionTitle>Booking Information</SectionTitle>
            <table className="w-full text-sm">
              <tbody>
                <Row label="Booking ID"       value={booking.id} />
                <Row label="Booking Ref"      value={booking.bookingRef} />
                <Row label="Check-in Date"    value={booking.checkInDate} />
                <Row label="Check-out Date"   value={booking.checkOutDate} />
                <Row label="Check-in Time"    value={booking.checkInTime} />
                <Row label="Check-out Time"   value={booking.checkOutTime} />
                <Row label="Number of Nights" value={booking.numberOfDays} />
                <Row label="Number of Rooms"  value={booking.numOfRooms} />
                <Row label="Room(s)"          value={(booking.selectedRooms ?? []).join(', ')} />
                <Row label="Guest Type"       value={booking.guestType} />
                <Row label="Corporate Name"   value={booking.corporateName} />
                <Row label="Breakfast"        value={booking.breakfast} />
              </tbody>
            </table>

            {/* ── Guest Details ── */}
            <SectionTitle>Guest Details</SectionTitle>
            {(booking.guestDetails ?? []).length === 0 ? (
              <p className="text-gray-400 text-sm">No guests on record.</p>
            ) : (
              (booking.guestDetails ?? []).map((g, idx) => (
                <div key={idx} className="flex gap-6 mb-4 border rounded-lg p-4">
                  {guestPhotos[idx] && (
                    <img src={guestPhotos[idx]} alt="Guest" className="h-28 w-28 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <table className="w-full text-sm">
                    <tbody>
                      <Row label="Name"         value={g.name} />
                      <Row label="Mobile"       value={g.mobile_no} />
                      <Row label="WhatsApp"     value={g.whatsapp_no} />
                      <Row label="Email"        value={g.email_id} />
                      <Row label="ID Type"      value={g.id_type} />
                      <Row label="ID Number"    value={g.id_no} />
                      <Row label="Vehicle No."  value={g.vehicle_no} />
                    </tbody>
                  </table>
                </div>
              ))
            )}

            {/* ── Room Occupancy ── */}
            {(booking.guestOccupancy ?? []).length > 0 && (
              <>
                <SectionTitle>Room Occupancy</SectionTitle>
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-2 px-4">Room</th>
                      <th className="text-left py-2 px-4">Adults</th>
                      <th className="text-left py-2 px-4">Children</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(booking.guestOccupancy ?? []).map((o, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-4">{o.room_number}</td>
                        <td className="py-2 px-4">{o.num_of_adults}</td>
                        <td className="py-2 px-4">{o.num_of_children}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* ── Payment Summary ── */}
            <SectionTitle>Payment Summary</SectionTitle>
            <table className="w-full text-sm">
              <tbody>
                <Row label="Room Amount"     value={`₹ ${booking.roomAmount}`} />
                <Row label="GST"             value={`₹ ${booking.gst}`} />
                <Row label="Discount"        value={booking.anyDiscountAmt ? `₹ ${booking.anyDiscountAmt}` : '-'} />
                <Row label="Net Payable"     value={`₹ ${booking.netPayable}`} />
                <Row label="Advance Paid"    value={`₹ ${booking.advanceAmount}`} />
                <Row label="Payment Method"  value={booking.paymentMethod} />
                <tr className="border-b">
                  <td className="py-2 pr-6 text-gray-500 font-medium whitespace-nowrap w-48">Final Balance</td>
                  <td className={`py-2 font-bold text-lg ${finalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹ {finalBalance.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Extra Charges ── */}
            <SectionTitle>Extra Charges</SectionTitle>
            {extraCharges.length === 0 ? (
              <p className="text-gray-400 text-sm">None</p>
            ) : (
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-2 px-4">#</th>
                    <th className="text-left py-2 px-4">Reason</th>
                    <th className="text-right py-2 px-4">Amount</th>
                    <th className="text-left py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {extraCharges.map((c, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-4">{idx + 1}</td>
                      <td className="py-2 px-4">{c.reason ?? '-'}</td>
                      <td className="py-2 px-4 text-right">₹ {parseFloat(c.amount ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-4 text-gray-500">{c.created_at ?? '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-50 font-semibold">
                    <td className="py-2 px-4" colSpan={2}>Total</td>
                    <td className="py-2 px-4 text-right">₹ {totalExtraCharges.toFixed(2)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}

            {/* ── Money Entries (Payments Received) ── */}
            <SectionTitle>Payments Received</SectionTitle>
            {moneyEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">None</p>
            ) : (
              <table className="w-full text-sm border rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left py-2 px-4">#</th>
                    <th className="text-right py-2 px-4">Amount</th>
                    <th className="text-left py-2 px-4">Payment Method</th>
                    <th className="text-left py-2 px-4">Reference No.</th>
                    <th className="text-left py-2 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {moneyEntries.map((e, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-4">{idx + 1}</td>
                      <td className="py-2 px-4 text-right">₹ {parseFloat(e.amount ?? 0).toFixed(2)}</td>
                      <td className="py-2 px-4">{e.payment_method ?? e.paymentMethod ?? '-'}</td>
                      <td className="py-2 px-4">{e.reference_number ?? e.reference_no ?? e.referenceNo ?? '-'}</td>
                      <td className="py-2 px-4 text-gray-500">{e.created_at ?? '-'}</td>
                    </tr>
                  ))}
                  <tr className="border-t bg-gray-50 font-semibold">
                    <td className="py-2 px-4">Total</td>
                    <td className="py-2 px-4 text-right">₹ {totalMoneyEntries.toFixed(2)}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            )}

          </div>
        ) : (
          <div className="text-center text-gray-500 py-10">No Data Found</div>
        )}
      </Paper>
    </>
  );
};

export default GuestData;
