import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './App.css'

function App() {
  const [file, setFile] = useState(null);
  const fileName = useRef();
  const [uploading, setUploading] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [uploadSpeed, setUploadSpeeed] = useState(1024 * 1024);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [uploadPaused, setUploadPaused] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const readFileChunks = () => {
    const chunkSize = uploadSpeed;
    let offset = 0;
    const chunks = [];
    console.log('file size', file.size)
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      chunks.push(chunk);
      offset += chunkSize;
    }
    setUploading(true);
    setChunks(chunks);
  };

  useEffect(() => {
    chunks.length && uploadChunk();
  }, [chunks, currentChunk, uploadPaused])


  const uploadChunk = () => {
    console.log('uploadSpeed', uploadSpeed)
    if (currentChunk < chunks.length) {
      if (uploadPaused) {
        console.log('Upload paused. Current chunk:', currentChunk);
        return;
      }

      const formData = new FormData();
      formData.append('helmFile', chunks[currentChunk]);
      formData.append('name', file.name);
      formData.append('index', currentChunk.toString());
      formData.append('totalChunks', chunks.length.toString());

      axios
        .post('http://localhost:5000/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(((currentChunk + 1) * 100) / chunks.length);
            console.log('progress', progress);
            setUploadProgress(progress);
          },
        })
        .then((response) => {
          console.log('Chunk uploaded:', currentChunk);
          setCurrentChunk(currentChunk + 1);
        })
        .catch((error) => {
          console.error('Error uploading chunk:', currentChunk);
        });
    }
    else {
      setUploading(false);
      setFile(null);
      setChunks([]);
      setCurrentChunk(0);
      console.log('File upload complete.');
    }
  };

  const handleUpload = () => {
    if (file) {
      readFileChunks();
    } else {
      alert('Please select a file to upload.');
    }
  };

  const handlePause = () => {
    setUploadPaused(true);
    console.log('Upload paused. Current chunk:', currentChunk);
  };

  const handleResume = () => {
    setUploadPaused(false);
    console.log('Upload resumed. Current chunk:', currentChunk);
  };

  const handleCancel = () => {
    deleteFile();
    setUploadPaused(false);
    setChunks([]);
    setCurrentChunk(0);
    setUploadProgress(0);
    setUploading(false);
    fileName.current.value = "";
    setFile(null);
  };

  const deleteFile = () => {
    if (file) {
      axios
        .delete(`http://localhost:5000/upload/${file.name}`)
        .then((response) => {
          console.log('File deleted successfully.');
        })
        .catch((error) => {
          console.error('Error deleting file:', error);
        });
    } else {
      alert('No file selected.');
    }
  };

  const handleUploadSpeed = (e) => {
    setUploadSpeeed(parseInt(e.target.value));
  }

  const speedOptions = [
    { value: 1024 * 1024, label: 'Medium' },
    { value: 10240, label: 'Slow' },
    { value: 1024 * 1024 * 5, label: 'Fast' }
  ]

  return (
    <div className='app'>
      <h1>File Upload</h1>
      <h3>Choose the upload speed</h3>
      <select onChange={handleUploadSpeed} disabled={uploading && true}>
        {speedOptions.map((option, index) => {
          return <option key={index} value={option.value} >
            {option.label}
          </option>
        })}
      </select><br />
      <input type="file" onChange={handleFileChange} ref={fileName} />
      <div>
        <button onClick={handleUpload} disabled={!file && true}>Upload</button>
        <button onClick={handlePause} disabled={!uploading && true}>Pause</button>
        <button onClick={handleResume} disabled={!uploading && true}>Resume</button>
        <button onClick={handleCancel} disabled={!uploading && true}>Cancel</button>
        {uploading &&
          <div className='upload-progress'>
            <progress value={uploadProgress} max={100} />
            <span>{uploadProgress === 100 ? "uploaded!" : `${uploadProgress} %`}</span>
          </div>
        }
        {uploadProgress === 100 && <p className='upload-progress'>Uploaded Successfully</p>}
      </div>
    </div>
  );
}

export default App;
