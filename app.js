const CONFIG = require("./config.json");

const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("assets"));

app.set("view engine", "ejs");

// Ganti dengan URL yang benar untuk Google Apps Script
const BASE_URL = CONFIG.BASE_URL;

// Render halaman utama dengan form
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/jobdesk", (req, res) => {
  res.render("jobdesk");
});

app.get("/edit", (req, res) => {
  res.render("edit");
});

app.get("/attendance", (req, res) => {
  res.render("attendance");
});

// Handle all actions: add, update, delete, addMany, updateMany, deleteMany
app.post("/handleData", async (req, res) => {
  try {
    const { sheetName, action, payload } = req.body;

    console.log("Request body:", req.body);

    if (!sheetName || !action || !payload) {
      return res.status(400).send("Invalid input data");
    }

    const requestData = {
      sheetName: sheetName,
      action: action,
      payload: payload.bulkData ? JSON.parse(payload.bulkData) : [], // Memastikan ini dalam format array JSON
    };

    let route;
    let data = { sheetName: sheetName };

    // Tentukan route berdasarkan aksi
    switch (action) {
      case "add":
        route = "addData";
        data.data = payload; // Data yang akan ditambahkan
        break;
      case "update":
        route = "updateData";
        data.id = payload.id; // ID dari data yang akan diupdate
        data.data = payload; // Data baru yang akan menggantikan yang lama
        break;
      case "delete":
        route = "deleteData";
        data.id = payload.id; // ID dari data yang akan dihapus
        break;
      case "addMany":
        route = "addManyData";
        data.datas = payload; // Data massal dalam bentuk array
        break;
      case "updateMany":
        route = "updateManyData";
        data.ids = payload.map((p) => p.id); // Ambil ID dari setiap data
        data.datas = payload; // Data baru untuk diupdate
        break;
      case "deleteMany":
        route = "deleteManyData";
        data.ids = payload.map((p) => p.id); // Ambil ID dari data yang akan dihapus
        break;
      default:
        return res.status(400).send("Invalid action");
    }

    // Siapkan konfigurasi untuk permintaan ke Google Apps Script
    const config = {
      method: "post",
      url: `${BASE_URL}`,
      data: { route, ...data },
    };

    const response = await axios(config);
    res.send(`Action "${action}" executed successfully!`);
  } catch (error) {
    res.status(500).send(`Error executing action: ${error.message}`);
  }
});

// Menjalankan server pada port yang tersedia atau 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
