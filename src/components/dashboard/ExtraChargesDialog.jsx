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
} from '@mui/material';
import { toast } from 'react-toastify';
import { roomApi, roomBookingApi } from '../../api/apiService';

/**
 * ExtraChargesDialog
 *
 * Opens a MUI Dialog for recording an extra charge against an active booking.
 * Resolves the bookingId from roomNum via GET /bookings/guestDetail/{roomNum}.
 *
 * Props:
 *   open      {boolean}  - whether the dialog is open
 *   onClose   {function} - called when the dialog should close
 *   roomNum   {string}   - room number used to resolve the active booking
 *   onSuccess {function} - called after a successful extra charge submission
 */
export default function ExtraChargesDialog({ open, onClose, roomNum, onSuccess }) {
  const [bookingId, setBookingId] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [amountError, setAmountError] = useState('');
  const [reasonError, setReasonError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch bookingId when dialog opens
  useEffect(() => {
    if (!open || !roomNum) return;

    let cancelled = false;

    const fetchBookingId = async () => {
      setLoadingBooking(true);
      setBookingError('');
      setBookingId(null);

      try {
        const res = await roomApi.getGuestDetailByRoomNum(roomNum);
        if (cancelled) return;

        if (res.status === 200) {
          // bookingId is available at res.data.bookingId (or res.data.id as fallback)
          const id = res.data?.bookingId ?? res.data?.id ?? null;
          if (id) {
            setBookingId(id);
          } else {
            setBookingError('Could not determine booking ID for this room.');
          }
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

    fetchBookingId();

    return () => {
      cancelled = true;
    };
  }, [open, roomNum]);

  // Reset all form state when dialog closes
  const handleClose = () => {
    setBookingId(null);
    setLoadingBooking(false);
    setBookingError('');
    setAmount('');
    setReason('');
    setAmountError('');
    setReasonError('');
    setSubmitting(false);
    setSubmitError('');
    onClose();
  };

  // Client-side validation
  const validate = () => {
    let valid = true;

    const parsedAmount = parseFloat(amount);
    if (amount.trim() === '' || isNaN(parsedAmount)) {
      setAmountError('Amount is required and must be a number.');
      valid = false;
    } else if (parsedAmount <= 0) {
      setAmountError('Amount must be a positive number.');
      valid = false;
    } else {
      setAmountError('');
    }

    if (reason.trim() === '') {
      setReasonError('Reason is required.');
      valid = false;
    } else {
      setReasonError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await roomBookingApi.addExtraCharge(bookingId, {
        amount: parseFloat(amount),
        reason: reason.trim(),
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Extra charge added');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setSubmitError('Failed to add extra charge. Please try again.');
      }
    } catch {
      setSubmitError('Failed to add extra charge. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingBooking || submitting;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Extra Charges — Room {roomNum}
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
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={Boolean(amountError)}
              helperText={amountError}
              required
              fullWidth
              inputProps={{ min: 0, step: 'any' }}
              disabled={isLoading}
            />
            <TextField
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={Boolean(reasonError)}
              helperText={reasonError}
              required
              fullWidth
              multiline
              rows={3}
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
          {submitting ? 'Saving…' : 'Add Charge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
