import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req) {
  try {
    // Ensure the request is multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type. Expected multipart/form-data" },
        { status: 400 }
      );
    }

    // Get FormData from request
    const formData = await req.formData();
    const file = formData.get("file"); // The file input name must be "file"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("✅ Received file:", file.name);

    // Convert Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const data = await pdf(buffer);
    console.log("📄 Extracted text from PDF");

    return NextResponse.json({ text: data.text }, { status: 200 });
  } catch (error) {
    console.error("🚨 Server Error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from PDF" },
      { status: 500 }
    );
  }
}
