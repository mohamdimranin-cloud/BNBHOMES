import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { toast } from 'react-toastify';
import { roomApi, roomBookingApi } from '../../api/apiService';

/**
 * ExtensionDialog
 *
 * Opens a MUI Dialog for extending a guest's checkout date on an active booking.
 * Resolves the bookingId and current checkOutDate from roomNum via
 * GET /bookings/guestDetail/{roomNum}.
 *
 * Props:
 *   open      {boolean}  - whether the dialog is open
 *   onClose   {function} - called when the dialog should close
 *   roomNum   {string}   - room number used to resolve the active booking
 *   onSuccess {function} - called after a successful extension submission
 */
export default function ExtensionDialog({ open, onClose, roomNum, onSuccess }) {
  const [bookingId, setBookingId] = useState(null);
  const [currentCheckOutDate, setCurrentCheckOutDate] = useState('');
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [newDate, setNewDate] = useState('');
  const [dateError, setDateError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch bookingId and current checkOutDate when dialog opens
  useEffect(() => {
    if (!open || !roomNum) return;

    let cancelled = false;

    const fetchBookingDetails = async () => {
      setLoadingBooking(true);
      setBookingError('');
      setBookingId(null);
      setCurrentCheckOutDate('');

      try {
        const res = await roomApi.getGuestDetailByRoomNum(roomNum);
        if (cancelled) return;

        if (res.status === 200) {
          const data = res.data ?? {};

          // Resolve bookingId — try bookingId first, fall back to id
          const id = data.bookingId ?? data.id ?? null;
          if (!id) {
            setBookingError('Could not determine booking ID for this room.');
            return;
          }
          setBookingId(id);

          // Resolve checkOutDate — API may use checkOutDate or check_out_date
          const rawDate = data.checkOutDate ?? data.check_out_date ?? '';
          // Normalise to YYYY-MM-DD (strip time portion if present)
          const normalised = rawDate ? rawDate.toString().slice(0, 10) : '';
          setCurrentCheckOutDate(normalised);
          // Pre-populate the date picker with the current checkout date
          setNewDate(normalised);
        } else {
          setBookingError('Failed to load booking details. Please try again.');
        }
      } catch {
        if (!cancelled) {
          setBookingError('Failed to load booking details. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingBooking(false);
      }
    };

    fetchBookingDetails();

    return () => {
      cancelled = true;
    };
  }, [open, roomNum]);

  // Reset all form state when dialog closes
  const handleClose = () => {
    setBookingId(null);
    setCurrentCheckOutDate('');
    setLoadingBooking(false);
    setBookingError('');
    setNewDate('');
    setDateError('');
    setSubmitting(false);
    setSubmitError('');
    onClose();
  };

  // Client-side validation: new date must be strictly after current checkout date
  const validate = () => {
    if (!newDate) {
      setDateError('New check-out date is required.');
      return false;
    }

    if (newDate <= currentCheckOutDate) {
      setDateError('New check-out date must be later than the current check-out date.');
      return false;
    }

    setDateError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await roomBookingApi.extendBooking(bookingId, {
        newCheckOutDate: newDate,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Booking extended');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setSubmitError('Failed to extend booking. Please try again.');
      }
    } catch {
      setSubmitError('Failed to extend booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingBooking || submitting;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Extend Booking — Room {roomNum}
      </DialogTitle>

      <DialogContent dividers>
        {/* Booking resolution loading */}
        {loadingBooking && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Booking resolution error */}
        {bookingError && !loadingBooking && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bookingError}
          </Alert>
        )}

        {/* Submission error */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* Form — only rendered when booking is resolved */}
        {!loadingBooking && !bookingError && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {currentCheckOutDate && (
              <Typography variant="body2" color="text.secondary">
                Current check-out date: <strong>{currentCheckOutDate}</strong>
              </Typography>
            )}

            <TextField
              label="New Check-Out Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              error={Boolean(dateError)}
              helperText={dateError || 'Must be later than the current check-out date'}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: currentCheckOutDate || undefined }}
              disabled={isLoading}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined" disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading || Boolean(bookingError) || !bookingId}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? 'Saving…' : 'Extend Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
