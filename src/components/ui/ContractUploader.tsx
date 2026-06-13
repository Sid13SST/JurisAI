import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, X } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface ContractUploaderProps {
  onUploadComplete?: (contractId: string) => void;
  onClose?: () => void;
}

type UploadStep = 'idle' | 'uploading' | 'parsing' | 'extracting' | 'completed' | 'error';

export const ContractUploader: React.FC<ContractUploaderProps> = ({ onUploadComplete, onClose }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [dragActive, setDragActive] = useState(false);
  const [step, setStep] = useState<UploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = async (file: File) => {
    if (!currentUser) {
      showToast('You must be logged in to upload files.', 'error');
      return;
    }

    // 1. Validations
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isDocxExtension = extension === 'docx';
    const isPdfExtension = extension === 'pdf';

    if (!validTypes.includes(file.type) && !isDocxExtension && !isPdfExtension) {
      showToast('Unsupported format. Please upload PDF or DOCX.', 'error');
      return;
    }

    const maxLimit = 25 * 1024 * 1024; // 25 MB
    if (file.size > maxLimit) {
      showToast('File size exceeds the 25 MB limit.', 'error');
      return;
    }

    // Prepare metadata
    setFileName(file.name);
    setFileSizeStr(formatBytes(file.size));
    setStep('uploading');
    setProgress(0);

    const contractId = Math.random().toString(36).substring(2, 15);
    const storagePath = `users/${currentUser.uid}/contracts/${contractId}/original-file`;
    const storageRef = ref(storage, storagePath);

    try {
      // 2. Upload to Firebase Storage
      const metadata = {
        contentType: file.type || (isPdfExtension ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        contentDisposition: `attachment; filename="${file.name}"`
      };
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(pct);
          },
          (error) => reject(error),
          () => resolve()
        );
      });

      const downloadUrl = await getDownloadURL(storageRef);

      // 3. Write initial Firestore Record
      setStep('parsing');
      const contractDocRef = doc(db, 'contracts', contractId);
      
      const initialContractData = {
        contractId,
        userId: currentUser.uid,
        contractName: file.name.replace(/\.[^/.]+$/, ""), // remove extension for UI display name
        fileName: file.name,
        fileType: file.type || (isPdfExtension ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        storageUrl: downloadUrl,
        status: 'uploaded',
        pageCount: 0,
        wordCount: 0,
        contractCategory: 'Other',
        parties: [],
        effectiveDate: null,
        expirationDate: null,
        analysisStatus: 'analysis_pending'
      };

      await setDoc(contractDocRef, initialContractData);

      // 4. Trigger Server Parsing
      setStep('extracting');
      const idToken = await currentUser.getIdToken();
      
      const response = await fetch('http://localhost:5001/api/contracts/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ contractId })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server failed to parse document structure.');
      }

      setStep('completed');
      showToast('Contract ingested and parsed successfully!', 'success');
      
      setTimeout(() => {
        if (onUploadComplete) {
          onUploadComplete(contractId);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Upload & Ingest flow error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during contract ingestion.');
      setStep('error');
      showToast(err.message || 'Ingestion pipeline error.', 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#111827]/40 p-6 backdrop-blur-md text-left space-y-6 relative overflow-hidden glass-panel">
      {/* Background glow effects */}
      <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />
      
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-200">Ingest Contract</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerBrowse}
              className={`rounded-2xl border-2 border-dashed py-10 px-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-cyan-500 bg-cyan-500/5 shadow-[0_0_15px_rgba(6,182,212,0.1)] scale-[0.99]' 
                  : 'border-white/10 bg-black/10 hover:border-primary/50 hover:bg-white/3'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              <UploadCloud 
                size={36} 
                className={`transition-colors duration-300 ${dragActive ? 'text-cyan-400' : 'text-slate-400'}`} 
              />
              <p className="mt-3 text-xs font-semibold text-slate-200">
                Drag and drop your contract here, or <span className="text-primary hover:underline">browse files</span>
              </p>
              <p className="mt-1.5 text-[10px] text-slate-500">
                Supports PDF and DOCX formats up to 25 MB
              </p>
            </div>
          </motion.div>
        )}

        {step !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* File Info */}
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
              <FileText className="text-primary h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-200 truncate">{fileName}</p>
                <p className="text-3xs text-slate-500 font-semibold">{fileSizeStr}</p>
              </div>
            </div>

            {/* Timeline Progress pipeline */}
            <div className="space-y-4">
              
              {/* Step 1: Uploading */}
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  {step === 'uploading' ? (
                    <Loader2 size={14} className="text-primary animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className="text-green-400 stroke-[3]" />
                  )}
                  <span className={step === 'uploading' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    Secure File Upload
                  </span>
                </div>
                {step === 'uploading' && (
                  <span className="text-3xs text-slate-400 font-mono">{progress}%</span>
                )}
              </div>
              {step === 'uploading' && (
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}

              {/* Step 2: Parsing Layout */}
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  {step === 'uploading' ? (
                    <div className="h-2 w-2 rounded-full bg-slate-700 mx-1" />
                  ) : step === 'parsing' ? (
                    <Loader2 size={14} className="text-cyan-400 animate-spin" />
                  ) : step === 'error' && errorMessage.includes('parse') ? (
                    <AlertTriangle size={14} className="text-red-400" />
                  ) : (
                    <CheckCircle2 size={14} className={step === 'completed' || step === 'extracting' ? 'text-green-400 stroke-[3]' : 'text-slate-700'} />
                  )}
                  <span className={step === 'parsing' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    Extracting Document Structure
                  </span>
                </div>
              </div>

              {/* Step 3: Metadata Extraction */}
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  {step === 'uploading' || step === 'parsing' ? (
                    <div className="h-2 w-2 rounded-full bg-slate-700 mx-1" />
                  ) : step === 'extracting' ? (
                    <Loader2 size={14} className="text-indigo-400 animate-spin" />
                  ) : (
                    <CheckCircle2 size={14} className={step === 'completed' ? 'text-green-400 stroke-[3]' : 'text-slate-700'} />
                  )}
                  <span className={step === 'extracting' ? 'text-slate-200 font-semibold' : 'text-slate-500'}>
                    Parsing Entities & Key Dates
                  </span>
                </div>
              </div>

              {/* Step 4: Finished / Error */}
              {step === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-green-500/10 bg-green-500/5 p-4 flex items-center gap-3 text-green-400"
                >
                  <CheckCircle2 size={20} className="shrink-0 stroke-[2.5]" />
                  <div>
                    <p className="text-xs font-bold">Parsing Process Complete</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Redirecting to Contract Vault...</p>
                  </div>
                </motion.div>
              )}

              {step === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 space-y-3"
                >
                  <div className="flex items-start gap-3 text-red-400">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">Ingestion Pipeline Failed</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep('idle')}
                    className="rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-3xs font-semibold px-3 py-1.5 transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContractUploader;
