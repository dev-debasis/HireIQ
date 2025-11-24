import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
}

export const UploadDropzone = ({ onFilesAccepted }: UploadDropzoneProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAccepted(acceptedFiles);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer transition-colors',
        'hover:border-primary hover:bg-accent',
        isDragActive && 'border-primary bg-accent'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      {isDragActive ? (
        <p className="text-lg font-medium text-foreground">Drop the files here...</p>
      ) : (
        <div>
          <p className="text-lg font-medium text-foreground mb-2">
            Drag & drop PDF resumes here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select files from your computer
          </p>
        </div>
      )}
    </div>
  );
};
