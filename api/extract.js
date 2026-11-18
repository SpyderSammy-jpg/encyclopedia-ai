
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import XLSX from "xlsx";
import AdmZip from "adm-zip";

export const config = {
  api: {
    bodyParser: false
  }
};

async function extractPDF(buffer) {
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  return workbook.SheetNames.map(name => {
    const sheet = workbook.Sheets[name];

    return (
      "SHEET: " + name + "\n" +
      XLSX.utils.sheet_to_csv(sheet)
    );
  }).join("\n\n");
}

function extractPPTX(buffer) {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  return entries
    .filter(entry =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName)
    )
    .sort((a, b) =>
      a.entryName.localeCompare(b.entryName, undefined, {
        numeric: true
      })
    )
    .map((entry, index) => {
      const xml = entry.getData().toString("utf8");

      const text = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
        .map(match =>
          match[1]
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
        )
        .join(" ");

      return `SLIDE ${index + 1}\n${text}`;
    })
    .join("\n\n");
}

async function extractFile(file) {
  const extension = path.extname(file.name).toLowerCase();
  const buffer = Buffer.from(file.data, "base64");

  switch (extension) {
    case ".pdf":
      return extractPDF(buffer);

    case ".docx":
      return extractDOCX(buffer);

    case ".xlsx":
    case ".xls":
      return extractXLSX(buffer);

    case ".pptx":
      return extractPPTX(buffer);

    case ".txt":
    case ".md":
    case ".csv":
    case ".json":
    case ".xml":
    case ".html":
    case ".css":
    case ".js":
    case ".py":
    case ".java":
    case ".sql":
      return buffer.toString("utf8");

    default:
      throw new Error(
        `Unsupported document format: ${extension || "unknown"}`
      );
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { files } = req.body || {};

    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files were provided."
      });
    }

    const results = [];

    for (const file of files) {
      if (
        !file ||
        typeof file.name !== "string" ||
        typeof file.data !== "string"
      ) {
        results.push({
          name: "Unknown file",
          success: false,
          error: "Invalid file data."
        });
        continue;
      }

      try {
        const text = await extractFile(file);

        results.push({
          name: path.basename(file.name),
          success: true,
          text
        });

      } catch (error) {
        results.push({
          name: path.basename(file.name),
          success: false,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      files: results
    });

  } catch (error) {
    console.error("Extraction error:", error);

    return res.status(500).json({
      success: false,
      error: "Document extraction failed."
    });
  }
}
