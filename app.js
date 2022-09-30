const express = require("express");

const cors = require("cors");
const { getfiles, deleteFile, uploadFile, SwitchUser, DownloadFolder } = require("./controller");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload'); 

const app = express();

app.use(fileUpload());

app.use(cors());

app.post("/upload",uploadFile);

app.use(bodyParser.json());

app.get("/fetch-files/:path", getfiles);

app.get("/switch-user-drive",SwitchUser)

app.post("/delete-file", deleteFile);

app.get("/download-folder/:path", DownloadFolder);


app.listen(3003, function (err) {
  if (err) {
    console.log("Error while starting server");
    return;
  }
  console.log("App is listening on Port 3003");
});
