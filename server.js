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

//ENV 파일
require("dotenv").config();

// bcrypt(비밀번호 암호화)
const bcrypt = require("bcrypt");

// MongoDB
var db;
const MongoClient = require("mongodb").MongoClient;
MongoClient.connect(process.env.MONGO, (에러, client) => {
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
});

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

// Session 로그인 방식
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/login", function (요청, 응답) {
  응답.render("login.ejs");
});

// 로그인시에만 마이페이지가 보이게
app.get("/mypage", 로그인했니, function (요청, 응답) {
  // 요청.user(user의 db 정보)
  // console.log(요청.user);
  응답.render("mypage.ejs", { 사용자: 요청.user });
});
function 로그인했니(요청, 응답, next) {
  if (요청.user) {
    next(); //통과
  } else {
    응답.send("로그인을 안하셨습니다.");
  }
}

// passport를 사용하여 아이디 비번 검사
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (요청, 응답) {
    응답.redirect("/");
  }
);

// 정보 검사
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (입력한아이디, 입력한비번, done) {
      //console.log(입력한아이디, 입력한비번);
      db.collection("login").findOne(
        { id: 입력한아이디 },
        function (에러, 결과) {
          if (에러) return done(에러);

          const result = bcrypt.compareSync(입력한비번, 결과.pw);

          if (!결과)
            return done(null, false, { message: "존재하지않는 아이디요" });
          if (result) {
            return done(null, 결과);
          } else {
            return done(null, false, { message: "비번틀렸어요" });
          }
        }
      );
    }
  )
);

// 세션을 저장시키는 코드(로그인시 발동)-위에 코드에 결과 === user
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (아이디, done) {
  db.collection("login").findOne({ id: 아이디 }, function (에러, 결과) {
    done(null, 결과);
  });
});

// 회원가입
app.get("/sign", (요청, 응답) => {
  응답.render("sign.ejs");
});
app.post("/sign", (요청, 응답) => {
  const hashed = bcrypt.hashSync(요청.body.pw, 10);
  let signUp = { id: 요청.body.id, pw: hashed };
  db.collection("login").insertOne(signUp, (에러, 결과) => {
    if (에러) return console.log(에러);
    응답.redirect("/login");
  });
});
