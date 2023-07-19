let router = require("express").Router();

// router.use(로그인했니) -./shop에 관한 api는 로그인 여부를 확인
//router.use("/shirts",로그인했니) = /shirts페이지에 대해서만 로그인 확인

// Route들 파일로 관리하기
router.get("/shirts", function (요청, 응답) {
  응답.send("셔츠 파는 페이지입니다.");
});
router.get("/pants", function (요청, 응답) {
  응답.send("바지 파는 페이지입니다.");
});

module.exports = router;
