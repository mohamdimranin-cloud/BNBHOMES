import React, { useState, useEffect, useRef } from 'react';
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
import { roomApi, roomBookingApi, fileApi } from '../../api/apiService';

/**
 * AddGuestDialog
 *
 * Opens a MUI Dialog for adding a new guest to an active booking.
 * Resolves the bookingId from roomNum via GET /bookings/guestDetail/{roomNum}.
 * On submit: optionally uploads ID photo, calls addGuest, then addExtraCharge
 * with { amount: 300, reason: "Extra Person Charge" }.
 *
 * Props:
 *   open      {boolean}  - whether the dialog is open
 *   onClose   {function} - called when the dialog should close
 *   roomNum   {string}   - room number used to resolve the active booking
 *   onSuccess {function} - called after a successful guest addition
 */
export default function AddGuestDialog({ open, onClose, roomNum, onSuccess }) {
  // Booking resolution state
  const [bookingId, setBookingId] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Required fields
  const [guestName, setGuestName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [idType, setIdType] = useState('');
  const [idNo, setIdNo] = useState('');

  // Optional fields
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');

  // Validation errors
  const [guestNameError, setGuestNameError] = useState('');
  const [mobileNoError, setMobileNoError] = useState('');
  const [idTypeError, setIdTypeError] = useState('');
  const [idNoError, setIdNoError] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);

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
    setGuestName('');
    setMobileNo('');
    setIdType('');
    setIdNo('');
    setWhatsapp('');
    setEmail('');
    setPhotoFile(null);
    setPhotoFileName('');
    setGuestNameError('');
    setMobileNoError('');
    setIdTypeError('');
    setIdNoError('');
    setSubmitting(false);
    setSubmitError('');
    onClose();
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setPhotoFileName(file ? file.name : '');
    // Reset input so selecting the same file again triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Client-side validation
  const validate = () => {
    let valid = true;

    if (guestName.trim() === '') {
      setGuestNameError('Guest Name is required.');
      valid = false;
    } else {
      setGuestNameError('');
    }

    if (mobileNo.trim() === '') {
      setMobileNoError('Mobile Number is required.');
      valid = false;
    } else {
      setMobileNoError('');
    }

    if (idType === '') {
      setIdTypeError('ID Type is required.');
      valid = false;
    } else {
      setIdTypeError('');
    }

    if (idNo.trim() === '') {
      setIdNoError('ID Number is required.');
      valid = false;
    } else {
      setIdNoError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      // Step 1: Upload photo if present
      let idPhotoUrl = null;
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fileApi.imageUpload(formData);
        if (uploadRes.status === 200 || uploadRes.status === 201) {
          idPhotoUrl = uploadRes.data?.file_path ?? null;
        } else {
          setSubmitError('Failed to upload ID photo. Please try again.');
          return;
        }
      }

      // Step 2: Add guest
      const guestRes = await roomBookingApi.addGuest(bookingId, {
        name: guestName.trim(),
        mobileNo: mobileNo.trim(),
        idType,
        idNo: idNo.trim(),
        whatsappNo: whatsapp.trim() || null,
        emailID: email.trim() || null,
        idPhotoUrl: idPhotoUrl || null,
      });

      if (guestRes.status !== 200 && guestRes.status !== 201) {
        setSubmitError('Failed to add guest. Please try again.');
        return;
      }

      // Step 3: Auto-charge ₹300 extra person charge
      const chargeRes = await roomBookingApi.addExtraCharge(bookingId, {
        amount: 300,
        reason: 'Extra Person Charge',
      });

      if (chargeRes.status !== 200 && chargeRes.status !== 201) {
        setSubmitError('Guest was added but failed to record the ₹300 extra person charge. Please add it manually.');
        return;
      }

      // Step 4: Full success
      toast.success('Guest added and ₹300 charged');
      if (onSuccess) onSuccess();
      handleClose();
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingBooking || submitting;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Add Guest — Room {roomNum}
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
            {/* Guest Name */}
            <TextField
              label="Guest Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              error={Boolean(guestNameError)}
              helperText={guestNameError}
              required
              fullWidth
              disabled={isLoading}
            />

            {/* Mobile Number */}
            <TextField
              label="Mobile Number"
              value={mobileNo}
              onChange={(e) => setMobileNo(e.target.value)}
              error={Boolean(mobileNoError)}
              helperText={mobileNoError}
              required
              fullWidth
              disabled={isLoading}
            />

            {/* ID Type */}
            <FormControl fullWidth required error={Boolean(idTypeError)} disabled={isLoading}>
              <InputLabel id="id-type-label">ID Type</InputLabel>
              <Select
                labelId="id-type-label"
                value={idType}
                label="ID Type"
                onChange={(e) => setIdType(e.target.value)}
              >
                <MenuItem value="Aadhar">Aadhar</MenuItem>
                <MenuItem value="Passport">Passport</MenuItem>
                <MenuItem value="Driving License">Driving License</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              {idTypeError && <FormHelperText>{idTypeError}</FormHelperText>}
            </FormControl>

            {/* ID Number */}
            <TextField
              label="ID Number"
              value={idNo}
              onChange={(e) => setIdNo(e.target.value)}
              error={Boolean(idNoError)}
              helperText={idNoError}
              required
              fullWidth
              disabled={isLoading}
            />

            {/* WhatsApp Number (optional) */}
            <TextField
              label="WhatsApp Number (optional)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              fullWidth
              disabled={isLoading}
            />

            {/* Email (optional) */}
            <TextField
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              disabled={isLoading}
            />

            {/* ID Photo upload (optional) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {photoFileName ? 'Change Photo' : 'Upload ID Photo'}
              </Button>
              {photoFileName && (
                <Box
                  component="span"
                  sx={{ fontSize: '0.875rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
                >
                  {photoFileName}
                </Box>
              )}
            </Box>
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
          {submitting ? 'Saving…' : 'Add Guest'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
