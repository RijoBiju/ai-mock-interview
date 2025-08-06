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
    const audioFile = formData.get("audio"); // The file input name must be "audio"

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("✅ Received audio file:", audioFile.name);

    // Convert Blob to Buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());

    // Send audio file to Flask API
    const flaskFormData = new FormData();
    flaskFormData.append(
      "file",
      new Blob([buffer], { type: "audio/wav" }),
      "audio.wav"
    );

    console.log("📡 Sending audio to Flask API...");

    const response = await fetch(
      "https://175c-104-199-173-178.ngrok-free.app/predict",
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
    console.log("🎭 Emotion Prediction:", data);

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("🚨 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}
