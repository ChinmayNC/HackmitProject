"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, FileText, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [activeTab, setActiveTab] = useState<string>("")
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

    const newPdfFiles = Array.from(files).filter(file => file.type === "application/pdf")
    setPdfFiles(prev => [...prev, ...newPdfFiles])
    
    // Set the first new file as active tab
    if (newPdfFiles.length > 0 && !activeTab) {
      setActiveTab(newPdfFiles[0].name)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [activeTab])

  const closeTab = useCallback((fileName: string) => {
    setPdfFiles(prev => prev.filter(file => file.name !== fileName))
    if (activeTab === fileName) {
      const remainingFiles = pdfFiles.filter(file => file.name !== fileName)
      setActiveTab(remainingFiles.length > 0 ? remainingFiles[0].name : "")
    }
  }, [activeTab, pdfFiles])

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
      <div className="flex-1 flex flex-col">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab List */}
            <div className="border-b px-4">
              <TabsList className="w-full justify-start h-auto p-1">
                {pdfFiles.map((file) => (
                  <div key={file.name} className="flex items-center">
                    <TabsTrigger value={file.name} className="flex items-center gap-2 max-w-48">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{file.name}</span>
                    </TabsTrigger>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => closeTab(file.name)} 
                      className="w-6 h-6 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </TabsList>
            </div>

            {/* PDF Content for each tab */}
            {pdfFiles.map((file) => (
              <TabsContent key={file.name} value={file.name} className="flex-1 m-0 p-4">
                {isPdfReady ? (
                  <div className="h-full flex flex-col">
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
                    
                    {/* PDF Content - Full Height */}
                    <div className="flex-1 bg-white border rounded overflow-auto">
                      <Document
                        file={file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin mr-2" />Loading PDF...</div>}
                        error={<div className="flex items-center justify-center p-8 text-red-500">Failed to load PDF</div>}
                      >
                        <Page 
                          pageNumber={currentPage} 
                          width={800 * (zoom / 100)}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </Document>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Initializing PDF viewer...</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Card>
  )
}
