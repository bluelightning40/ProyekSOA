if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

const express = require('express');
var dateTime = require('node-datetime');
var multer = require('multer');
const app = express();
const mysql = require('mysql');
var request = require('request');
var path = require('path');
const randomstring = require('randomstring');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const stripe = require('stripe')(stripeSecretKey)



app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(`${__dirname}/public`));

const cors = require('cors');
const dicky = require("./routes/dicky");
const zamorano = require("./routes/zamorano")
const aucky = require("./routes/aucky")

app.use(cors());

const pool = mysql.createPool({
    host:process.env.HOST,
    database: process.env.DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

// const pool = mysql.createPool({
//     host:"localhost",
//     database:"proyek_soa",
//     user:"root",
//     password:""
// })

//User Sstatus Code

// 0 => Free user => API hit 25/day
// 1 => Lite User => API hit 50/day
// 2 => Premium User => API hit 75/day

//Tipe Card Pemain

// 0 => Yellow Card
// 1 => Red Card

app.use("/",dicky);
app.use("/",zamorano);
app.use("/",aucky);



setInterval(function(){
  var dt = dateTime.create();
  var formatted = dt.format('Y-m-d');
  pool.getConnection((err,conn)=>{
    conn.query(`select * from user where last_update='${formatted}'`,(err,res)=>{
      if(err) console.log(err);
      else{
        if(res.length==0){
          conn.query(`update user set last_update='${formatted}', api_hit = (status+1)*25 where 1`,(err,res)=>{
            if(err) console.log(err);
            else{
              console.log("user api hit updated");
            }
          })
        }
      }
    })
    conn.release();
  });
},5000);

//=======================================================================================================================

app.listen(port, function(){
    console.log(`LISTENING TO PORT ${port}!`);
})
