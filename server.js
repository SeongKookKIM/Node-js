const express = require("express");
const app = express();
// npm install body-parser할 경우
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({ extended: true }));

// 이 코드가 있어야 req.body가능
app.use(express.urlencoded({ extended: true }));

// EJS
app.set("view engine", "ejs");

// CSS추가
app.use("/public", express.static("public"));

// 라이브러리 MEHTOD-OVERRIDE 설치 셋팅(form에서도 PUT,DELETE사용가능하게함)
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

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
  res.render("index.ejs");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

// POST
// app.post("/add", (req, res) => {
//   res.send("전송완료");
//   console.log(req.body);
// });
app.post("/add", (req, res) => {
  // res.send("전송완료");

  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (에러, 결과) {
      console.log(결과.totalPost);
      var totalpost = 결과.totalPost;

      db.collection("post").insertOne(
        { _id: totalpost + 1, 제목: req.body.title, 날짜: req.body.date },
        (err, result) => {
          console.log("저장완료");

          // Counter totalPost 1증가(updateOner으로 바꿀거 찾은 후 set으로 변경)
          db.collection("counter").updateOne(
            { name: "게시물갯수" },
            { $inc: { totalPost: 1 } },
            function (에러, 결과) {
              if (에러) return console.log(에러);
              console.log("totalPost 증가");
              res.redirect("/list");
            }
          );
        }
      );
    }
  );
});

// DB데이터 html로 보내기
app.get("/list", (요청, 응답) => {
  db.collection("post")
    .find()
    .toArray((에러, 결과) => {
      if (에러) return console.log(에러);
      console.log(결과);
      응답.render("list.ejs", { posts: 결과 });
    });
});

// 삭제요청
app.delete("/delete", (요청, 응답) => {
  console.log(요청.body);
  요청.body._id = parseInt(요청.body._id);
  db.collection("post").deleteOne(요청.body, function (에러, 결과) {
    console.log("삭제완료");
    응답.status(200).send({ message: "성공했습니다" });
  });
});

// Detail(params사용)
app.get("/detail/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      console.log(결과);
      응답.render("detail.ejs", { data: 결과 });
    }
  );
});

// 수정하기
app.get("/edit/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
      응답.render("edit.ejs", { post: 결과 });
    }
  );
});

app.put("/edit", (요청, 응답) => {
  db.collection("post").updateOne(
    { _id: parseInt(요청.body.id) },
    { $set: { 제목: 요청.body.title, 날짜: 요청.body.date } },
    (에러, 결과) => {
      if (에러) return console.log(에러);
      console.log("수정완료");
      응답.redirect("/list");
    }
  );
});
