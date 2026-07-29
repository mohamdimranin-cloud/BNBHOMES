import { CameraAlt, CameraEnhance } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { trimPath } from "../constants/constants";
import { generateUniqueID } from "../constants/Functions";
import { fileApi } from "../api/apiService";
import Webcam from "react-webcam";

const CustomeCamera = ({
  isCameraOpen, setIsCameraOpen,
  whichId,
  setIsLoading1, setIsLoading2,
  setFile1, setFile2
}) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const webcamRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isCameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraOpen, isFrontCamera]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: 350,
          height: 300,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        await webcamRef.current.play();
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = async () => {
    if (!webcamRef.current) return;

    const video = webcamRef.current;

    stopCamera();

    const offscreenCanvas = new OffscreenCanvas(video.videoWidth || 350, video.videoHeight || 300);
    const ctx = offscreenCanvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);

      const blob = await offscreenCanvas.convertToBlob({ type: "image/jpeg" });
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Image = reader.result;
        setCapturedImage(base64Image);
        setIsCameraOpen(false);
        await uploadCapturedImage(base64Image);
      };
    }
  };

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
      toast.error("Exception in File Upload..");
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
    <Dialog open={isCameraOpen} onClose={() => { setIsCameraOpen(false); stopCamera(); }}>
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
        <Button onClick={() => { setIsCameraOpen(false); stopCamera(); }} color="secondary">
          Cancel
        </Button>
        <Button onClick={capturePhoto} color="primary">
          Capture
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomeCamera;