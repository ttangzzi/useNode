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
    db = client.db("Goal"); // database name

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

// req.body를 통해 클라이언트에서 보낸 정보를 가져올 수 있도록 하는 코드
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  let result = await db.collection("goalList").find().toArray();
  res.render("roadHome.ejs", { goal: result });
});

app.get("/createGoal", (req, res) => {
  res.render("createGoal.ejs");
});

app.post("/goalPost", async (req, res) => {
  const { title, content, startDate, endDate, grade_1 } = req.body;

  if (
    title == "" ||
    content == "" ||
    startDate == "" ||
    endDate == "" ||
    grade_1 == ""
  ) {
    return res.status(400).send("모든 필수 입력값을 채워주세요.");
  }

  let gradeArray = [];
  for (let i = 1; i <= 5; i++) {
    if (req.body[`grade_${i}`]) {
      gradeArray.push(req.body[`grade_${i}`]);
    } else {
      break;
    }
  }

  const createGoal = {
    title: title,
    content: content,
    startDate: startDate,
    endDate: endDate,
    grade: gradeArray,
  };

  await db.collection("goalList").insertOne(createGoal);
  res.redirect("/");
});
