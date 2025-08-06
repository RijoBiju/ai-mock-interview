"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAIModal";
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/utils/db";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs`;

function AddNewInterview() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const extractTextFromPDF = async (file) => {
    console.log("File selected:", file.name);

    const reader = new FileReader();

    reader.onload = async (event) => {
      console.log("File read successfully");

      try {
        console.log("Loading PDF document...");
        const pdf = await pdfjsLib.getDocument({ data: event.target.result })
          .promise;
        console.log("PDF document loaded");

        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          console.log(`Extracting text from page ${i}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText +=
            textContent.items.map((item) => item.str).join(" ") + " ";
          console.log(`Text extracted from page ${i}`);
        }

        console.log("Extracted Text:", extractedText);
        setResumeText(extractedText);
        toast.success("Resume uploaded successfully!");
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
        toast.error("Failed to extract text from PDF.");
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Failed to read the file.");
    };

    reader.readAsArrayBuffer(file);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // const inputPrompt = `Job position: ${jobPosition}, Job Description: ${jobDescription}, Years of Experience: ${jobExperience}. Resume Extract: ${resumeText}. Generate 5 interview questions and answers and Generate 3 insightful questions and answers based on the resume and Generate 2 generic HR questions and answers in JSON format. Don't write anything else just get started with the JSON and give it all in one array... don't separate them.`;

    const inputPrompt = resumeText
      ? `Job position: ${jobPosition}, Job Description: ${jobDescription}, Years of Experience: ${jobExperience}. Resume Extract: ${resumeText}. Generate 5 interview questions and answers and Generate 3 insightful questions and answers based on the resume and Generate 2 generic HR questions and answers in JSON format. Don't write anything else just get started with the JSON and give it all in one array... don't separate them.`
      : `Job position: ${jobPosition}, Job Description: ${jobDescription}, Years of Experience: ${jobExperience}. Generate 5 interview questions and answers and Generate 2 generic HR questions and answers in JSON format. Don't write anything else just get started with the JSON and give it all in one array... don't separate them.`;

    try {
      const result = await chatSession.sendMessage(inputPrompt);
      const responseText = await result.response.text();

      console.log(responseText);
      const cleanedResponse = responseText
        .replace(/```json\n?|```/g, "")
        .trim();
      const mockResponse = JSON.parse(cleanedResponse);

      const res = await db
        .insert(MockInterview)
        .values({
          mockId: uuidv4(),
          jsonMockResp: JSON.stringify(mockResponse),
          jobPosition,
          jobDesc: jobDescription,
          jobExperience,
          createdBy: user?.primaryEmailAddress?.emailAddress,
          createdAt: moment().format("DD-MM-YYYY"),
        })
        .returning({ mockId: MockInterview.mockId });

      toast.success("Interview questions generated successfully!");
      router.push(`dashboard/interview/${res[0]?.mockId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 border rounded-lg bg-secondary hover:scale-105 hover:shadow-md cursor-pointer transition-all"
        onClick={() => setOpenDialog(true)}
      >
        <h1 className="font-bold text-lg text-center">+ Add New</h1>
      </div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl">
              Create Your Interview Preparation
            </DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <form onSubmit={onSubmit}>
              <div>
                <div className="my-3">
                  <label>Upload Resume (PDF)</label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => extractTextFromPDF(e.target.files[0])}
                  />
                </div>
                <div className="my-3">
                  <label>Job Role/Position</label>
                  <Input
                    value={jobPosition}
                    required
                    onChange={(e) => setJobPosition(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label>Job Description/Tech Stack</label>
                  <Textarea
                    value={jobDescription}
                    required
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>
                <div className="my-3">
                  <label>Years of Experience</label>
                  <Input
                    type="number"
                    min="0"
                    max="70"
                    value={jobExperience}
                    required
                    onChange={(e) => setJobExperience(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-5 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <LoaderCircle className="animate-spin mr-2" />
                  ) : (
                    "Start Interview"
                  )}
                </Button>
              </div>
            </form>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterview;
