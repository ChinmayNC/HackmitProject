"use client"

import { PdfViewer } from "@/components/pdf-viewer"

export default function TestPdfPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">PDF Viewer Test</h1>
        <div className="h-[80vh]">
          <PdfViewer />
        </div>
      </div>
    </div>
  )
}
