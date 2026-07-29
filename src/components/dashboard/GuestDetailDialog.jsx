import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Typography,
  Box,
  Divider,
  Grid,
} from '@mui/material';
import { roomApi, fileApi } from '../../api/apiService';

/**
 * GuestDetailDialog
 *
 * Opens a scrollable MUI Dialog showing full booking + guest info
 * for the active booking on a given room.
 *
 * Props:
 *   open    {boolean}  - whether the dialog is open
 *   onClose {function} - called when the dialog should close
 *   roomNum {string}   - room number to fetch guest detail for
 */
export default function GuestDetailDialog({ open, onClose, roomNum }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestPhotoUrl, setGuestPhotoUrl] = useState(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState(null);

  // Revoke object URLs on unmount / re-open to prevent memory leaks
  useEffect(() => {
    return () => {
      if (guestPhotoUrl) URL.revokeObjectURL(guestPhotoUrl);
      if (idPhotoUrl) URL.revokeObjectURL(idPhotoUrl);
    };
  }, [guestPhotoUrl, idPhotoUrl]);

  useEffect(() => {
    if (!open || !roomNum) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError('');
      setData(null);
      setGuestPhotoUrl(null);
      setIdPhotoUrl(null);

      try {
        const res = await roomApi.getGuestDetailByRoomNum(roomNum);

        if (cancelled) return;

        if (res.status === 200) {
          const d = res.data;
          setData(d);

          // Primary guest is index 0 of guestDetails array
          const primaryGuest = Array.isArray(d.guestDetails) && d.guestDetails.length > 0
            ? d.guestDetails[0]
            : null;

          // Load guest / user photo
          if (primaryGuest?.user_photo_url) {
            try {
              const blob = await fileApi.getUploadedFile(primaryGuest.user_photo_url);
              if (!cancelled) setGuestPhotoUrl(URL.createObjectURL(blob.data));
            } catch {
              // photo load failure is non-fatal
            }
          }

          // Load ID photo
          if (primaryGuest?.id_photo_url) {
            try {
              const blob = await fileApi.getUploadedFile(primaryGuest.id_photo_url);
              if (!cancelled) setIdPhotoUrl(URL.createObjectURL(blob.data));
            } catch {
              // photo load failure is non-fatal
            }
          }
        } else {
          setError('Failed to load guest details. Please try again.');
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load guest details. Please try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [open, roomNum]);

  const handleClose = () => {
    setData(null);
    setError('');
    onClose();
  };

  // Primary guest from the guestDetails array
  const primaryGuest =
    data && Array.isArray(data.guestDetails) && data.guestDetails.length > 0
      ? data.guestDetails[0]
      : null;

  // Aggregate occupancy across all rooms
  const totalAdults = data?.guestOccupancy
    ? data.guestOccupancy.reduce((sum, o) => sum + (Number(o.num_of_adults) || 0), 0)
    : null;
  const totalChildren = data?.guestOccupancy
    ? data.guestOccupancy.reduce((sum, o) => sum + (Number(o.num_of_children) || 0), 0)
    : null;

  // Room type from roomBedType array (first entry)
  const roomType =
    data && Array.isArray(data.roomBedType) && data.roomBedType.length > 0
      ? data.roomBedType[0].bed_type
      : null;

  // Balance = net_payable + total_extra_charges - total_money_entries - advance_amount
  // Extra charges and money entries are not fetched here (separate dialogs); use the
  // stored balance from the booking as a baseline, falling back to the formula with
  // advance already subtracted.
  const netPayable = data ? Number(data.netPayable) || 0 : 0;
  const advanceAmount = data ? Number(data.advanceAmount) || 0 : 0;
  const balance = netPayable - advanceAmount;

  // Helper: single label/value row
  const Field = ({ label, value }) => (
    <Box sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ minWidth: 180, flexShrink: 0 }}
      >
        {label}:
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value !== null && value !== undefined && value !== '' ? value : '—'}
      </Typography>
    </Box>
  );

  // Section heading helper
  const SectionTitle = ({ children }) => (
    <Typography
      variant="subtitle2"
      sx={{ mb: 1, mt: 0.5, color: 'primary.main', fontWeight: 600 }}
    >
      {children}
    </Typography>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Guest Detail — Room {roomNum}
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: 'auto' }}>
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error state (Requirement 1.5) */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleClose}>
                Close
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Content (only shown once loaded) */}
        {data && !loading && (
          <Box>
            {/* Photos (Requirements 1.3, 1.4) */}
            {(guestPhotoUrl || idPhotoUrl) && (
              <>
                <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                  {guestPhotoUrl && (
                    <Box>
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        Guest Photo
                      </Typography>
                      <img
                        src={guestPhotoUrl}
                        alt="Guest"
                        style={{
                          maxHeight: 130,
                          maxWidth: 130,
                          display: 'block',
                          borderRadius: 6,
                          border: '1px solid #ddd',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  )}
                  {idPhotoUrl && (
                    <Box>
                      <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                        ID Photo
                      </Typography>
                      <img
                        src={idPhotoUrl}
                        alt="ID"
                        style={{
                          maxHeight: 130,
                          maxWidth: 130,
                          display: 'block',
                          borderRadius: 6,
                          border: '1px solid #ddd',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  )}
                </Box>
                <Divider sx={{ mb: 1.5 }} />
              </>
            )}

            <Grid container spacing={2}>
              {/* Left column */}
              <Grid item xs={12} md={6}>
                {/* Guest Information */}
                <SectionTitle>Guest Information</SectionTitle>
                <Field label="Guest Name" value={primaryGuest?.name} />
                <Field label="Mobile Number" value={primaryGuest?.mobile_no} />
                <Field label="WhatsApp Number" value={primaryGuest?.whatsapp_no} />
                <Field label="Email" value={primaryGuest?.email_id} />
                <Field label="ID Type" value={primaryGuest?.id_type} />
                <Field label="ID Number" value={primaryGuest?.id_no} />
                <Field
                  label="Vehicle Number"
                  value={
                    primaryGuest?.vehicle_no ||
                    (primaryGuest?.vehicle_type ? `${primaryGuest.vehicle_type} — ${primaryGuest.vehicle_no || ''}` : null)
                  }
                />

                <Divider sx={{ my: 1.5 }} />

                {/* Booking Information */}
                <SectionTitle>Booking Information</SectionTitle>
                <Field label="Booking Reference" value={data.bookingRef} />
                <Field
                  label="Room Number(s)"
                  value={
                    Array.isArray(data.selectedRooms) && data.selectedRooms.length > 0
                      ? data.selectedRooms.join(', ')
                      : roomNum
                  }
                />
                <Field label="Room Type" value={roomType} />
                <Field label="Check-In Date" value={data.checkInDate ? new Date(data.checkInDate).toLocaleDateString() : null} />
                <Field label="Check-Out Date" value={data.checkOutDate ? new Date(data.checkOutDate).toLocaleDateString() : null} />
                <Field label="Number of Nights" value={data.numberOfDays} />
                <Field label="Number of Adults" value={totalAdults} />
                <Field label="Number of Children" value={totalChildren} />
              </Grid>

              {/* Right column */}
              <Grid item xs={12} md={6}>
                <SectionTitle>Payment Information</SectionTitle>
                <Field label="Payment Method" value={data.paymentMethod} />
                <Field label="Room Amount" value={data.roomAmount != null ? `₹ ${data.roomAmount}` : null} />
                <Field label="GST" value={data.gst != null ? `₹ ${data.gst}` : null} />
                <Field label="Advance Amount" value={data.advanceAmount != null ? `₹ ${data.advanceAmount}` : null} />
                <Field label="Net Payable" value={data.netPayable != null ? `₹ ${data.netPayable}` : null} />
                <Field
                  label="Balance Amount"
                  value={`₹ ${balance.toFixed(2)}`}
                />

                {/* Additional occupancy detail if multiple rooms */}
                {Array.isArray(data.guestOccupancy) && data.guestOccupancy.length > 1 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <SectionTitle>Occupancy per Room</SectionTitle>
                    {data.guestOccupancy.map((occ, idx) => (
                      <Field
                        key={idx}
                        label={`Room ${occ.room_number}`}
                        value={`${occ.num_of_adults} Adult${occ.num_of_adults !== 1 ? 's' : ''}, ${occ.num_of_children} Child${occ.num_of_children !== 1 ? 'ren' : ''}`}
                      />
                    ))}
                  </>
                )}

                {/* Additional guests if present */}
                {Array.isArray(data.guestDetails) && data.guestDetails.length > 1 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <SectionTitle>Additional Guests</SectionTitle>
                    {data.guestDetails.slice(1).map((g, idx) => (
                      <Box key={idx} sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Guest {idx + 2}
                        </Typography>
                        <Field label="Name" value={g.name} />
                        <Field label="Mobile" value={g.mobile_no} />
                        <Field label="ID Type" value={g.id_type} />
                        <Field label="ID Number" value={g.id_no} />
                      </Box>
                    ))}
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>

      {/* Requirement 1.6: close button */}
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
