"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info, Loader2, Download, Upload, Sparkles, Share2 } from "lucide-react"
import Lightbox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"
import { toast } from "sonner"
import { AVAILABLE_MODELS } from "@/lib/models"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function LabelWithTooltip({ id, label, tooltip }: { id?: string, label: string, tooltip: string }) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="w-auto max-w-xs text-sm">
          <p>{tooltip}</p>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function ImageUploadInput({ 
  id, 
  value, 
  onChange, 
  label,
  tooltip
}: { 
  id: string, 
  value: string, 
  onChange: (val: string, fileName?: string) => void, 
  label: string,
  tooltip: string
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [localFileName, setLocalFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      onChange(reader.result as string, file.name)
      setLocalFileName(file.name)
    }
    reader.onerror = () => {
      toast.error("Failed to read file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFile(file)
      } else {
        toast.error("Please upload a valid image file (JPG, PNG, GIF)")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }
  
  const handleClear = () => {
    onChange("", "")
    setLocalFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-2">
      <LabelWithTooltip id={id} label={label} tooltip={tooltip} />
      
      {value ? (
        <div className="relative rounded-lg border bg-background p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted/50">
            <img 
              src={value} 
              alt="Preview" 
              className="h-full w-full object-contain" 
            />
          </div>
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {localFileName || "Image URL"}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              onClick={handleClear}
            >
              Clear file
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-4 text-center transition-colors hover:bg-muted/50",
            isDragging && "border-primary bg-muted"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-background p-3 shadow-sm">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
            </div>
            <div className="text-xs text-muted-foreground">
              SVG, PNG, JPG or GIF
            </div>
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default function Home() {
  const [numOutputs, setNumOutputs] = useState(1)
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  
  // Share State
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareFile, setShareFile] = useState<File | null>(null)
  const [shareUrl, setShareUrl] = useState("")
  const [isPreparingShare, setIsPreparingShare] = useState(false)

  // Form State
  const [replicateModelId, setReplicateModelId] = useState(AVAILABLE_MODELS[0].id)
  const [customModelId, setCustomModelId] = useState("")
  const [prompt, setPrompt] = useState("")
  const [model, setModel] = useState("dev")
  const [outputFormat, setOutputFormat] = useState("webp")
  const [megapixels, setMegapixels] = useState("1")
  const [outputQuality, setOutputQuality] = useState(80)

  const [image, setImage] = useState("")
  const [imageFileName, setImageFileName] = useState("")
  const [mask, setMask] = useState("")
  const [maskFileName, setMaskFileName] = useState("")

  const [promptStrength, setPromptStrength] = useState(0.8)

  const getDimensions = () => {
    if (aspectRatio === "custom") return { w: width, h: height }
    const [w, h] = aspectRatio.split(":").map(Number)
    // Base scale on 1024px
    return { w: 1024, h: Math.round(1024 * (h / w)) }
  }

  const getAspectRatioStyle = (ratio: string) => {
    if (ratio === "custom") return { aspectRatio: `${width} / ${height}` }
    const [w, h] = ratio.split(":").map(Number)
    return { aspectRatio: `${w} / ${h}` }
  }

  const handleGenerate = async () => {
    if (isLoading) return // Prevent double clicks
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image")
      return
    }

    setIsLoading(true)
    setIsGenerated(false)
    setGeneratedImages([])

    const finalModelId = replicateModelId === "custom" ? customModelId : replicateModelId

    const formData = new FormData()
    formData.append("prompt", prompt)
    formData.append("output_format", outputFormat)
    formData.append("num_outputs", numOutputs.toString())
    formData.append("output_quality", outputQuality.toString())
    if (image) formData.append("image", image)


    const result = await generateImage(formData)

    if (result.success) {
      setGeneratedImages(Array.isArray(result.output) ? result.output : [result.output])
      setIsGenerated(true)
    } else {
      console.error(result.error)
      toast.error(result.error || "Failed to generate image. Please try again.")
    }
    setIsLoading(false)
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const filename = `generated-image-${index + 1}.${outputFormat}`
      const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
      if (!response.ok) throw new Error('Network response was not ok')
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      toast.success("Image downloaded successfully")
    } catch (error) {
      console.error('Download failed:', error)
      toast.error("Download failed. Please try again.")
    }
  }

  const handleShare = async (url: string, index: number) => {
    const filename = `generated-image-${index + 1}.${outputFormat}`
    setShareUrl(url)
    
    // Check if we can share files
    if (navigator.canShare && navigator.canShare({ files: [new File([], 'test.png')] })) {
      setIsPreparingShare(true)
      toast.info("Preparing image for sharing...")
      
      try {
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&filename=${filename}`)
        if (response.ok) {
          const blob = await response.blob()
          const file = new File([blob], filename, { type: blob.type })
          setShareFile(file)
          setShareDialogOpen(true)
          setIsPreparingShare(false)
          return
        }
      } catch (error) {
        console.warn("File preparation failed", error)
      }
      setIsPreparingShare(false)
    }

    // Fallback to Link Sharing immediately if file sharing isn't supported or failed
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'GoKAnI AI Generation',
          text: 'Check out this image I generated with GoKAnI AI!',
          url: url
        })
        toast.success("Shared link successfully")
        return
      }
    } catch (error) {
      console.warn("Link sharing failed", error)
    }

    // Fallback to Clipboard
    try {
      await navigator.clipboard.writeText(url)
      toast.info("Sharing failed, link copied to clipboard instead!")
    } catch (clipboardError) {
      toast.error("Failed to share. Try downloading instead.")
    }
  }

  const executeShare = async () => {
    if (!shareFile) return
    
    try {
      await navigator.share({
        title: 'GoKAnI AI Generation',
        text: 'Check out this image I generated with GoKAnI AI!',
        files: [shareFile]
      })
      toast.success("Shared image successfully")
      setShareDialogOpen(false)
    } catch (error: any) {
      console.warn("Share execution failed", error)
      
      // If user cancelled, just close dialog
      if (error.name === 'AbortError') {
        setShareDialogOpen(false)
        return
      }

      // Fallback to link sharing
      if (shareUrl) {
        try {
          await navigator.share({
            title: 'GoKAnI AI Generation',
            text: 'Check out this image I generated with GoKAnI AI!',
            url: shareUrl
          })
          setShareDialogOpen(false)
          return
        } catch (e) {
           // ignore
        }
      }
      
      toast.error("Sharing failed. Try downloading instead.")
      setShareDialogOpen(false)
    }
  }

  const handleDownloadAll = async () => {
    toast.info("Starting download of all images...")
    for (let i = 0; i < generatedImages.length; i++) {
      await handleDownload(generatedImages[i], i)
      // Small delay to prevent browser blocking
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  const { w, h } = getDimensions()
  const slides = generatedImages.map((src) => ({
    src,
    width: w,
    height: h,
  }))

  return (
    <div className="flex flex-col w-full">
      <div className="container mx-auto py-10 px-[10px] space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Prompt & Model Settings */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardContent className="space-y-4 flex-1 pt-[5px]">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <LabelWithTooltip 
                  id="prompt" 
                  label="Prompt" 
                  tooltip="Prompt for generated image. If you include the `trigger_word` used in the training process you are more likely to activate the trained object, style, or concept in the resulting image." 
                />
              </div>
              <Textarea 
                id="prompt" 
                placeholder="Enter your prompt here..." 
                className="h-24" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            
            <div aria-hidden="true" style={{ height: "20px" }} />

            <div className="space-y-2">
              <LabelWithTooltip
                label={`Num Outputs (${numOutputs})`}
                tooltip="Number of outputs to generate"
              />
              <Slider
                value={[numOutputs]}
                onValueChange={(vals: number[]) => setNumOutputs(vals[0])}
                min={1}
                max={4}
                step={1}
              />
            </div>

            <div aria-hidden="true" style={{ height: "20px" }} />

            <ImageUploadInput
              id="image_url"
              label="Image (Img2Img)"
              tooltip="Input image for image to image or inpainting mode. If provided, aspect_ratio, width, and height inputs are ignored."
              value={image}
              onChange={(val, name) => {
                setImage(val)
                if (name) setImageFileName(name)
              }}
            />

            <div aria-hidden="true" style={{ height: "20px" }} />

            <div className="flex justify-center">
              <Button
                className="h-auto p-[3px]"
                style={{ fontFamily: "var(--font-rock-salt)", fontSize: "24px" }}
              >
                Generate Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Image Uploads */}
        <Card className="shadow-[0px_0px_7px_3px_rgba(28,156,240,0.8)] h-full">
          <CardContent className="space-y-4 flex-1">
            <div className="flex flex-col items-center pb-12">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">Creating your masterpiece...</p>
                </div>
              ) : (
                <>
                  {generatedImages.length > 1 && (
                    <Button onClick={handleDownloadAll} variant="secondary" className="mb-8">
                      <Download className="mr-2 h-4 w-4" />
                      Download All ({generatedImages.length})
                    </Button>
                  )}
                  <div className="flex flex-wrap justify-center items-center gap-8">
                    {generatedImages.map((src, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div
                          className="relative rounded-lg flex items-center justify-center w-full max-w-md shadow-sm cursor-pointer transition-colors"
                          style={getAspectRatioStyle(aspectRatio)}
                          onClick={() => {
                            setLightboxIndex(i)
                            setLightboxOpen(true)
                          }}
                        >
                          <img
                            src={src}
                            alt={`Generated image ${i + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex gap-2 w-full max-w-md">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(src, i)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleShare(src, i)}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={slides}
      />

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ready to Share</DialogTitle>
            <DialogDescription>
              Your image has been prepared. Click the button below to share it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={executeShare}>Share Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}