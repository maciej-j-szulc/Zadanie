import React, { useRef, useState, ChangeEvent, DragEvent } from "react";

interface DnDProps {
    setLapInfo: React.Dispatch<React.SetStateAction<any>>;
  }

export default function DnD({ setLapInfo }: DnDProps) {

    
  const [files, setFiles] = useState<FileList | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      setFiles(event.dataTransfer.files);
    }
  };


  const handleUpload = () => {
    if(files) {
        const fileReader = new FileReader();

        fileReader.onload = (e) => {
            try {
                const jsonContent = JSON.parse(e.target?.result as string)

                setLapInfo(jsonContent);
            } catch (error) {
                console.error("Error parsing JSON file:", error);
            }
        };
        fileReader.readAsText(files[0]);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
    }
  };

  if (files) {
    return (
      <div className="uploads">
        <ul>
          {Array.from(files).map((file, idx) => (
            <li key={idx}>{file.name} </li>
          ))}
        </ul>
        <div className="actions">
          <button onClick={() => setFiles(null)}>Cancel</button>
          <button onClick={handleUpload}>Upload</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!files && (
        <div
          className="DnD"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <h1>Drag and Drop</h1>
          <h1>or</h1>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            hidden
            ref={inputRef}
          />
          <button onClick={() => inputRef.current?.click()}>Select Files</button>
        </div>
      )}
    </>
  );
}
