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
app.use(bodyParser.urlencoded({extended:false}));
const router = express.Router();

const pool = mysql.createPool({
    host:process.env.HOST,
    database: process.env.DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

router.post("/api/loginUser", function(req,res){
    id_user = req.body.id_user;
    password = req.body.pass;
    if(id_user != undefined && password != undefined){
      pool.getConnection((err,conn)=>{
        conn.query(`select api_key from user where id_user = '${id_user}' and password = '${password}'`, (err,result)=>{
          if(err) res.status(500).send(err)
          else{
            if(result.length>0){
              res.status(201).send(result[0]);
            }
            else{
              res.status(400).send("User atau Password tidak valid!!")
            }
          }
        })
        conn.release();
      })
    }
  });


  router.post("/api/addPlayer",function(req,res){
    id_team = req.body.team_id;
    nationality = req.body.nationality;
    age = req.body.age;
    position = req.body.position;
    player_name = req.body.player_name;
    api_key = req.body.api_key;
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where api_key='${api_key}' and api_hit>0`, (err,result)=>{
        if(err) res.status(500).send(err);
        else{
          if(result.length>0){
            api_hit = result[0].api_hit;
            conn.query(`select * from player where player_name='${player_name}'`,(err,result)=>{
              if(err) res.status(500).send(err);
              else{
                if(result.length>0){
                  res.status(402).send('Player sudah terdaftar');
                }
                else{
                  conn.query(`insert into player (id_team, nationality, age, position, player_name) values(${id_team},'${nationality}',${age},'${position}','${player_name}')`, (err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                      api_hit = api_hit-1;
                      conn.query(`update user set api_hit = ${api_hit} where api_key = '${api_key}'`,(err,result)=>{
                        if(err) res.status(500).send(err);
                        else{
                          res.status(200).send("Add Player Berhasil");
                        }
                      })
                    }
                  })
                }
              }
            })
          }
          else{
            res.status(402).send("API key tidak valid atau sudah mencapai batas akses API per hari");
          }
        }
      })
      conn.release();
    })
  });
  
  router.get("/api/RecruitPlayer",function(req,res){
    team_id = req.body.team_id;
    id_player = req.body.id_player;
    api_key = req.body.api_key;
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
        if(err) res.status(500).send(err);
        else{
          if(result.length>0){
            api_hit = result[0].api_hit;
            conn.query(`select * from player where id_player='${id_player}'`,(err,result)=>{
              if(err) res.status(500).send(err);
              else{
                if(result.length>0){
                  conn.query(`select * from teams where id_team=${team_id}`,(err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                      if(result.length>0){
                        conn.query(`update player set id_team=${team_id} where id_player='${id_player}'`,(err,result)=>{
                          if(err) res.status(500).send(err);
                          else{
                            api_hit = api_hit-1;
                            conn.query(`update user set api_hit = ${api_hit} where api_key='${api_key}'`,(err,result)=>{
                              if(err) res.status(500).send(err);
                              else{
                                res.status(201).send('Rekrut Player ' + id_player + ' berhasil')
                              }
                            })
                          }
                        })
                      }
                      else{
                        res.status(404).send('Team Tidak Terdaftar !!');
                      }
                    }
                  })
                }
                else{
                  res.status(404).send('Player Tidak Terdaftar !!');
                }
              }
            })
          }
          else[
            res.status(400).send("API key tidak Valid atau User telah mencapai batas Request !!")
          ]
        }
      })
      conn.release();
    })
  });
  
  router.post("/api/PecatPemain",function(req,res){
    id_player = req.body.id_player;
    api_key = req.body.api_key;
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
        if(err) res.status(500).send(err);
        else{
          if(result.length>0){
              api_hit = result[0].api_hit;
            conn.query(`select * from player where id_player='${id_player}'`,(err, result)=>{
              if(err) res.status(500).send(err);
              else{
                if(result.length>0){
                  conn.query(`update player set id_team=0 where id_player='${id_player}'`,(err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                      api_hit = api_hit-1;
                      conn.query(`update user set api_hit = ${api_hit} where api_key='${api_key}'`,(err,result)=>{
                        if(err) res.status(500).send(err);
                        else{
                          res.status(201).send('Pecat Player ' + id_player + ' berhasil')
                        }
                      })
                    }
                  })
                }
                else{
                  res.status(404).send('Player Tidak Terdaftar !!');
                }
              }
            })
          }
          else{
            res.status(400).send("API key tidak Valid atau User telah mencapai batas Request !!")
          }
        }
      })
      conn.release();
    })
  });
  
  router.post("/api/RegisterUser", function(req,res){
    id_user = req.body.id_user;
    password = req.body.pass;
    email = req.body.email;
    api_hit = 10;
    status = 0;
    var dt = dateTime.create();
    var formatted = dt.format('Y-m-d');
    api_key = randomstring.generate(25);
    if(id_user != undefined && password != undefined){
      pool.getConnection((err,conn)=>{
        conn.query(`select * from user where id_user = '${id_user}' AND email_user='${email}'`, (err,result)=>{
          if(err) res.status(500).send(err)
          else{
            if(result.length==0){
              conn.query(`insert into user values('${id_user}','${email}','${password}',${api_hit},'${api_key}',${status},'${formatted}')`, (err,result)=>{
                if(err) res.status(500).send(err);
                else{
                  res.status(201).send("Registrasi Berhasil");
                }
              })
            }
            else{
              res.status(400).send("User telah terdaftar!!")
            }
          }
        })
        conn.release();
      })
    }
  });
  
  
  
  router.get("/",function(req,res){
    res.render('index');
  });
  
  router.post("/api/UpgradeUser/:upgrade_to", function(req,res){
    //var id_user = req.body.id_user;
    var upgrade_to = req.params.upgrade_to;
    var email = req.body.stripeEmail;
  
    var amount = 0;
  
    if(upgrade_to==1){
      amount = 500;
    }
    else if(upgrade_to==2){
      amount = 1000;
    }
    console.log(upgrade_to);
    console.log(req.body);
  
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where email_user = '${email}'`, (err,result)=>{
        if(err) res.status(500).send(err);
        else{
          if(result.length>0){
            if(result[0].status<upgrade_to){
              stripe.customers.create({
                email: req.body.stripeEmail,
                source: req.body.stripeToken
              })
              .then(customer=> stripe.charges.create({
                amount: amount,
                description: 'Upgrade Subscription',
                currency: 'usd',
                customer: customer.id
              }))
              .then(charge=> {
                if(upgrade_to==1){
                  conn.query(`update user set status = ${upgrade_to}, api_hit = 50 where email_user = '${email}'`, (err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                      res.status(201).send("Upgrade Success !!");
                    }
                  });
                }
                else{
                  conn.query(`update user set status = ${upgrade_to}, api_hit = 75 where email_user = '${email}'`, (err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                      res.status(201).send("Upgrade Success !!");
                    }
                  });
                }
              });
            }
            else{
              res.status(400).send("Hanya bisa upgrade ke kelas yang lebih tinggi!!");
            }
          }
          else{
            res.send(400).send("Email Tidak Terdaftar!!");
          }
        }
      });
      conn.release();
    });
  });

  module.exports = router;