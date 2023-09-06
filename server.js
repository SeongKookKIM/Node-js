const express = require("express");
const app = express();
// npm install body-parser할 경우
// const bodyParser = require("body-parser");
// app.use(bodyParser.urlencoded({ extended: true }));

// 이 코드가 있어야 req.body가능(요청.body)
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

// Web Socket.io
const http = require("http").createServer(app);
const { Server } = require("socket.io");
const io = new Server(http);

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

// ObjectId로 변형시키는거
const { ObjectId } = require("mongodb");

http.listen(process.env.PORT, function () {
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

// Detail(params사용)
app.get("/detail/:id", function (요청, 응답) {
  db.collection("post").findOne(
    { _id: parseInt(요청.params.id) },
    function (에러, 결과) {
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
  db.collection("login").findOne({ id: 요청.body.id }, (에러, 결과) => {
    if (에러) return console.log(에러);

    if (!결과) {
      const hashed = bcrypt.hashSync(요청.body.pw, 10);
      let signUp = { id: 요청.body.id, pw: hashed };
      db.collection("login").insertOne(signUp, (에러, 결과) => {
        if (에러) return console.log(에러);
        응답.status(200).redirect("/login");
      });
    } else {
      응답.status(403).send("이미 존재하는 아이디입니다.");
    }
  });
});

// Write
app.post("/add", (req, res) => {
  // res.send("전송완료");

  if (req.user) {
    if (req.body.title == "") {
      res.status(403).send("제목을 입력해주세요");
    } else if (req.body.date == "") {
      res.status(403).send("날짜를 입력해주세요");
    } else {
      db.collection("counter").findOne(
        { name: "게시물갯수" },
        function (에러, 결과) {
          var totalpost = 결과.totalPost;

          let 저장할거 = {
            _id: totalpost + 1,
            제목: req.body.title,
            날짜: req.body.date,
            작성자: req.user._id,
          };

          db.collection("post").insertOne(저장할거, (err, result) => {
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
          });
        }
      );
    }
  } else {
    res.status(403).send("로그인 후 글작성이 가능하십니다.");
  }
});

// DB데이터 html로 보내기
app.get("/list", (요청, 응답) => {
  if (요청.user) {
    db.collection("post")
      .find()
      .toArray((에러, 결과) => {
        if (에러) return console.log(에러);

        응답.render("list.ejs", { posts: 결과, user: 요청.user });
      });
  } else {
    응답.status(403).send("로그인 후 이용해주세요");
  }
});

// 삭제요청
app.delete("/delete", (요청, 응답) => {
  요청.body._id = parseInt(요청.body._id);

  let 삭제할데이터 = { _id: 요청.body._id, 작성자: 요청.user._id };
  db.collection("post").deleteOne(삭제할데이터, function (에러, 결과) {
    // console.log(결과.deletedCount);
    if (결과.deletedCount == 1) {
      응답.status(200).send({ message: "성공했습니다" });
    } else {
      응답.status(400).send({ message: "삭제 권한이 없습니다." });
    }
  });
});

// 수정요청
app.put("/edit", (요청, 응답) => {
  // console.log(요청.body);
  if (요청.body.name == 요청.user._id) {
    db.collection("post").updateOne(
      { _id: parseInt(요청.body.id) },
      { $set: { 제목: 요청.body.title, 날짜: 요청.body.date } },
      (에러, 결과) => {
        if (에러) return console.log(에러);

        console.log("수정완료");
        응답.status(200).redirect("/list");
      }
    );
  } else {
    응답.status(403).send("수정권한이 없습니다.");
  }
});

// List에서 Search(Query String문법)
// { $text: { $search: 요청.query.value } } - text 인덱싱 후 검색 기능(띄어쓰기 기준)
app.get("/search", (요청, 응답) => {
  if (요청.user) {
    let 검색조건 = [
      {
        $search: {
          index: "titleSearch",
          text: {
            query: 요청.query.value,
            path: "제목", // 제목 날짜 둘 다 찾고싶으면 ['제목','날짜']
          },
        },
      },
      // { $sort: { _id: 1 } }, //정렬
      // { $limit: 10 },
      // { $project: { 제목: 1, _id: 0 }, score: { $meta: "searchScore" } }, // 검색결괴에서 필터주기(1은 가져오기, 0 은 뺴기)
    ];
    db.collection("post")
      .aggregate(검색조건)
      .toArray((에러, 결과) => {
        if (에러) return console.log(에러);
        응답.render("search.ejs", { posts: 결과, user: 요청.user });
      });
  } else {
    응답.status(403).send("로그인 후 사용해주세요");
  }
});

// Route폴더에 파일가져와서 사용하기(고객이 / 경롤로 요청했을 때 미들웨어적용)
app.use("/shop", 로그인했니, require("./routes/shop"));

app.use("/board/sub", 로그인했니, require("./routes/board"));

// 이미지업로드 %% 이미지 서버 만들기(multer 사용법)
let multer = require("multer");
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/image");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback(new Error("PNG, JPG만 업로드하세요"));
    }
    callback(null, true);
  },
  // limits: {
  //   fileSize: 1024 * 1024,
  // },
});

