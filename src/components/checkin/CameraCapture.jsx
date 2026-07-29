import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { generateUniqueID } from '../../constants/Functions';
import { trimPath } from '../../constants/constants';
import { toast } from 'react-toastify';
import { fileApi } from '../../api/apiService';
import { CameraAlt, CameraEnhance } from '@mui/icons-material'; // MUI icons

const CameraCapture = ({
  isCameraOpen, setIsCameraOpen,
  whichId,
  setIsLoading1, setIsLoading2,
  setFile1, setFile2
}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true); // Track camera mode
  const webcamRef = useRef(null);

  const captureAndCorrectImage = (webcamRef) => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.translate(canvas.width, 0);
      context.scale(-1, 1);

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Image = canvas.toDataURL("image/jpeg");
      setCapturedImage(base64Image);
    }
  };

  const handleCapture = async () => {
    if (webcamRef.current) {
      captureAndCorrectImage(webcamRef);
      // await uploadCapturedImage(capturedImage);
    }
  };

  useEffect(() => {
    if (capturedImage) {
      setIsCameraOpen(false);
      uploadCapturedImage(capturedImage);
    }
  }, [capturedImage]);

  const uploadCapturedImage = async (base64Image) => {
    try {
      setLoadingEvent(true);

      const blob = base64ToBlob(base64Image, "image/jpeg");

      const formData = new FormData();
      const fileName = generateUniqueID() + ".jpg";
      formData.append("file", blob, fileName);

      const response = await fileApi.imageUpload(formData);   

      if (response.status === 200 || response.status === 201) {
        setLoadingEvent(false);
        toast.success("Image Uploaded");
        const finalFilePath = trimPath(response?.data?.file_path);
        if (whichId === 1) {
          setFile1(finalFilePath);
        }
        if (whichId === 2) {
          setFile2(finalFilePath);
        }
      } else {
        setLoadingEvent(false);
        toast.error("Error in File Upload..");
      }
    } catch (error) {
      setLoadingEvent(false);
      toast.error("Error in File Upload");
      console.error("Error in File Upload: " +error.message);
    }
  };

  const setLoadingEvent = (setValue) => {
    if (whichId === 1) {
      setIsLoading1(prev => ({
        ...prev,
        cameraLoading: setValue,
      }))
    }

    if (whichId === 2) {
      setIsLoading2(prev => ({
        ...prev,
        cameraLoading: setValue,
      }))
    }
  }

  const base64ToBlob = (base64, mime = "image/jpeg") => {
    const byteString = atob(base64.split(",")[1]);
    const arrayBuffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      arrayBuffer[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mime });
  };

  return (
    <Dialog open={isCameraOpen} onClose={() => { setIsCameraOpen(false) }}>
      <DialogTitle className="flex justify-between items-center w-96">
        <span>Take ID Proof</span>
        <Tooltip title="Switch Camera" arrow placement="left">
          <IconButton
            onClick={() => {
              setIsFrontCamera((prev) => !prev);
              // startCamera();
            }}
            color="secondary"
          >
            {isFrontCamera ? <CameraAlt /> : <CameraEnhance />}
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent className="flex flex-col items-center w-96">
        {/* <video ref={webcamRef}></video> */}
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full h-60"
          style={{ transform: "scaleX(-1)" }}
          videoConstraints={{
            facingMode: isFrontCamera ? "user" : "environment", // Switch between front and back
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setIsCameraOpen(false) }} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleCapture} color="primary">
          Capture
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CameraCapture;