import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import * as pdfjsLib from 'pdfjs-dist';
import { Upload, Camera, FileText, Check, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';

// Configure pdf.js worker using CDN to avoid bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version || '3.4.120'}/build/pdf.worker.min.js`;

export default function UploadZone({ onAnalysisComplete }) {
  const [isMobile, setIsMobile] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('');

  const fileInputRef = useRef(null);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // PDF Rasterization Helper
  const rasterizePdf = async (pdfFile) => {
    setLoadingStatus('Rasterizing PDF page 1...');
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 }); // Render at 2x scale for quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      // Convert canvas to Blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.85);
      });
    } catch (err) {
      console.error('PDF rasterization failed:', err);
      throw new Error('Could not parse the PDF file. Make sure it is not password protected.');
    }
  };

  // Image Compression Helper
  const compressImage = async (imageFile) => {
    setLoadingStatus('Compressing image...');
    // Options according to Device-Aware Input rules (Rule 22)
    const options = {
      maxSizeMB: 1.0,
      maxWidthOrHeight: isMobile ? 800 : 1200,
      useWebWorker: true,
      initialQuality: isMobile ? 0.7 : 0.8
    };
    
    try {
      const compressed = await imageCompression(imageFile, options);
      console.log(`Original size: ${(imageFile.size / 1024 / 1024).toFixed(2)}MB, Compressed size: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
      return compressed;
    } catch (err) {
      console.error('Image compression failed:', err);
      return imageFile; // Fallback to original if compression fails
    }
  };

  // Main file processor
  const processFile = async (rawFile) => {
    setError(null);
    if (!rawFile) return;

    // Validate client-side before processing
    const isPdfType = rawFile.type === 'application/pdf' || rawFile.name.endsWith('.pdf');
    const isImageType = ['image/jpeg', 'image/png'].includes(rawFile.type) || rawFile.name.endsWith('.jpg') || rawFile.name.endsWith('.jpeg') || rawFile.name.endsWith('.png');

    if (!isPdfType && !isImageType) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or PDF.');
      return;
    }

    if (rawFile.size > 5 * 1024 * 1024) {
      setError('File exceeds 5MB. Please upload a smaller receipt.');
      return;
    }

    setFile(rawFile);
    setIsPdf(isPdfType);

    // Setup local preview URL for images or rasterized views
    if (isImageType) {
      const localUrl = URL.createObjectURL(rawFile);
      setPreviewUrl(localUrl);
    } else if (isPdfType) {
      // Create local preview if not mobile. On mobile we shouldn't have PDF anyway.
      setPreviewUrl(null);
    }
  };

  // Trigger file submission
  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    try {
      let fileToUpload = file;

      // 1. Handle PDF rasterization if desktop
      if (isPdf) {
        fileToUpload = await rasterizePdf(file);
      }

      // 2. Compress image
      fileToUpload = await compressImage(fileToUpload);

      // 3. Upload to server
      setLoadingStatus('Uploading and analyzing receipt with Groq AI...');
      const formData = new FormData();
      // Use the rasterized image name if it was a PDF
      const finalName = isPdf ? 'rasterized_receipt.jpg' : file.name;
      const finalType = isPdf ? 'image/jpeg' : file.type;

      formData.append('receipt', fileToUpload, finalName);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
        // Optional Auth header if we add Supabase auth later
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Receipt analysis failed.');
      }

      onAnalysisComplete(data);

    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during receipt processing.');
      // Keep file so they can retry
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setError(null);
  };

  // Drag-and-drop event handlers (Desktop only)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current.click();
    }
  };

  // Render mobile camera capture confirm flow
  if (isMobile && file && previewUrl) {
    return (
      <div className="glass-panel rounded-2xl p-6 flex flex-col items-center max-w-md mx-auto animate-fade-in shadow-xl">
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Camera className="text-emerald-400" /> Confirm Receipt Photo
        </h2>
        
        <div className="w-full aspect-[4/5] rounded-xl overflow-hidden mb-6 relative border border-slate-700 bg-slate-950 shadow-inner">
          <img 
            src={previewUrl} 
            alt="Receipt preview" 
            className="w-full h-full object-contain"
          />
        </div>

        {error && (
          <div className="flex gap-2 items-start bg-red-950/40 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm mb-4 w-full" role="alert">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-4 w-full">
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition"
          >
            <RotateCcw size={18} /> Retake
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-800 disabled:text-slate-400 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-950/30"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Analyzing...
              </>
            ) : (
              <>
                <Check size={18} /> Looks Good
              </>
            )}
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-400 mt-4 animate-pulse" aria-live="polite">
            {loadingStatus}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* File input (hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        id="receipt-file-input"
        className="hidden"
        accept={isMobile ? "image/*" : "image/jpeg, image/png, application/pdf"}
        capture={isMobile ? "environment" : undefined}
        onChange={handleFileChange}
      />

      {isMobile ? (
        // Mobile UI - Tap target camera button only, no drag-drop
        <div className="flex flex-col items-center">
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={loading}
            className="w-48 h-48 rounded-full bg-slate-800/80 hover:bg-slate-800 border-2 border-emerald-500/50 hover:border-emerald-400 flex flex-col items-center justify-center gap-3 transition shadow-xl hover:shadow-emerald-950/20 active:scale-95 group focus-visible:ring-4"
            aria-label="Scan receipt using camera"
          >
            <div className="p-4 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition">
              <Camera size={40} className="text-emerald-400" />
            </div>
            <span className="text-slate-200 font-semibold text-lg">Scan Receipt</span>
          </button>
          <p className="text-slate-400 text-sm mt-4 text-center">
            Tap the button to take a photo of your receipt using the phone camera.
          </p>
        </div>
      ) : (
        // Desktop UI - Drag and drop zone with PDF/image support
        <div className="flex flex-col gap-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            className={`glass-panel-interactive rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : file 
                  ? 'border-emerald-500/40 bg-slate-800/30' 
                  : 'border-slate-700 bg-slate-800/10'
            }`}
            role="button"
            aria-label="Upload receipt image or PDF file. Press space or enter to browse."
          >
            {file ? (
              <div className="flex flex-col items-center text-center">
                {isPdf ? (
                  <div className="p-4 bg-red-500/10 rounded-full mb-4">
                    <FileText size={36} className="text-red-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-slate-800 border border-slate-700 rounded-xl mb-4 max-h-36 overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Selected receipt" 
                      className="h-28 object-contain rounded-lg"
                    />
                  </div>
                )}
                
                <h3 className="font-semibold text-slate-100 mb-1 max-w-sm truncate" aria-label={`Selected file: ${file.name}`}>
                  {file.name}
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold rounded-lg transition"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-emerald-950/20 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Analyzing...
                      </>
                    ) : (
                      'Analyze Footprint'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-emerald-500/10 rounded-full mb-4 group-hover:scale-110 transition">
                  <Upload size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-200 mb-1">
                  Drag and drop your receipt here
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  or click to select from files
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                  <span className="flex items-center gap-1"><FileText size={12} /> PDF</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span>PNG</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span>JPG</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  <span>Max 5MB</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && !previewUrl && (
        <div className="flex gap-2 items-start bg-red-950/40 border border-red-500/30 rounded-xl p-4 text-red-200 text-sm mt-4 animate-fade-in" role="alert">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && !previewUrl && (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <Loader2 className="animate-spin text-emerald-400 mb-3" size={32} />
          <p className="text-slate-200 font-semibold" aria-live="polite">{loadingStatus}</p>
        </div>
      )}
    </div>
  );
}
