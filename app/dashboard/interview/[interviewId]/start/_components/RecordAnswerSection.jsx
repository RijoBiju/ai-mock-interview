"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState, useRef } from "react";
import { Mic, StopCircle, Loader2, Camera, CameraOff } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
  onAnswerSave,
}) => {
  const [isAudioProcessing, setIsAudioProcessing] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [emotion, setEmotion] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [faceEmotion, setFaceEmotion] = useState(false);
  const [engagement, setEngagement] = useState(false);
  const recognitionRef = useRef(null); // Not directly related to recording but keep it if needed
  const webcamRef = useRef(null); // Webcam stream reference
  const mediaRecorderRefAudio = useRef(null); // Audio recorder
  const mediaRecorderRefVideo = useRef(null); // Video recorder
  const audioChunksRef = useRef([]); // Stores audio data
  const videoChunksRef = useRef([]); // Stores video data

  useEffect(() => {
    // Speech recognition setup (pre

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      const recognition = recognitionRef.current;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }

        if (finalTranscript.trim()) {
          setUserAnswer((prev) => (prev + " " + finalTranscript).trim());
          console.log(userAnswer);
        }
      };

      recognition.onerror = (event) => {
        toast.error(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const EnableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("✅ Stream received:", stream);

      setWebcamEnabled(true); // Trigger re-render to show <video>

      setTimeout(() => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          console.log("✅ Stream assigned:", webcamRef.current);
        } else {
          console.warn("⚠️ webcamRef.current is STILL null!");
        }
      }, 100); // Delay to ensure <video> is rendered
    } catch (error) {
      console.error("❌ Failed to enable webcam:", error);
    }
  };

  const DisableWebcam = () => {
    console.log("Disabling webcam...");

    if (webcamRef.current?.srcObject) {
      const tracks = webcamRef.current.srcObject.getTracks();
      console.log("Stopping tracks:", tracks);
      tracks.forEach((track) => track.stop());

      webcamRef.current.srcObject = null; // 🔥 Clear video source
      console.log("Webcam disabled!");
    } else {
      console.log("No webcam stream to disable.");
    }

    setWebcamEnabled(false);
  };

  const startRecording = async () => {
    try {
      toast.info("Requesting microphone and camera access...");

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      let videoStream;
      if (webcamRef.current?.srcObject) {
        videoStream = webcamRef.current.srcObject; // 🔥 Reuse existing stream
      } else {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: { frameRate: { ideal: 30, min: 24 } },
        });
      }

      // Assign stream to video element
      if (webcamRef.current) {
        webcamRef.current.srcObject = videoStream;
      }

      toast.success("Access granted");

      // Audio recorder setup
      const mediaRecorderAudio = new MediaRecorder(audioStream);
      mediaRecorderRefAudio.current = mediaRecorderAudio;
      audioChunksRef.current = [];

      mediaRecorderAudio.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderAudio.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          toast.error("No audio recorded. Please try again.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });

        if (audioBlob.size === 0) {
          toast.error("Recording failed. Please try again.");
          return;
        }

        sendAudioToAPI(audioBlob);
      };

      // Video recorder setup
      const mediaRecorderVideo = new MediaRecorder(videoStream, {
        mimeType: "video/webm",
      });
      mediaRecorderRefVideo.current = mediaRecorderVideo;
      videoChunksRef.current = [];

      mediaRecorderVideo.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      mediaRecorderVideo.onstop = () => {
        toast.info("Processing video and audio...");

        // Combine all recorded chunks into a single Blob
        const videoBlob = new Blob(videoChunksRef.current, {
          type: "video/webm",
        });

        // Send the video blob to the API
        sendVideoToAPI(videoBlob);
      };

      // Start recording both
      mediaRecorderAudio.start();
      mediaRecorderVideo.start();
      toast.info("Recording started...");
      setIsRecording(true);
    } catch (error) {
      toast.error("Failed to access microphone or camera.");
    }
  };

  const stopRecording = () => {
    toast.info("Stopping recording...");

    if (mediaRecorderRefAudio.current) {
      mediaRecorderRefAudio.current.stop();
    }

    if (mediaRecorderRefVideo.current) {
      mediaRecorderRefVideo.current.stop();
    }

    setIsRecording(false);
  };

  const StartStopRecording = () => {
    // (previous recording logic remains the same)
    if (!recognitionRef.current) {
      toast.error("Speech-to-text not supported");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      stopRecording();
      toast.info("Recording stopped");
    } else {
      recognitionRef.current.start();
      startRecording();
      setIsRecording(true);
      toast.info("Recording started");
    }
  };

  const sendAudioToAPI = async (audioBlob) => {
    try {
      console.log("Sending audio to API...");
      setIsAudioProcessing(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "recorded_audio.wav");

      const response = await fetch("/api/emotion", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      setEmotion(data.emotion);
      toast.success(`Detected Emotion: ${data.emotion}`);

      // Append emotion to the answer
      // setUserAnswer((prev) => prev.trim() + ` [${data.emotion}]`);
    } catch (error) {
      console.error("Error sending audio:", error);
      toast.error("Error detecting emotion.");
    } finally {
      setIsAudioProcessing(false); // Mark audio processing as finished
    }
  };

  const sendVideoToAPI = async (videoBlob) => {
    try {
      console.log("Sending video to API...");
      setIsVideoProcessing(true);
      const formData = new FormData();
      formData.append("video", videoBlob, "recorded_video.mp4");

      const response = await fetch("/api/face", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response:", data);
      setFaceEmotion(data.emotion);
      // setEngagement(data.engagement);
      // toast.success(`Engagement Level: ${data.engagement}`);
    } catch (error) {
      console.error("Error sending video:", error);
      // toast.error("Error detecting engagement.");
    } finally {
      setIsVideoProcessing(false); // Mark video processing as finished
    }
  };

  const UpdateUserAnswer = async () => {
    // (previous answer saving logic remains the same)
    if (!userAnswer.trim()) {
      toast.error("Please provide an answer");
      return;
    }

    setLoading(true);

    try {
      const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}, User Answer: ${userAnswer}, Emotion From Speech: ${emotion}, Emotion From Face: ${faceEmotion}, Engagement of Face: ${engagement}. Please give a rating out of 10 and feedback on improvement based on answer and the emotion from the way they spoke and the emotion from their facial expressions and about their engagement level in JSON format, { "rating": <number>, "feedback": <text> }`;

      const result = await chatSession.sendMessage(feedbackPrompt);
      const mockJsonResp = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();
      const JsonfeedbackResp = JSON.parse(mockJsonResp);

      console.log(JsonfeedbackResp?.feedback);

      const answerRecord = {
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: userAnswer,
        feedback: JsonfeedbackResp?.feedback,
        rating: JsonfeedbackResp?.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      };

      await db.insert(UserAnswer).values(answerRecord);

      onAnswerSave?.(answerRecord);

      toast.success("Answer recorded successfully");

      setUserAnswer("");
      setEmotion("");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } catch (error) {
      toast.error("Failed to save answer", {
        description: error.message,
      });
      console.error("Answer save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center flex-col relative mb-6">
      {loading && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex flex-col justify-center items-center">
          <Loader2 className="h-16 w-16 animate-spin text-white mb-4" />
          <p className="text-white text-lg">Saving your answer...</p>
        </div>
      )}
      <div className="flex flex-col my-20 justify-center items-center bg-black rounded-lg p-5">
        {webcamEnabled ? (
          <video
            ref={webcamRef}
            autoPlay
            playsInline
            className="w-[200px] h-[200px] object-cover rounded-lg"
          />
        ) : (
          <div className="w-[200px] h-[200px] flex justify-center items-center bg-gray-200 rounded-lg">
            <p className="text-gray-500">Webcam Disabled</p>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-4"
          onClick={webcamEnabled ? DisableWebcam : EnableWebcam}
        >
          {webcamEnabled ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" /> Disable Webcam
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" /> Enable Webcam
            </>
          )}
        </Button>
      </div>

      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <h2 className="text-red-600 items-center animate-pulse flex gap-2">
            <StopCircle /> Stop Recording
          </h2>
        ) : (
          <h2 className="text-primary flex gap-2 items-center">
            <Mic /> Record Answer
          </h2>
        )}
      </Button>

      <textarea
        className="w-full h-32 p-4 mt-4 border rounded-md text-gray-800"
        placeholder="Your answer will appear here..."
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
      />

      <Button
        className="mt-4"
        onClick={UpdateUserAnswer}
        disabled={
          loading ||
          isAudioProcessing ||
          isVideoProcessing ||
          !userAnswer.trim()
        } // Disable only if either is processing
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 mb-4 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save Answer"
        )}
      </Button>
    </div>
  );
};

export default RecordAnswerSection;
