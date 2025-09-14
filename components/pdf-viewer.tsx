"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Loader2 } from "lucide-react"
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
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
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
    setPdfFiles(prev => {
      const newFiles = [...prev, ...pdfFiles]
      // Auto-select the first file if none is selected
      if (!selectedFile && newFiles.length > 0) {
        setSelectedFile(newFiles[0])
      }
      return newFiles
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [selectedFile])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setCurrentPage(1)
  }, [])

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 2))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(numPages - 1, prev + 2))
  }

  return (
    <Card className="h-full flex flex-col min-h-0">
      {/* Content */}
      <div className="flex-1 px-4 pb-4">
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
                <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {/* PDF Viewer */}
            {selectedFile && isPdfReady && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {pdfFiles.map((file, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer hover:bg-secondary whitespace-nowrap flex-shrink-0 ${
                          selectedFile === file ? 'bg-secondary border-primary' : 'border-border'
                        }`}
                        onClick={() => setSelectedFile(file)}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="max-w-32 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex-shrink-0 px-3 py-2"
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden" />
                  </div>
                  {numPages > 0 && (
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToPreviousPage}
                        disabled={currentPage <= 1}
                      >
                        ← Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPage}-{Math.min(currentPage + 1, numPages)} of {numPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={goToNextPage}
                        disabled={currentPage >= numPages - 1}
                      >
                        Next →
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border rounded shadow-lg overflow-auto max-h-full">
                    <Document
                      file={selectedFile}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading PDF...</div>}
                      error={<div className="flex items-center justify-center p-8 text-red-500">Failed to load PDF</div>}
                    >
                      <div className="flex gap-4 p-4">
                        {/* First page */}
                        <Page 
                          pageNumber={currentPage} 
                          width={500} 
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                        {/* Second page (if exists) */}
                        {currentPage + 1 <= numPages && (
                          <Page 
                            pageNumber={currentPage + 1} 
                            width={500} 
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        )}
                      </div>
                    </Document>
                  </div>
                </div>
              </div>
            )}
            
            {selectedFile && !isPdfReady && (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center p-8">
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
