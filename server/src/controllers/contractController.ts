import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db, bucket } from '../config/firebaseAdmin';
import { parsePDF, parseDOCX } from '../services/parserService';
import { extractMetadata } from '../services/metadataService';

/**
 * Triggers the parsing, structure partitioning, and metadata extraction of a contract
 */
export const parseContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { contractId } = req.body;
  const uid = req.user?.uid;

  if (!contractId) {
    res.status(400).json({ error: 'Contract ID is required.' });
    return;
  }

  if (!uid) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    // 1. Fetch contract record from Firestore
    const contractRef = db.collection('contracts').doc(contractId);
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

    // Update status to processing
    await contractRef.update({ status: 'processing' });

    // 2. Download original file from Firebase Storage
    const fileName = contractData.fileName || 'original-file';
    
    // We try both the original filename and the fallback "original-file" path
    let fileRef = bucket.file(`users/${uid}/contracts/${contractId}/${fileName}`);
    let [exists] = await fileRef.exists();
    
    if (!exists) {
      // Fallback check
      fileRef = bucket.file(`users/${uid}/contracts/${contractId}/original-file`);
      [exists] = await fileRef.exists();
      if (!exists) {
        await contractRef.update({ status: 'uploaded' }); // revert
        res.status(404).json({ error: 'Original contract document not found in Storage.' });
        return;
      }
    }

    const [buffer] = await fileRef.download();

    // 3. Execute Parser depending on file type
    const fileType = (contractData.fileType || '').toLowerCase();
    const isPDF = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    const isDOCX = fileType.includes('docx') || fileType.includes('word') || fileName.toLowerCase().endsWith('.docx');

    let parsedResult;

    if (isPDF) {
      parsedResult = await parsePDF(buffer);
    } else if (isDOCX) {
      parsedResult = await parseDOCX(buffer);
    } else {
      await contractRef.update({ status: 'uploaded' });
      res.status(400).json({ error: 'Unsupported file type. Only PDF and DOCX are supported.' });
      return;
    }

    // 4. Run Metadata Extraction Engine
    const metadata = extractMetadata(parsedResult.rawText);

    // 5. Update Firestore with parsed text, outlines, and metadata
    const updatedFields = {
      rawText: parsedResult.rawText,
      structuredText: parsedResult.structuredText,
      pageCount: parsedResult.pageCount,
      wordCount: parsedResult.wordCount,
      contractTitle: metadata.contractTitle !== 'Untitled Contract' ? metadata.contractTitle : contractData.contractName,
      contractCategory: metadata.contractCategory,
      parties: metadata.parties,
      effectiveDate: metadata.effectiveDate,
      expirationDate: metadata.expirationDate,
      status: 'parsed',
      analysisStatus: 'analysis_pending'
    };

    await contractRef.update(updatedFields);

    res.status(200).json({
      message: 'Contract successfully parsed and metadata extracted.',
      contractId,
      metadata: {
        category: metadata.contractCategory,
        parties: metadata.parties,
        effectiveDate: metadata.effectiveDate,
        expirationDate: metadata.expirationDate
      }
    });
  } catch (err: any) {
    console.error('Parsing process failure:', err);
    // Attempt to reset status if it fails
    try {
      await db.collection('contracts').doc(contractId).update({ status: 'uploaded' });
    } catch (_) {}
    
    res.status(500).json({ error: `Parsing pipeline failed: ${err.message}` });
  }
};

/**
 * Handles purging Firestore record and Storage assets
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

    // 1. Delete associated files from Firebase Storage
    const fileName = contractData.fileName || 'original-file';
    
    const fileRef = bucket.file(`users/${uid}/contracts/${id}/${fileName}`);
    const fallbackFileRef = bucket.file(`users/${uid}/contracts/${id}/original-file`);

    try {
      await fileRef.delete({ ignoreNotFound: true });
      await fallbackFileRef.delete({ ignoreNotFound: true });
    } catch (storageErr) {
      console.warn('Storage file deletion warning:', storageErr);
    }

    // 2. Delete Firestore Record
    await contractRef.delete();

    res.status(200).json({
      message: 'Contract and associated storage assets successfully deleted.',
      contractId: id
    });
  } catch (err: any) {
    console.error('Delete process failure:', err);
    res.status(500).json({ error: `Deletion failed: ${err.message}` });
  }
};
