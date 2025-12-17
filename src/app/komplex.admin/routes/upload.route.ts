import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { uploadPdfToCloudflare, uploadImageToCloudflare } from "@/db/cloudflare/cloudflareFunction.js";
import { imageMimeTypes } from "@/utils/imageMimeTypes.js"; 
import { getSignedUrlFromCloudflare } from "@/db/cloudflare/cloudflareFunction.js";

const uploadRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });


// direct file upload handling
// backend upload endpoint
uploadRouter.post('/file', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { fileName, fileType } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const safeFileName = fileName.replace(/\s+/g, "_").replace(/[^\p{L}\p{N}._-]+/gu, "_");
    const key = `books/${safeFileName}-${crypto.randomUUID()}`;
    
    let url;
    if (fileType === 'application/pdf') {
      url = await uploadPdfToCloudflare(key, file.buffer, fileType);
    } else if (imageMimeTypes.includes(fileType)) {
      url = await uploadImageToCloudflare(key, file.buffer, fileType);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    
    res.json({ key, url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default uploadRouter;