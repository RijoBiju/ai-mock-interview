import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const videoFile = formData.get("video");

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log("Received video file:", videoFile.name);

    const buffer = Buffer.from(await videoFile.arrayBuffer());

    const flaskFormData = new FormData();
    flaskFormData.append(
      "file",
      new Blob([buffer], { type: "video/mp4" }),
      "video.mp4"
    );

    console.log("📡 Sending video to Flask API...");

    const response = await fetch(process.env.VIDEO_NGROK_LINK, {
      method: "POST",
      body: flaskFormData,
    });

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
