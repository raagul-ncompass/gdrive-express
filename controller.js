const path = require("path");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");
const fs = require("fs");
// const path = require("path");
const axios = require("axios").default;

const TOKEN_PATH = path.join(process.cwd(), "files/token.json");
let access_token;
const loadSavedCredentialsIfExist = async () => {
  try {
    // console.log(TOKEN_PATH)
    const content = fs.readFileSync(TOKEN_PATH, (err) => {
      console.log(err);
    });

    const credentials = JSON.parse(content);

    access_token = credentials.access_token;
    // console.log(google.auth.fromJSON(credentials));
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
};

const getConnection = async () => {
  const clientloaded = await loadSavedCredentialsIfExist();
  if (clientloaded) {
    return clientloaded;
  }
  const SCOPES = ["https://www.googleapis.com/auth/drive"];
  const client = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: SCOPES,
  }).catch((err)=>console.log(err));
  if (!client.credentials) {
    return null;
  }
  const content = fs.readFileSync(CREDENTIALS_PATH, (err) => {
    console.log(err);
  });
  const keys = JSON.parse(content);
  const key = keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
    access_token: client.credentials.access_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload, (err) => {
    console.log(err);
  });
  return client;
};

const getSharedDrives = async (req, res, next) => {
  try {
    const client = await getConnection();
    const sharedDrives = await axios.get(
      "https://www.googleapis.com/drive/v3/drives",
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-type": "Application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    console.log(sharedDrives.data);
    res.send(sharedDrives.data);
  } catch (err) {
    next(err);
  }
};
const DownloadFolder = async (req, res, next) => {
  try {
    const client = await getConnection();
    const fileId = req.params.path;
    console.log(fileId,client)
    const sharedDrives = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export`,
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-type": "Application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    console.log(sharedDrives.data);
    res.send(sharedDrives.data);
  } catch (err) {
    next(err);
  }
};

const getfiles = async (req, res, next) => {
  try {
    const path = req.params.path;
    // console.log(path);
    const client = await getConnection();
    const drive = google.drive({ version: "v3", auth: client });
    const response = await drive.files
      .list({
        fields: "files(*)",
        q: `'${path}' in parents`,
      })
      .catch((err) => {
        console.log(err);
      });
    const files = response.data.files;
    res.send(files);
  } catch (err) {
    next(err);
  }
};

const SwitchUser = async (req, res, next) => {
  try {
    const path = TOKEN_PATH;
    fs.unlinkSync(path);
    res.send("done!");
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res) => {
  const fileId = req.body.fileID;
  const client = await getConnection();
  const drive = google.drive({ version: "v3", auth: client });
  await drive.files
    .delete({
      fileId: fileId,
    })
    .catch((err) => {
      console.log(err);
    });
  res.send("deleted");
};

const uploadFile = (req, res, next) => {
  let sampleFile = req.files.file;
  let folderId = req.body.path;
  // console.log(folderId);
  let uploadPath = __dirname + "/files/" + sampleFile.name;
  sampleFile.mv(uploadPath, async function (err) {
    if (err) return res.status(500).send(err);
    try {
      const fileLoc = "files/" + sampleFile.name;
      const client = await getConnection().catch((err) => {
        console.log(err);
      });
      const drive = google.drive({ version: "v3", auth: client });
      const fileMetadata = {
        name: sampleFile.name,
        parents: [folderId],
      };
      const media = {
        body: fs.createReadStream(fileLoc),
      };
      const file = await drive.files
        .create({
          resource: fileMetadata,
          media: media,
          fields: "id, name, webContentLink, trashed",
        })
        .catch((err) => {
          console.log(err);
        });
      res.send(file.data);
    } catch (error) {
      next(error);
    }
  });
};

module.exports = {
  getfiles,
  deleteFile,
  getSharedDrives,
  uploadFile,
  SwitchUser,
  DownloadFolder
};
