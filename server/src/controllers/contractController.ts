import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../config/firebaseAdmin';
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
 * Handles the direct Base64 upload from client, writes it to disk, creates Firestore records, and parses it
 */
export const uploadContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const uid = req.user?.uid;
  const { fileName, fileType, fileSize, fileBase64 } = req.body;

  if (!uid) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  if (!fileName || !fileType || !fileSize || !fileBase64) {
    res.status(400).json({ error: 'Missing required upload parameters (fileName, fileType, fileSize, fileBase64).' });
    return;
  }

  try {
    const contractId = Math.random().toString(36).substring(2, 15);
    
    // 1. Decode Base64 string to buffer
    const fileBuffer = Buffer.from(fileBase64, 'base64');

    // 2. Save file locally on disk
    const targetDir = path.join(UPLOADS_BASE_DIR, 'users', uid, 'contracts', contractId);
    ensureDirectoryExists(targetDir);
    const targetFilePath = path.join(targetDir, 'original-file');
    fs.writeFileSync(targetFilePath, fileBuffer);

    // 3. Write initial Firestore record
    const downloadUrl = `http://localhost:5001/api/contracts/download/${contractId}`;
    const contractRef = db.collection('contracts').doc(contractId);

    const initialContractData = {
      contractId,
      userId: uid,
      contractName: fileName.replace(/\.[^/.]+$/, ""), // remove extension for display name
      fileName,
      fileType,
      fileSize,
      uploadDate: new Date().toISOString(),
      storageUrl: downloadUrl,
      status: 'processing',
      pageCount: 0,
      wordCount: 0,
      contractCategory: 'Other',
      parties: [],
      effectiveDate: null,
      expirationDate: null,
      analysisStatus: 'analysis_pending'
    };

    await contractRef.set(initialContractData);

    // 4. Run Parser depending on file type
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

    // 5. Run Metadata Extraction Engine
    const metadata = extractMetadata(parsedResult.rawText);

    // 6. Update Firestore with parsed results
    const updatedFields = {
      rawText: parsedResult.rawText,
      structuredText: parsedResult.structuredText,
      pageCount: parsedResult.pageCount,
      wordCount: parsedResult.wordCount,
      contractTitle: metadata.contractTitle !== 'Untitled Contract' ? metadata.contractTitle : initialContractData.contractName,
      contractCategory: metadata.contractCategory,
      parties: metadata.parties,
      effectiveDate: metadata.effectiveDate,
      expirationDate: metadata.expirationDate,
      status: 'parsed',
      analysisStatus: 'analysis_pending'
    };

    await contractRef.update(updatedFields);

    res.status(200).json({
      message: 'Contract successfully uploaded, parsed and metadata extracted.',
      contractId
    });

  } catch (err: any) {
    console.error('Upload & Ingest pipeline failure:', err);
    res.status(500).json({ error: `Upload process failed: ${err.message}` });
  }
};

/**
 * Handles downloading a contract file from the local server filesystem
 */
export const downloadContract = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).send('Contract ID is required.');
    return;
  }

  try {
    // 1. Fetch metadata from Firestore to identify owner and original filename
    const contractDoc = await db.collection('contracts').doc(id).get();
    
    if (!contractDoc.exists) {
      res.status(404).send('Contract metadata record not found.');
      return;
    }

    const contractData = contractDoc.data();
    const userId = contractData?.userId;
    const fileName = contractData?.fileName || 'original-file';
    const fileType = contractData?.fileType || 'application/octet-stream';

    if (!userId) {
      res.status(400).send('Contract data is corrupted (missing owner ID).');
      return;
    }

    // 2. Locate the file on disk
    const filePath = path.join(UPLOADS_BASE_DIR, 'users', userId, 'contracts', id, 'original-file');

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Original document file not found on server disk.');
      return;
    }

    // 3. Serve the file back to client
    res.setHeader('Content-Type', fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(filePath);

  } catch (err: any) {
    console.error('Download failure:', err);
    res.status(500).send(`Server failed to serve download: ${err.message}`);
  }
};

/**
 * Handles purging Firestore record and local server files
 */
export const deleteContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const uid = req.user?.uid;

  if (!id) {
    res.status(400).json({ error: 'Contract ID is required.' });
    return;
  }

  if (!uid) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const contractRef = db.collection('contracts').doc(id);
    const contractDoc = await contractRef.get();

    if (!contractDoc.exists) {
      res.status(404).json({ error: 'Contract record not found.' });
      return;
    }

    const contractData = contractDoc.data();
    if (contractData?.userId !== uid) {
      res.status(403).json({ error: 'Access denied. You do not own this contract.' });
      return;
    }

    // 1. Delete associated local files and directories from disk
    const targetDir = path.join(UPLOADS_BASE_DIR, 'users', uid, 'contracts', id);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // 2. Delete Firestore Record
    await contractRef.delete();

    res.status(200).json({
      message: 'Contract and associated local storage assets successfully deleted.',
      contractId: id
    });
  } catch (err: any) {
    console.error('Delete process failure:', err);
    res.status(500).json({ error: `Deletion failed: ${err.message}` });
  }
};
