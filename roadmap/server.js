// 설치한 express 라이브러리 불러오는 코드
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
    db = client.db("Think_buy"); // database name

    // DB접속이 완료 되어야 서버를 띄우도록 하기
    app.listen(8080, () => {
      console.log("http://localhost:8080 Server Running");
    });
  })
  .catch((err) => {
    console.log(err);
  });

// public 안의 파일들을 가져다 쓸 수 있도록 하는 코드
app.use(express.static(__dirname + "/public"));

// ejs 엔진 사용하겠다 선언
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("roadHome.ejs");
});
