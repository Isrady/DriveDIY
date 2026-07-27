import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { extractTextFromPDF } from "@/lib/pdf/parser";
import { runContractParse } from "@/lib/agents/orchestrator";

export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const contractType = (formData.get("contract_type") as string) ?? "FIDIC_RED";

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = `contracts/${id}/${file.name}`;

  // Upload to Supabase Storage
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: uploadError } = await admin.storage
    .from("contracts")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  // Update contract with file info
  await admin
    .from("contracts")
    .update({
      storage_path: storagePath,
      file_name: file.name,
      file_size_bytes: buffer.length,
      parse_status: "processing",
    })
    .eq("id", id);

  // Extract text and parse in background (fire and forget)
  extractTextFromPDF(buffer)
    .then((pdfText) => runContractParse(id, pdfText, contractType, user.id))
    .catch((err) => {
      console.error(`Contract parse failed for ${id}:`, err);
      admin
        .from("contracts")
        .update({ parse_status: "failed", parse_error: String(err) })
        .eq("id", id)
        .then();
    });

  return NextResponse.json({
    message: "File uploaded. Contract parsing started.",
    storage_path: storagePath,
  });
}