let upload = multer({ storage: storage });

app.get("/upload", (req, res) => {
  res.render("upload.ejs");
});

// input name -(single한개의 파일),(array여러개의 파일,숫자==갯수)
app.post("/upload", upload.single("profile"), function (요청, 응답) {
  응답.send("이미지 완료");
});

app.get("/image/:imageName", (요청, 응답) => {
  응답.sendFile(__dirname + "/public/image/" + 요청.params.imageName);
});

// 채팅방

app.post("/chatroom", 로그인했니, (요청, 응답) => {
  db.collection("chatroom")
    .findOne({ member: [ObjectId(요청.body.당한사람id), 요청.user._id] })
    .then((res) => {
      if (res) {
        응답.status(403).send("이미 존재하는 방입니다.");
      } else {
        let 저장할거 = {
          title: "무슨무슨채팅방",
          member: [ObjectId(요청.body.당한사람id), 요청.user._id],
          date: new Date(),
        };
        db.collection("chatroom")
          .insertOne(저장할거)
          .then((res) => {
            응답.send("채팅방을 생성하셨습니다!");
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
});

app.get("/chat", 로그인했니, (요청, 응답) => {
  db.collection("chatroom")
    .find({ member: 요청.user._id })
    .toArray()
    .then((res) => {
      응답.render("chat.ejs", { data: res, user: 요청.user });
    });
});

app.post("/message", 로그인했니, (요청, 응답) => {
  let 저장할거 = {
    parent: 요청.body.parent,
    content: 요청.body.content,
    userid: 요청.user._id,
    date: new Date(),
  };

  db.collection("message")
    .insertOne(저장할거)
    .then((res) => {
      console.log("db 저장성공");
      응답.send("DB저장성공");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/message:id", 로그인했니, (요청, 응답) => {
  응답.writeHead(200, {
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection("message")
    .find({ parent: 요청.params.id })
    .toArray()
    .then((res) => {
      응답.write("event: test\n");
      응답.write("data: " + JSON.stringify(res) + "\n\n");
    });

  const pipeline = [{ $match: { "fullDocument.parent": 요청.params.id } }];
  const collection = db.collection("message");
  const changeStream = collection.watch(pipeline);
  changeStream.on("change", (result) => {
    // console.log(result.fullDocument);
    응답.write("event: test\n");
    응답.write("data: " + JSON.stringify([result.fullDocument]) + "\n\n");
  });
});

// Socket.io
app.get("/socket", (요청, 응답) => {
  응답.render("socket.ejs");
});

io.on("connection", function (socket) {
  // console.log("유저접속됨");
  // console.log(socket.id);

  // 채팅방 생성
  // socket.join("room1");
  socket.on("joinroom", function (data) {
    socket.join("room1");
  });
  socket.on("room1-send", function (data) {
    io.to("room1").emit("broadcast", data);
    console.log(data);
  });

  socket.on("user-send", function (data) {
    console.log(data);
    // io.to(socket.id).emit("broadcast", data);
    io.emit("broadcast", data);
  });
});
