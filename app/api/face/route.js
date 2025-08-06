import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // Ensure the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Get FormData from request
    const formData = await req.formData();
    const videoFile = formData.get("video"); // The file input name must be "video"

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log("✅ Received video file:", videoFile.name);

    // Convert Blob to Buffer
    const buffer = Buffer.from(await videoFile.arrayBuffer());

    // Send video file to Flask API
    const flaskFormData = new FormData();
    flaskFormData.append(
      "file",
      new Blob([buffer], { type: "video/mp4" }),
      "video.mp4"
    );

    console.log("📡 Sending video to Flask API...");

    const response = await fetch(
      "https://15d2-34-85-158-207.ngrok-free.app/predict",
      {
        method: "POST",
        body: flaskFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🚨 Flask API Error:", errorText);
      return NextResponse.json({ error: "Flask API error" }, { status: 500 });
    }

    const data = await response.json();
    console.log("🎭 Emotion & Engagement Prediction:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("🚨 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 }
    );
  }
}
