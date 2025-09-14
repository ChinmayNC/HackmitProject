"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading PDF viewer...</div>
})
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="w-4 h-4 animate-spin" /></div>
})

export function PdfViewer() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [zoom, setZoom] = useState(100)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set up PDF.js worker
  useEffect(() => {
    const setupPdf = async () => {
      try {
        const pdfjsModule = await import("react-pdf")
        pdfjsModule.pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`
        setIsPdfReady(true)
      } catch (error) {
        console.error("Failed to setup PDF.js:", error)
      }
    }
    setupPdf()
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf")
    setPdfFiles(prev => [...prev, ...pdfFiles])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setTotalPages(numPages)
    setCurrentPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, newPage)))
  }, [totalPages])

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(Math.max(25, Math.min(200, newZoom)))
  }, [])

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">PDF Viewer</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload PDF
          </Button>
          <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {pdfFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">No PDFs loaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload PDF files to start studying
                </p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF Files
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Uploaded PDFs:</h3>
            <div className="grid grid-cols-1 gap-2">
              {pdfFiles.map((file, index) => (
                <div 
                  key={index} 
                  className={`flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-secondary ${
                    selectedFile === file ? 'bg-secondary border-primary' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1">{file.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
            
            {/* PDF Viewer */}
            {selectedFile && isPdfReady && (
              <div className="mt-4 border rounded p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Preview: {selectedFile.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm min-w-20 text-center">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoomChange(zoom - 25)}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm min-w-12 text-center">{zoom}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleZoomChange(zoom + 25)}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* PDF Content */}
                <div className="bg-white border rounded overflow-auto max-h-96">
                  <Document
                    file={selectedFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading PDF...</div>}
                    error={<div className="flex items-center justify-center p-8 text-red-500">Failed to load PDF</div>}
                  >
                    <Page 
                      pageNumber={currentPage} 
                      width={600 * (zoom / 100)}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                </div>
              </div>
            )}
            
            {selectedFile && !isPdfReady && (
              <div className="mt-4 border rounded p-4">
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Initializing PDF viewer...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
