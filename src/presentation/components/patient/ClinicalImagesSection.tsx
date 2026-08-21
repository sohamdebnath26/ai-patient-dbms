import { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  GitCompareArrows,
  Sparkles,
  Loader2,
} from "lucide-react";
import { SectionHeading } from "./helpers";
import { formatDate } from "./utils";

interface ClinicalImage {
  id: string;
  url: string;
  name: string;
  uploadedAt: string;
  bodyArea: string;
  diagnosis: string;
  notes: string;
  analysisStatus?: string;
}

interface ClinicalImagesSectionProps {
  images: ClinicalImage[];
  onAdd?: (file: File) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
  onAnalyze?: (id: string) => Promise<void>;
  isAdding?: boolean;
  isRemoving?: string | null;
  isAnalyzing?: string | null;
}

export function ClinicalImagesSection({
  images,
  onAdd,
  onRemove,
  onAnalyze,
  isAdding,
}: ClinicalImagesSectionProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onAdd) return;
    void onAdd(file);
    if (fileRef.current) fileRef.current.value = "";
  }

  const analysisBadgeClass = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";
      case "processing":
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "failed":
        return "bg-red-50 text-red-600";
      default:
        return "";
    }
  };

  const analysisLabel = (status?: string) => {
    switch (status) {
      case "completed":
        return "Analysis Complete";
      case "processing":
        return "Processing...";
      case "pending":
        return "Pending";
      case "failed":
        return "Analysis Failed";
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <SectionHeading
        icon={<ImageIcon className="h-4 w-4" />}
        title="Clinical Images"
        badge={
          images.length > 0 ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {images.length}
            </span>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2">
        {onAdd && (
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isAdding ? "Uploading..." : "Upload Image"}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
              disabled={isAdding}
            />
          </label>
        )}
        {images.length >= 2 && (
          <button
            type="button"
            onClick={() => {
              setCompareOpen((v) => !v);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <GitCompareArrows className="h-4 w-4" />
            Compare
          </button>
        )}
      </div>

      {compareOpen && images.length >= 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.slice(0, 2).map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200">
              <img src={img.url} alt={img.name} className="h-48 w-full object-cover" />
              <p className="px-3 py-2 text-xs text-gray-600">{img.name}</p>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-sm text-gray-400">No clinical images uploaded.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-lg border border-gray-200">
              <img src={img.url} alt={img.name} className="h-32 w-full object-cover" />
              <div className="space-y-1 p-3 text-xs text-gray-600">
                <p className="font-medium text-gray-900">{img.name}</p>
                <p>Uploaded: {formatDate(img.uploadedAt)}</p>
                {img.bodyArea && img.bodyArea !== "—" && <p>Body Area: {img.bodyArea}</p>}
                {img.diagnosis && img.diagnosis !== "—" && <p>Diagnosis: {img.diagnosis}</p>}
                {img.analysisStatus && (
                  <p
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${analysisBadgeClass(img.analysisStatus)}`}
                  >
                    {analysisLabel(img.analysisStatus)}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {onAnalyze && (
                    <button
                      type="button"
                      onClick={() => {
                        void onAnalyze(img.id);
                      }}
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-400"
                      title="Image analysis provider not configured"
                    >
                      <Sparkles className="h-3 w-3" />
                      Analyze
                    </button>
                  )}
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => {
                        void onRemove(img.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
