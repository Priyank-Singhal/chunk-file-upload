import express from "express";
import cors from "cors";
import multer from 'multer'
import fs from "fs";

const app = express();
app.use(cors());

const upload = multer({ dest: './uploads/' });
app.use(express.static('public'));

app.post('/upload', upload.single('helmFile'), (req, res) => {
  const { file, body } = req;

  const originalName = body.name;
  const chunkIndex = Number(body.index);
  const totalChunks = Number(body.totalChunks);
  const tempFilePath = file.path;
  const destFolder = 'uploads/';
  const destFilePath = destFolder + originalName;

  // Create the destination folder if it doesn't exist
  if (!fs.existsSync(destFolder)) {
    fs.mkdirSync(destFolder);
  }

  // Append the chunk to the file
  fs.appendFileSync(destFilePath, fs.readFileSync(tempFilePath));

  // Delete the temporary chunk file
  fs.unlinkSync(tempFilePath);

  // Check if all chunks have been uploaded
  if (chunkIndex === totalChunks - 1) {
    // All chunks have been uploaded, the file is complete
    console.log('File upload complete:', originalName);
    // Perform any further processing or saving of the file here
    const finalFilePath = destFolder + 'final_' + originalName;
    fs.renameSync(destFilePath, finalFilePath);
    console.log('File saved:', finalFilePath);
  } else {
    console.log('Chunk uploaded:', originalName, chunkIndex);
  }

  res.json({ message: 'Chunk uploaded successfully.' });
});

app.delete('/upload/:filename', (req, res) => {
  const { filename } = req.params;
  const destFolder = 'uploads/';
  const destFilePath = destFolder + filename;

  if (fs.existsSync(destFilePath)) {
    fs.unlinkSync(destFilePath);
    console.log('File deleted:', destFilePath);
    res.json({ message: 'File deleted successfully.' });
  } else {
    res.status(404).send('File not found.');
  }
});


app.listen(5000, () => {
  console.log('Server listening on port 5000');
});


