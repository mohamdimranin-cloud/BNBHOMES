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
 * RoomShiftDialog
 *
 * Opens a MUI Dialog for transferring an active booking from one room to another.
 * Resolves bookingId from roomNum via GET /bookings/guestDetail/{roomNum}.
 * Fetches vacant rooms via GET /rooms, filtered where status === 'Vacant'.
 *
 * Props:
 *   open      {boolean}  - whether the dialog is open
 *   onClose   {function} - called when the dialog should close
 *   roomNum   {string}   - current room number used to resolve the active booking
 *   onSuccess {function} - called after a successful room shift submission
 */
export default function RoomShiftDialog({ open, onClose, roomNum, onSuccess }) {
  // Booking resolution state
  const [bookingId, setBookingId] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Vacant rooms state
  const [vacantRooms, setVacantRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState('');

  // Form field state
  const [selectedRoom, setSelectedRoom] = useState('');
  const [reason, setReason] = useState('');
  const [selectedOldStatus, setSelectedOldStatus] = useState('');

  // Validation error state
  const [selectedRoomError, setSelectedRoomError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [selectedOldStatusError, setSelectedOldStatusError] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch bookingId and vacant rooms when dialog opens
  useEffect(() => {
    if (!open || !roomNum) return;

    let cancelled = false;

    const fetchData = async () => {
      // Fetch booking ID
      setLoadingBooking(true);
      setBookingError('');
      setBookingId(null);

      try {
        const res = await roomApi.getGuestDetailByRoomNum(roomNum);
        if (cancelled) return;

        if (res.status === 200) {
          // API returns booking object — id is at top level
          const id = res.data?.id ?? res.data?.bookingId ?? null;
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

      // Fetch vacant rooms
      setLoadingRooms(true);
      setRoomsError('');
      setVacantRooms([]);

      try {
        const roomsRes = await roomApi.getAllRomms();
        if (cancelled) return;

        if (roomsRes.status === 200) {
          // getAllRomms returns { floor_name: [rooms] } — flatten it
          const data = roomsRes.data;
          const allRooms = Array.isArray(data)
            ? data
            : Object.values(data).flat();
          const vacant = allRooms.filter(
            (r) => r.status === 'Vacant' && String(r.room_number) !== String(roomNum)
          );
          setVacantRooms(vacant);
        } else {
          setRoomsError('Failed to load rooms. Please try again.');
        }
      } catch {
        if (!cancelled) {
          setRoomsError('Failed to load rooms. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingRooms(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [open, roomNum]);

  // Reset all form state when dialog closes
  const handleClose = () => {
    setBookingId(null);
    setLoadingBooking(false);
    setBookingError('');
    setVacantRooms([]);
    setLoadingRooms(false);
    setRoomsError('');
    setSelectedRoom('');
    setReason('');
    setSelectedOldStatus('');
    setSelectedRoomError('');
    setReasonError('');
    setSelectedOldStatusError('');
    setSubmitting(false);
    setSubmitError('');
    onClose();
  };

  // Client-side validation
  const validate = () => {
    let valid = true;

    if (!selectedRoom) {
      setSelectedRoomError('Please select a new room.');
      valid = false;
    } else {
      setSelectedRoomError('');
    }

    if (reason.trim() === '') {
      setReasonError('Reason is required.');
      valid = false;
    } else {
      setReasonError('');
    }

    if (!selectedOldStatus) {
      setSelectedOldStatusError('Please select the old room status.');
      valid = false;
    } else {
      setSelectedOldStatusError('');
    }

    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await roomBookingApi.roomShift(bookingId, {
        newRoomNumber: selectedRoom,
        reason: reason.trim(),
        oldRoomStatus: selectedOldStatus,
      });

      if (res.status === 200 || res.status === 201) {
        toast.success('Room shifted successfully');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        setSubmitError('Failed to shift room. Please try again.');
      }
    } catch {
      setSubmitError('Failed to shift room. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loadingBooking || loadingRooms || submitting;
  const noVacantRooms = !loadingRooms && !roomsError && vacantRooms.length === 0;
  const hasInitError = Boolean(bookingError) || Boolean(roomsError);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        Room Shift — Room {roomNum}
      </DialogTitle>

      <DialogContent dividers>
        {/* Loading spinner while resolving booking or rooms */}
        {(loadingBooking || loadingRooms) && (
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

        {/* Rooms fetch error */}
        {roomsError && !loadingRooms && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {roomsError}
          </Alert>
        )}

        {/* Submission error */}
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        {/* No vacant rooms message (Req 6.6) */}
        {noVacantRooms && !hasInitError && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No vacant rooms available. Room shift cannot be performed at this time.
          </Alert>
        )}

        {/* Form — only rendered when data is loaded and no init errors */}
        {!loadingBooking && !loadingRooms && !hasInitError && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {/* New Room selector (Req 6.2) */}
            <FormControl fullWidth required error={Boolean(selectedRoomError)} disabled={isLoading || noVacantRooms}>
              <InputLabel id="new-room-label">New Room</InputLabel>
              <Select
                labelId="new-room-label"
                value={selectedRoom}
                label="New Room"
                onChange={(e) => setSelectedRoom(e.target.value)}
              >
                {vacantRooms.map((room) => (
                  <MenuItem key={room.room_number} value={String(room.room_number)}>
                    Room {room.room_number}
                    {room.room_type ? ` — ${room.room_type}` : ''}
                  </MenuItem>
                ))}
              </Select>
              {selectedRoomError && (
                <FormHelperText>{selectedRoomError}</FormHelperText>
              )}
            </FormControl>

            {/* Reason field (Req 6.2, 6.7) */}
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
              disabled={isLoading || noVacantRooms}
            />

            {/* Old Room Status selector (Req 6.2) */}
            <FormControl fullWidth required error={Boolean(selectedOldStatusError)} disabled={isLoading || noVacantRooms}>
              <InputLabel id="old-room-status-label">Old Room Status</InputLabel>
              <Select
                labelId="old-room-status-label"
                value={selectedOldStatus}
                label="Old Room Status"
                onChange={(e) => setSelectedOldStatus(e.target.value)}
              >
                <MenuItem value="Cleaning Process">Cleaning Process</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
              {selectedOldStatusError && (
                <FormHelperText>{selectedOldStatusError}</FormHelperText>
              )}
            </FormControl>
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
          disabled={isLoading || hasInitError || noVacantRooms || !bookingId}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? 'Shifting…' : 'Shift Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
