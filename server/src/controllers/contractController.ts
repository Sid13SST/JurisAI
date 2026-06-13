import { Request, Response } from 'express';
import { parsePDF, parseDOCX } from '../services/parserService';
import { extractMetadata } from '../services/metadataService';
import fs from 'fs';
import path from 'path';

// Base directory for uploads
const UPLOADS_BASE_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Ensures the target directory exists recursively
 */
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Handles the direct Base64 upload from client, writes it to disk, and returns the parsed structure
 */
export const uploadAndParseContract = async (req: Request, res: Response): Promise<void> => {
  const { userId, contractId, fileName, fileType, fileSize, fileBase64 } = req.body;

  if (!userId || !contractId || !fileName || !fileType || !fileSize || !fileBase64) {
    res.status(400).json({ error: 'Missing required upload parameters (userId, contractId, fileName, fileType, fileSize, fileBase64).' });
    return;
  }

  try {
    // 1. Decode Base64 string to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // 2. Save file locally on disk
    const targetDir = path.join(UPLOADS_BASE_DIR, 'users', userId, 'contracts', contractId);
    ensureDirectoryExists(targetDir);
    const targetFilePath = path.join(targetDir, 'original-file');
    fs.writeFileSync(targetFilePath, fileBuffer);

    // 3. Run Parser depending on file type
    const isPDF = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    const isDOCX = fileType.includes('docx') || fileType.includes('word') || fileName.toLowerCase().endsWith('.docx');

    let parsedResult;

    if (isPDF) {
      parsedResult = await parsePDF(fileBuffer);
    } else if (isDOCX) {
      parsedResult = await parseDOCX(fileBuffer);
    } else {
      res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' });
      return;
    }

    // 4. Run Metadata Extraction Engine
    const metadata = extractMetadata(parsedResult.rawText);

    // 5. Return parsed data to the client so the client can save it to Firestore directly
    res.status(200).json({
      message: 'Contract parsed successfully.',
      rawText: parsedResult.rawText,
      structuredText: parsedResult.structuredText,
      pageCount: parsedResult.pageCount,
      wordCount: parsedResult.wordCount,
      metadata
    });

  } catch (err: any) {
    console.error('Upload & Ingest pipeline failure:', err);
    res.status(500).json({ error: `Parsing pipeline failed: ${err.message}` });
  }
};

/**
 * Handles downloading a contract file from the local server filesystem using URL params
 */
export const downloadContract = async (req: Request, res: Response): Promise<void> => {
  const { userId, contractId } = req.params;
  const fileName = (req.query.fileName as string) || 'original-file';
  const fileType = (req.query.fileType as string) || 'application/octet-stream';

  if (!userId || !contractId) {
    res.status(400).send('User ID and Contract ID are required.');
    return;
  }

  try {
    // Locate the file on disk
    const filePath = path.join(UPLOADS_BASE_DIR, 'users', userId, 'contracts', contractId, 'original-file');

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Original document file not found on server disk.');
      return;
    }

    // Serve the file back to client
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);

  } catch (err: any) {
    console.error('Download failure:', err);
    res.status(500).send(`Server failed to serve download: ${err.message}`);
  }
};

/**
 * Handles purging local server files for a contract
 */
export const deleteContractLocal = async (req: Request, res: Response): Promise<void> => {
  const { userId, contractId } = req.params;

  if (!userId || !contractId) {
    res.status(400).json({ error: 'User ID and Contract ID are required.' });
    return;
  }

  try {
    // Delete associated local files and directories from disk
    const targetDir = path.join(UPLOADS_BASE_DIR, 'users', userId, 'contracts', contractId);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    res.status(200).json({
      message: 'Local storage assets successfully deleted.',
      contractId
    });
  } catch (err: any) {
    console.error('Delete process failure:', err);
    res.status(500).json({ error: `Deletion failed: ${err.message}` });
  }
};
