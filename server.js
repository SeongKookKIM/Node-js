const express = require("express");
const app = express();
// npm install body-parser할 경우
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({ extended: true }));

// 이 코드가 있어야 req.body가능
app.use(express.urlencoded({ extended: true }));

app.listen(8080, function () {
  console.log("listening on 8080");
});

app.get("/pet", function (req, res) {
  res.send("펫용품 쇼핑 사이트입니다.");
});

app.get("/beauty", function (req, res) {
  res.send("뷰티용품 사세요!");
});

// html 보내기(GET)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

// POST
app.post("/add", (req, res) => {
  res.send("전송완료");
  console.log(req.body);
});
