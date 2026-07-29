import { Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { fileApi } from '../api/apiService';
import { Close } from '@mui/icons-material';
import CameraCapture from '../components/checkin/CameraCapture';

const CustomeFileOrPhotoUploader = ({ isDialogOpen, setIsDialogOpen, guestInfo, setGuestInfo }) => {
  const [isLoading1, setIsLoading1] = useState({ fileLoading: false, cameraLoading: false });
  const [isLoading2, setIsLoading2] = useState({ fileLoading: false, cameraLoading: false });
  const [whichId, setWhichId] = useState(0);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);
  const [idPhoto, setIdPhoto] = useState(null);

  // Reset loading spinners when camera closes without completing an upload
  const handleCameraClose = (isOpen) => {
    setIsCameraOpen(isOpen);
    if (!isOpen) {
      setIsLoading1(prev => ({ ...prev, cameraLoading: false }));
      setIsLoading2(prev => ({ ...prev, cameraLoading: false }));
    }
  };

  const handleSaveFiles = () => {
    setGuestInfo(prevData => ({
      ...prevData,
      userPhotoUrl: file1,
      idPhotoUrl: file2,
    }));
    setIsDialogOpen(false);
  };

  const handleCancelSave = () => {
    setIsDialogOpen(false);
    setFile1(null);
    setFile2(null);
  };

  useEffect(() => {
    setFile1(guestInfo.userPhotoUrl);
    setFile2(guestInfo.idPhotoUrl);
  }, [guestInfo]);

  const fetchImage = async (fileName) => {
    try {
      const response = await fileApi.getUploadedFile(fileName);
      const imageObjectURL = URL.createObjectURL(response.data);
      return imageObjectURL;
    } catch (error) {
      console.error("Error fetching image:", error);
      return null;
    }
  };

  useEffect(() => {
    if (file1) {
      fetchImage(file1).then(res => {
        setUserPhoto(res);
        localStorage.setItem("userImg", file1);
      });
    } else {
      setUserPhoto(null);
    }
  }, [file1]);

  useEffect(() => {
    if (file2) {
      fetchImage(file2).then(res => setIdPhoto(res));
    } else {
      setIdPhoto(null);
    }
  }, [file2]);

  return (
    <>
      <CameraCapture
        isCameraOpen={isCameraOpen}
        setIsCameraOpen={handleCameraClose}
        whichId={whichId}
        setIsLoading1={setIsLoading1}
        setIsLoading2={setIsLoading2}
        setFile1={setFile1}
        setFile2={setFile2}
      />

      <Dialog open={isDialogOpen}>
        <DialogTitle className="text-primary">Upload the ID Proof's</DialogTitle>
        <DialogContent className="flex items-start justify-center gap-3">

          {/* User Photo */}
          <Card className="min-w-[200px] h-fit px-2 py-1">
            <div className="flex flex-col items-start justify-center gap-2 pb-2">
              <Typography className="text-primary text-sm">User Photo</Typography>
              <div className="flex w-full flex-col items-center justify-start gap-1">
                {userPhoto && (
                  <div className="bg-gray-300 border rounded-md relative flex items-center">
                    <img src={userPhoto} alt="userPhoto" className="max-w-[180px]" />
                    <div className="absolute top-0 right-0 p-1 z-50">
                      <IconButton color="error" size="small" onClick={() => { setFile1(null); setUserPhoto(null); }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                )}
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => { handleCameraClose(true); setWhichId(1); }}
                  disabled={isLoading1.cameraLoading}
                  sx={{ textTransform: "none" }}
                >
                  {isLoading1.cameraLoading ? (
                    <span className="flex items-center gap-2">
                      <CircularProgress size={16} color="inherit" />
                      Uploading...
                    </span>
                  ) : userPhoto ? 'Retake' : 'Click Photo'}
                </Button>
              </div>
            </div>
          </Card>

          {/* ID Photo */}
          <Card className="min-w-[200px] h-fit px-2 py-1">
            <div className="flex flex-col items-start justify-center gap-2 pb-2">
              <Typography className="text-primary text-sm">ID Photo</Typography>
              <div className="flex w-full flex-col items-center justify-start gap-1">
                {idPhoto && (
                  <div className="bg-gray-300 border rounded-md relative flex items-center">
                    <img src={idPhoto} alt="idPhoto" className="max-w-[180px]" />
                    <div className="absolute top-0 right-0 p-1 z-50">
                      <IconButton color="error" size="small" onClick={() => { setFile2(null); setIdPhoto(null); }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                )}
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => { handleCameraClose(true); setWhichId(2); }}
                  disabled={isLoading2.cameraLoading}
                  sx={{ textTransform: "none" }}
                >
                  {isLoading2.cameraLoading ? (
                    <span className="flex items-center gap-2">
                      <CircularProgress size={16} color="inherit" />
                      Uploading...
                    </span>
                  ) : idPhoto ? 'Retake' : 'Click Photo'}
                </Button>
              </div>
            </div>
          </Card>

        </DialogContent>
        <DialogActions>
          <Button variant="contained" className="!bg-primary" onClick={handleSaveFiles}>Save</Button>
          <Button variant="outlined" color="error" onClick={handleCancelSave}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CustomeFileOrPhotoUploader;
