"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, X, FileText, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false })
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false })
const pdfjs = dynamic(() => import("react-pdf").then((mod) => mod.pdfjs), { ssr: false })

interface PdfTab {
  id: string
  name: string
  file: File
  fileUrl: string
  currentPage: number
  totalPages: number
  zoom: number
  rotation: number
  loading: boolean
  error: string | null
}

interface HighlightPopoverProps {
  selectedText: string
  position: { x: number; y: number }
  onClose: () => void
}

function HighlightPopover({ selectedText, position, onClose }: HighlightPopoverProps) {
  const [definition, setDefinition] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const getDefinition = async () => {
    if (isLoading || definition) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/llm/define", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: selectedText,
          context: "academic study context",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDefinition(data.summary || `"${selectedText}" - Definition not available at the moment.`)
      } else {
        const errorText = response.status === 429 
          ? "Too many requests. Please wait a moment before trying again."
          : response.status >= 500
          ? "AI service is temporarily unavailable. Please try again later."
          : "Unable to fetch definition right now. Please try again."
        setDefinition(`"${selectedText}" - ${errorText}`)
      }
    } catch (error) {
      console.error("Error fetching definition:", error)
      setDefinition(`"${selectedText}" - Network error. Please check your connection and try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Popover open={true} onOpenChange={onClose}>
      <PopoverTrigger asChild>
        <div className="absolute w-1 h-1 pointer-events-none" style={{ left: position.x, top: position.y }} />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Selected Text</h4>
            <Button variant="ghost" size="icon" onClick={onClose} className="w-6 h-6">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm bg-secondary p-2 rounded">"{selectedText}"</div>

          {!definition && !isLoading && (
            <Button onClick={getDefinition} size="sm" className="w-full">
              Get AI Definition
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Getting definition...</span>
            </div>
          )}

          {definition && <div className="text-sm text-muted-foreground">{definition}</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PdfViewer() {
  const [pdfTabs, setPdfTabs] = useState<PdfTab[]>([])
  const [activeTab, setActiveTab] = useState<string>("")
  const [selectedText, setSelectedText] = useState<string>("")
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number } | null>(null)
  const [isPdfReady, setIsPdfReady] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Set up PDF.js worker on client side
  useEffect(() => {
    const setupPdf = async () => {
      const pdfjsModule = await import("react-pdf")
      pdfjsModule.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsModule.pdfjs.version}/build/pdf.worker.min.js`
      setIsPdfReady(true)
    }
    setupPdf()
  }, [])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type === "application/pdf") {
        const fileUrl = URL.createObjectURL(file)
        const newTab: PdfTab = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          file,
          fileUrl,
          currentPage: 1,
          totalPages: 1, // Will be updated when PDF loads
          zoom: 100,
          rotation: 0,
          loading: true,
          error: null,
        }

        setPdfTabs((prev) => [...prev, newTab])
        setActiveTab(newTab.id)
      }
    })

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [])

  const closeTab = useCallback(
    (tabId: string) => {
      setPdfTabs((prev) => {
        const tabToClose = prev.find((tab) => tab.id === tabId)
        if (tabToClose) {
          // Clean up the object URL to prevent memory leaks
          URL.revokeObjectURL(tabToClose.fileUrl)
        }
        
        const newTabs = prev.filter((tab) => tab.id !== tabId)
        if (activeTab === tabId && newTabs.length > 0) {
          setActiveTab(newTabs[0].id)
        } else if (newTabs.length === 0) {
          setActiveTab("")
        }
        return newTabs
      })
    },
    [activeTab],
  )

  const updateTab = useCallback((tabId: string, updates: Partial<PdfTab>) => {
    setPdfTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab)))
  }, [])

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setSelectedText(selection.toString().trim())
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })
    }
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }, tabId: string) => {
    updateTab(tabId, {
      totalPages: numPages,
      loading: false,
      error: null,
    })
  }, [updateTab])

  const onDocumentLoadError = useCallback((error: Error, tabId: string) => {
    updateTab(tabId, {
      loading: false,
      error: error.message,
    })
  }, [updateTab])

  const activeTabData = pdfTabs.find((tab) => tab.id === activeTab)

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

      {pdfTabs.length === 0 ? (
        // Empty State
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium mb-2">No PDFs loaded</h3>
              <p className="text-muted-foreground mb-4">
                Upload PDF files to start studying with AI-powered definitions
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload PDF Files
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // PDF Tabs Interface
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            {/* Tab List */}
            <div className="border-b">
              <ScrollArea className="w-full">
                <TabsList className="w-full justify-start h-auto p-1">
                  {pdfTabs.map((tab) => (
                    <div key={tab.id} className="flex items-center">
                      <TabsTrigger value={tab.id} className="flex items-center gap-2 max-w-48">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">{tab.name}</span>
                      </TabsTrigger>
                      <Button variant="ghost" size="icon" onClick={() => closeTab(tab.id)} className="w-6 h-6 ml-1">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>

            {/* PDF Controls */}
            {activeTabData && (
              <div className="flex items-center justify-between p-2 border-b bg-secondary/50">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateTab(activeTab, {
                        currentPage: Math.max(1, activeTabData.currentPage - 1),
                      })
                    }
                    disabled={activeTabData.currentPage <= 1}
                    className="w-8 h-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={activeTabData.currentPage}
                      onChange={(e) => {
                        const page = Number.parseInt(e.target.value) || 1
                        updateTab(activeTab, {
                          currentPage: Math.max(1, Math.min(activeTabData.totalPages, page)),
                        })
                      }}
                      className="w-16 h-8 text-center"
                      min={1}
                      max={activeTabData.totalPages}
                    />
                    <span className="text-sm text-muted-foreground">/ {activeTabData.totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateTab(activeTab, {
                        currentPage: Math.min(activeTabData.totalPages, activeTabData.currentPage + 1),
                      })
                    }
                    disabled={activeTabData.currentPage >= activeTabData.totalPages}
                    className="w-8 h-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateTab(activeTab, {
                        zoom: Math.max(25, activeTabData.zoom - 25),
                      })
                    }
                    className="w-8 h-8"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>

                  <span className="text-sm min-w-12 text-center">{activeTabData.zoom}%</span>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateTab(activeTab, {
                        zoom: Math.min(200, activeTabData.zoom + 25),
                      })
                    }
                    className="w-8 h-8"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      updateTab(activeTab, {
                        rotation: (activeTabData.rotation + 90) % 360,
                      })
                    }
                    className="w-8 h-8"
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* PDF Content */}
            <div className="flex-1">
              {pdfTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="h-full m-0">
                  <div
                    className="h-full bg-gray-100 flex items-center justify-center relative overflow-auto"
                    onMouseUp={handleTextSelection}
                  >
                    {tab.loading && (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading PDF...</p>
                      </div>
                    )}

                    {tab.error && (
                      <div className="flex flex-col items-center gap-4 p-8">
                        <FileText className="w-12 h-12 text-destructive" />
                        <div className="text-center">
                          <p className="font-medium text-destructive">Failed to load PDF</p>
                          <p className="text-sm text-muted-foreground mt-1">{tab.error}</p>
                        </div>
                      </div>
                    )}

                    {!tab.loading && !tab.error && isPdfReady && (
                      <div
                        className="bg-white shadow-lg border max-w-full max-h-full overflow-auto"
                        style={{
                          transform: `scale(${tab.zoom / 100}) rotate(${tab.rotation}deg)`,
                          transformOrigin: "center center",
                        }}
                      >
                        <Document
                          file={tab.fileUrl}
                          onLoadSuccess={(pdf) => onDocumentLoadSuccess(pdf, tab.id)}
                          onLoadError={(error) => onDocumentLoadError(error, tab.id)}
                          loading={
                            <div className="flex items-center justify-center p-8">
                              <Loader2 className="w-6 h-6 animate-spin mr-2" />
                              <span>Loading PDF...</span>
                            </div>
                          }
                          error={
                            <div className="flex flex-col items-center gap-2 p-8">
                              <FileText className="w-8 h-8 text-destructive" />
                              <span className="text-sm text-destructive">Failed to load PDF</span>
                            </div>
                          }
                        >
                          <Page
                            pageNumber={tab.currentPage}
                            width={800}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                          />
                        </Document>
                      </div>
                    )}

                    {!tab.loading && !tab.error && !isPdfReady && (
                      <div className="flex flex-col items-center gap-4 p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Initializing PDF viewer...</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      )}

      {/* Text Selection Popover */}
      {selectedText && popoverPosition && (
        <HighlightPopover
          selectedText={selectedText}
          position={popoverPosition}
          onClose={() => {
            setSelectedText("")
            setPopoverPosition(null)
          }}
        />
      )}
    </Card>
  )
}
