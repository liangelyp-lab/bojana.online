export interface StudioVisualizationTemplate {
  id: string
  name: string
  type: "gallery" | "html"
  html?: string
  galleryOptions?: {
    showLabel: boolean
    showTitle: boolean
    showDescription: boolean
    showCaptions: boolean
    columns: 2 | 3 | 4
    gap: "tight" | "comfortable"
    aspect: "square" | "landscape" | "portrait"
    allowZoom: boolean
  }
}

export const DEFAULT_GALLERY_OPTIONS: NonNullable<StudioVisualizationTemplate["galleryOptions"]> = {
  showLabel: true, showTitle: true, showDescription: true, showCaptions: false,
  columns: 4, gap: "tight", aspect: "square", allowZoom: true,
}

export const VISUALIZATIONS_STORAGE_KEY = "bojana-studio-visualizations"

export function getStudioVisualizationTemplates(): StudioVisualizationTemplate[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(VISUALIZATIONS_STORAGE_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter((item): item is StudioVisualizationTemplate =>
      item && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string" && (item.type === "gallery" || item.type === "html"),
    ).map(item => item.type === "gallery" ? { ...item, galleryOptions: { ...DEFAULT_GALLERY_OPTIONS, ...item.galleryOptions } } : item) : []
  } catch { return [] }
}
