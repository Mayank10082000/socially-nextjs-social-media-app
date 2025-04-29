"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

function ImageUpload({ onChange, value }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Prepare form data for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default"); // Set this in your Cloudinary dashboard

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      onChange(data.secure_url); // Cloudinary returns the image URL here
    } catch (error) {
      console.error("Cloudinary upload error:", error);
    }
  };

  if (value) {
    return (
      <div className="relative size-40">
        <Image
          src={value}
          alt="Upload"
          className="rounded-md size-40 object-cover"
          width={160}
          height={160}
        />
        <button
          onClick={() => onChange("")}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="border px-4 py-2 rounded"
      >
        Upload Image
      </button>
    </div>
  );
}
export default ImageUpload;
