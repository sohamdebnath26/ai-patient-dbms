import { useState, useRef } from "react";
import { Image as ImageIcon, Plus, Trash2, GitCompareArrows } from "lucide-react";
import { SectionHeading } from "./helpers";
import { formatDate, type ClinicalImage } from "./utils";

interface ClinicalImagesSectionProps {
  images: ClinicalImage[];
  onAdd: (image: ClinicalImage) => void;
  onRemove: (id: string) => void;
}

export function ClinicalImagesSection({ images, onAdd, onRemove }: ClinicalImagesSectionProps) {
  const [compareOpen, setCompareOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onAdd({
      id: `${Date.now()}`,
      url,
      name: file.name,
      uploadedAt: new Date().toISOString(),
      bodyArea: "—",
      diagnosis: "—",
      notes: "",
    });
    if (fileRef.current) fileRef.current.value = "";
  }

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
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
          <Plus className="h-4 w-4" />
          Upload Image
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
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
                <p>Body Area: {img.bodyArea}</p>
                <p>Diagnosis: {img.diagnosis}</p>
                <button
                  type="button"
                  onClick={() => {
                    onRemove(img.id);
                  }}
                  className="mt-1 inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
