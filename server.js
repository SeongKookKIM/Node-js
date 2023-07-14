const express = require("express");
const app = express();
// npm install body-parser할 경우
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({ extended: true }));

// 이 코드가 있어야 req.body가능
app.use(express.urlencoded({ extended: true }));

// EJS
app.set("view engine", "ejs");

// MongoDB
var db;
const MongoClient = require("mongodb").MongoClient;
MongoClient.connect(
  "mongodb+srv://admin:tlqkfdk2@@cluster0.n6phqup.mongodb.net/?retryWrites=true&w=majority",
  (에러, client) => {
    if (에러) {
      return console.log(에러);
    }
    db = client.db("todoapp");

    // db.collection("post").insertOne(
    //   { name: "Sam", age: 28, _id: 100 },
    //   (에러, 결과) => {
    //     console.log("저장완료");
    //   }
    // );
  }
);

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
// app.post("/add", (req, res) => {
//   res.send("전송완료");
//   console.log(req.body);
// });
app.post("/add", (req, res) => {
  res.send("전송완료");
  db.collection("post").insertOne(req.body, (err, result) => {
    console.log("저장완료");
  });
});

// DB데이터 html로 보내기
app.get("/list", (요청, 응답) => {
  응답.render("list.ejs");
});
