// 설치한 express 라이브러리 불러오는 코드
const { render } = require("ejs");
const express = require("express");
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
    app.listen(8080, () => {
      console.log("http://localhost:8080 Server Running");
    });
  })
  .catch((err) => {
    console.log(err);
  });
const { ObjectId } = require("mongodb");

// public 안의 파일들을 가져다 쓸 수 있도록 하는 코드
app.use(express.static(__dirname + "/public"));

// ejs 엔진 사용하겠다 선언
app.set("view engine", "ejs");

// req.body를 통해 클라이언트에서 보낸 정보를 가져올 수 있도록 하는 코드
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  let result = await db.collection("post").find().toArray();
  res.render("home.ejs", { posts: result });
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.post("/write", async (req, res) => {
  if (req.body.title !== "" && req.body.content !== "") {
    let data = {
      title: req.body.title,
      content: req.body.content,
      date: new Date().toISOString().slice(0, 10),
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
