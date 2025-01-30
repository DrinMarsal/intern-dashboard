const CONFIG = require("./config.json");

const express = require("express");
const axios = require("axios");

const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

const BASE_URL = CONFIG.BASE_URL;

app.get("/", (req, res) => {
  var signup = req.query.signup;
  if (signup && signup == "success")
    res.render("login", { signupSuccess: true });
  else res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/home", (req, res) => {
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

app.get("/profile", (req, res) => {
  res.render("profile");
});

app.get("/announcement", (req, res) => {
  res.render("announcement");
});

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
      payload: payload.bulkData ? JSON.parse(payload.bulkData) : [], 
    };

    let route;
    let data = { sheetName: sheetName };

    switch (action) {
      case "add":
        route = "addData";
        data.data = payload; 
        break;
      case "update":
        route = "updateData";
        data.id = payload.id; 
        data.data = payload; 
        break;
      case "delete":
        route = "deleteData";
        data.id = payload.id; 

        break;
      case "addMany":
        route = "addManyData";
        data.datas = payload; 
        break;
      case "updateMany":
        route = "updateManyData";
        data.ids = payload.map((p) => p.id); 
        data.datas = payload; 
        break;
      case "deleteMany":
        route = "deleteManyData";
        data.ids = payload.map((p) => p.id); 
        break;
      default:
        return res.status(400).send("Invalid action");
    }

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

app.post("/login", async (req, res) => {
  const { name, password } = req.body;

  const config = {
    method: "post",
    url: `${BASE_URL}`,
    data: {
      route: "getData",
      sheetName: "users",
    },
  };
  const response = await axios(config);
  var users = response.data.data;
  if (response.data.success) {
    var isLogin = false;
    users.forEach((d) => {
      if (d.name == name && d.password == password) {
        isLogin = true;
      }
    });
    return res.json({
      isLogin,
    });
  } else {
    console.log(error);
    res.json({
      msg: "error",
    });
  }
});

app.post("/signup", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  
  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ error: "Password and confirmation password do not match!" });
  }

  const config = {
    method: "post",
    url: `${BASE_URL}`,
    data: {
      route: "addData",
      sheetName: "users",
      data: {
        name,
        email,
        password,
      },
    },
  };

  try {
    const response = await axios(config);

    if (response.data.success) {
      
      return res.json({
        success: true,
      });
    } else {
      return res.status(400).json({ error: "Signup failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error during signup" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
