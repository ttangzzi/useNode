// 설치한 express 라이브러리 불러오는 코드
const { render } = require("ejs");
const express = require("express");

// 세션, 회원인증 라이브러리
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// 세션 DB에 저장하기 위한 require
const MongoStore = require("connect-mongo");

const app = express();

const { MongoClient } = require("mongodb");

let db;
const url =
  "mongodb+srv://cvbg0802:jks0802@cluster0.bnf6i0t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
new MongoClient(url)
  .connect()
  .then((client) => {
    console.log("DB Connect");
    db = client.db("homepage"); // database name

    // DB접속이 완료 되어야 서버를 띄우도록 하기
    app.listen(3000, () => {
      console.log("http://localhost:3000 port Server Running");
    });
  })
  .catch((err) => {
    console.log(err);
  });
const { ObjectId } = require("mongodb");

// 비밀번호 해싱 위함 : bcrypt
const bcrypt = require("bcrypt");

// public 안의 파일들을 가져다 쓸 수 있도록 하는 코드
app.use(express.static(__dirname + "/public"));

// 세션 설정 관련
app.use(passport.initialize());
app.use(
  session({
    secret: "0802",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 },
    httpOnly: true,
    store: MongoStore.create({
      mongoUrl:
        "mongodb+srv://cvbg0802:jks0802@cluster0.bnf6i0t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      dbName: "homepage",
    }),
  })
);

app.use(passport.session());

// ejs 엔진 사용하겠다 선언
app.set("view engine", "ejs");

// req.body를 통해 클라이언트에서 보낸 정보를 가져올 수 있도록 하는 코드
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 모든 EJS에서 user 자동 사용 가능
// ejs에서 로그인 여부에 따라 UI변경이 필요하기 때문
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// 로그인 확인 미들웨어
const checkLogin = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next(); // 로그인한 경우 통과
  }
  res.status(401).render("error.ejs", { message: "로그인이 필요합니다." });
};

app.get("/", async (req, res) => {
  let result = await db.collection("post").find().sort({ _id: -1 }).toArray();

  // 보이는 글자 수 제한
  let titleMaxLen = 10;
  let contentMaxLen = 20;
  for (let i = 0; i < result.length; i++) {
    result[i].title =
      result[i].title.length > titleMaxLen
        ? result[i].title.substring(0, titleMaxLen) + "..."
        : result[i].title;

    result[i].content =
      result[i].content.length > contentMaxLen
        ? result[i].content.substring(0, contentMaxLen) + "..."
        : result[i].content;
  }
  res.render("home.ejs", { posts: result });
});

app.get("/write", checkLogin, (req, res) => {
  res.render("write.ejs");
});

app.post("/write", checkLogin, async (req, res) => {
  if (req.body.title !== "" && req.body.content !== "") {
    let data = {
      title: req.body.title,
      content: req.body.content,
      date: new Date().toLocaleDateString("ko-KR"),
      writer: req.user.userName,
    };
    await db.collection("post").insertOne(data);
    res.redirect("/");
  } else {
    res.render("error.ejs");
  }
});

app.get("/detail/:id", async (req, res) => {
  let result = await db
    .collection("post")
    .findOne({ _id: new ObjectId(req.params.id) });
  res.render("detail.ejs", { detail: result });
});

app.delete("/delete/:id", async (req, res) => {
  await db.collection("post").deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ success: true });
});

app.post("/delete/:id", async (req, res) => {
  await db.collection("post").deleteOne({ _id: new ObjectId(req.params.id) });
  res.redirect("/");
});

app.get("/edit/:id", async (req, res) => {
  let result = await db
    .collection("post")
    .findOne({ _id: new ObjectId(req.params.id) });
  res.render("edit.ejs", { post: result });
});

app.post("/edit/:id", async (req, res) => {
  let data = {
    title: req.body.title,
    content: req.body.content,
    date: new Date().toLocaleDateString("ko-KR"),
  };
  await db
    .collection("post")
    .updateOne({ _id: new ObjectId(req.params.id) }, { $set: data });
  res.redirect("/");
});

app.get("/regist", (req, res) => {
  res.render("regist.ejs");
});

app.post("/regist", async (req, res) => {
  // req.body에서 Id, Pw, Name을 추출하여 따로 저장
  const { userId, userPw, userName } = req.body;

  // 모두 공백 불가
  // Id가 4~20자리의 영문, 숫자로만 입력됐는지지 검증(T/F)
  const checkedId = /^[a-zA-Z0-9]{4,20}$/.test(userId);
  // Pw가 8~20자리의 영문, 숫자로만 입력됐는지지 검증(T/F)
  const checkedPw = /^[a-zA-Z0-9]{8,20}$/.test(userPw);
  // Name이 2~10자리의 한글, 영문으로만 입력됐는지지 검증(T/F)
  const checkedName = /^[a-zA-Z가-힣]{2,10}$/.test(userName);

  // 중복되는 아이디가 있는지 찾기 (클라이언트에서도 걸렀지만 서버에서도 한번 더 걸러주기)
  const dup = await db.collection("user").findOne({ userId: userId });

  // 중복되는 아이디가 있다면
  if (dup) {
    return res.send("이미 존재하는 아이디입니다.");
  }

  // 모든 검증값이 True라면 진행하도록
  if (checkedId && checkedPw && checkedName) {
    // 비밀번호를 해싱 + salt 처리 (비동기 처리)
    const hashPw = await bcrypt.hash(userPw, 10);
    await db
      .collection("user")
      .insertOne({ userId: userId, userPw: hashPw, userName: userName });
    res.set("Cache-Control", "no-store");
    res.redirect("/");
  }
});

app.post("/check", async (req, res) => {
  let result = await db.collection("user").findOne({ userId: req.body.userId });
  if (result) {
    res.json({ exists: true }); // 아이디 중복
  } else {
    res.json({ exists: false }); // 아이디 사용 가능
  }
});

app.get("/login", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.isAuthenticated()) {
    // 이미 로그인된 사용자라면 메인 페이지로 리디렉션
    return res.redirect("/");
  }
  // 로그인되지 않은 사용자만 로그인 페이지 렌더링
  res.render("login.ejs"); // 또는 res.sendFile(...) 등
});

// 로그인 POST 수신을 passport 라이브러리로 구현하기
passport.use(
  new LocalStrategy(
    {
      usernameField: "userId",
      passwordField: "userPw",
    },
    async (userId, userPw, cb) => {
      let result = await db.collection("user").findOne({ userId: userId });

      if (!result) {
        return cb(null, false, { message: "아이디가 존재하지 않습니다." });
      }

      if (await bcrypt.compare(userPw, result.userPw)) {
        return cb(null, result);
      } else {
        return cb(null, false, {
          message: "아이디 혹은 비밀번호가 올바르지 않습니다.",
        });
      }
    }
  )
);

app.post("/login", async (req, res, next) => {
  passport.authenticate("local", (error, user, info) => {
    if (error) return res.status(500).json(err);
    if (!user) return res.status(401).json(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  })(req, res, next);
});

// 세션 만들기
passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, userId: user.userId });
  });
});

// 쿠키를 확인하여 비교
passport.deserializeUser(async (user, done) => {
  let result = await db
    .collection("user")
    .findOne({ _id: new ObjectId(user.id) });
  delete result.userPw;
  process.nextTick(() => {
    return done(null, result);
  });
});

// 로그아웃
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // 세션 쿠키 삭제
      res.redirect("/"); // 또는 원하는 페이지로 리디렉션
    });
  });
});
