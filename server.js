const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// database 접속이 완료되면 8080에 nodejs 서버를 띄워라
let db;
MongoClient.connect(
    'mongodb+srv://아이디:비밀번호@cluster0.cooao.mongodb.net/?retryWrites=true&w=majority',
    (error, client) => {
        // 연결되면 할 일
        if (error) return console.log(error);

        db = client.db('todoapp');

        // db.collection("post").insertOne("저장할데이터", (error, result) => {
        //   console.log("저장완료");
        // });

        // db.collection("post").insertOne(
        //   { 이름: "Chiro", 나이: 30 },
        //   (error, result) => {
        //     console.log("저장완료");
        //   }
        // );

        app.listen(8080, function () {
            console.log('listening on 8080');
        });
    }
);

// 콜백 함수: 함수안에 함수가 들어가는 것 => 순차적으로 실행하고 싶을 때 쓴다.
app.get('/pet', (req, res) => {
    res.send('펫 용품 쇼핑할 수 있는 페이지 입니다.');
});

app.get('/beauty', (req, res) => {
    res.send('뷰티 용품 쇼핑할 수 있는 페이지 입니다.');
});

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.get('/write', (req, res) => {
    res.render('write.ejs');
});

app.get('/1.jpg', (req, res) => {
    res.sendFile(__dirname + '/images/1.jpg');
});

app.get('/2.jpg', (req, res) => {
    res.sendFile(__dirname + '/images/2.jpg');
});

app.get('/3.jpg', (req, res) => {
    res.sendFile(__dirname + '/images/3.jpg');
});

// 어떤 사람이 /add 경로로 POST 요청을 하면... ? 를 해주세요

// app.post("경로", function (요청, 응답) {
//   응답.send("전송완료");
// });

// body-parser를 이용해서 form의 데이터를 받아와서 활용할 수 있음

// app.post("/add", (req, res) => {
//   res.send("전송 완료");
//   console.log(req.body);
// });

// 어떤 사람이 /add 경로로 POST 요청을 하면,
// 데이터 2개(제목, 날짜)를 보내주는데,
// 이 때, 'post'라는 이름을 가진 collection에 두 개 데이터를 저장하기

// 누가 폼에서 /add로 POST 요청하면
app.post('/add', (req, res) => {
    // DB.counter 내의 총 게시물 개수를 찾음
    db.collection('counter').findOne({ name: 'totalPost' }, (error, result) => {
        const totalPost = result.totalPost;
        const title = req.body.title;
        const date = req.body.date;

        db.collection('post').insertOne(
            { _id: totalPost + 1, title: title, date: date },
            (error, result) => {
                console.log('저장 완료');
                // counter 라는 collection에 있는 totalPost 라는 항목도 1 증가시켜야 함 (수정)
                // db.collection('counter').updateOne({어떤 데이터를 수정할지}, {수정값}, ()=>{})
                db.collection('counter').updateOne(
                    { name: 'totalPost' },
                    // operator: [set: 바꿀 값], [inc: 기존 값에 더해줄 값] ...
                    { $inc: { totalPost: 1 } },
                    (error, result) => {
                        if (error) return console.log(error);
                        else {
                            res.status(200);
                            res.redirect('/list');
                        }
                    }
                );
            }
        );
    });
});

// /list로 GET요청으로 접속하면
// 실제 DB에 저장된 데이터들로 예쁘게 꾸며진 HTML을 보여줌

// DB에 저장된 post 라는 collection 안의 [모든 or id가 ??인] 데이터를 꺼내주세요
app.get('/list', (req, res) => {
    db.collection('post')
        // 데이터를 다 찾아주세요
        .find()
        .toArray((error, result) => {
            res.render('list.ejs', { posts: result });
        });
});

app.delete('/delete', (req, res) => {
    console.log(req.body);
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, (error, result) => {
        console.log('삭제 완료');
        // 200: 요청을 성공했다는 뜻
        res.status(200).send({ message: '삭제를 성공했습니다.' });
    });
});

// :??? 을 붙이면 파라미터로 받아올 수 있음 => req.params.??? 로 받을 수 있음
app.get('/detail/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.collection('post').findOne({ _id: id }, (error, result) => {
        console.log(error, result);
        if (!result) {
            res.status(400).render('error.ejs');
        } else {
            res.status(200);
            res.render('detail.ejs', { data: result });
        }
    });
});

app.get('/edit/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.collection('post').findOne({ _id: id }, (error, result) => {
        console.log(error, result);
        if (!result) {
            res.status(400).render('error.ejs');
        } else {
            res.status(200);
            res.render('edit.ejs', { post: result });
        }
    });
});

app.put('/edit', (req, res) => {
    const id = parseInt(req.body.id);
    const title = req.body.title;
    const date = req.body.date;
    db.collection('post').updateOne(
        { _id: id },
        { $set: { title: title, date: date } },
        (error, result) => {
            console.log('수정 완료', { error, result });
            if (!result) {
                res.status(400).render('error.ejs');
            } else {
                res.status(200);
                res.redirect('/list');
            }
        }
    );
});
