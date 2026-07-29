import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { toast } from 'react-toastify';
import { roomApi, roomBookingApi } from '../../api/apiService';

/**
 * MoneyEntryDialog
 *
 * Opens a MUI Dialog for recording a mid-stay payment against an active booking.
 * Resolves the bookingId from roomNum via GET /bookings/guestDetail/{roomNum}.
 *
 * Props:
 *   open      {boolean}  - whether the dialog is open
 *   onClose   {function} - called when the dialog should close
 *   roomNum   {string}   - room number used to resolve the active booking
 *   onSuccess {function} - called after a successful money entry submission
 */
export default function MoneyEntryDialog({ open, onClose, roomNum, onSuccess }) {
  const [bookingId, setBookingId] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [amountError, setAmountError] = useState('');
  const [paymentMethodError, setPaymentMethodError] = useState('');

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
    setPaymentMethod('');
    setRefNumber('');
    setAmountError('');
    setPaymentMethodError('');
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

    if (!paymentMethod) {
      setPaymentMethodError('Payment method is required.');
      valid = false;
    } else {
      setPaymentMethodError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await roomBookingApi.addMoneyEntry(bookingId, {
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        reference_number: refNumber.trim() || null,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Payment recorded');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setSubmitError('Failed to record payment. Please try again.');
      }
    } catch {
      setSubmitError('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingBooking || submitting;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Money Entry — Room {roomNum}
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

            <FormControl fullWidth required error={Boolean(paymentMethodError)} disabled={isLoading}>
              <InputLabel id="payment-method-label">Payment Method</InputLabel>
              <Select
                labelId="payment-method-label"
                value={paymentMethod}
                label="Payment Method"
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              </Select>
              {paymentMethodError && (
                <FormHelperText>{paymentMethodError}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Reference Number"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              fullWidth
              disabled={isLoading}
              placeholder="Optional"
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
          {submitting ? 'Saving…' : 'Record Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
