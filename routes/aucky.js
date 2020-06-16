if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
  }

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

const express = require('express');
const router = express.Router();
var dateTime = require('node-datetime');
var multer = require('multer');
const app = express();
const mysql = require('mysql');
var request = require('request');
var path = require('path');
const randomstring = require('randomstring');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');


app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(`${__dirname}/public`));

const pool = mysql.createPool({
    host:process.env.HOST,
    database: process.env.DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

var filename = ""; //untuk simpen nama file

//SET STORAGE ENGINE
const storage=multer.diskStorage({
    destination:'./public/uploads',
    filename:function(req,file,cb){
        filename = file.originalname;
        cb(null,filename);
    }
});

let upload = multer({
  storage: storage,
  fileFilter:function(req,file,cb){
    checkFileType(file,cb);
  }
});

function checkFileType(file,cb){
    const filetypes= /jpeg|jpg|png|gif/;
    const extname=filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype=filetypes.test(file.mimetype);
    if(mimetype && extname){
        return cb(null,true);
    }else{
        cb('Error: Image Only!');
    }
}

async function getTeams(ctrid){
    return new Promise(function(resolve,reject){
        var options = {
            'method': 'GET',
            'url': `https://allsportsapi.com/api/football/?&met=Teams&teamId='${ctrid}'&APIkey=${API_KEY_SPORT}`,
            'headers':{
            }
        };
        request(options,function(error,response){
            if(error) reject(new Error(error));
            else resolve(response.body);
        });
    });
}

//cost 1 api_hit
router.post('/api/addTeam',upload.single('team_logo'), async function(req,res){
    var id_team = req.body.id_team;
    var team_name = req.body.team_name;
    var team_league_id = req.body.team_league_id;
    var api_key = req.body.api_key;
    var team_logo = filename;

    if(!team_league_id || !team_name || !id_team || !api_key){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    var api_hit = result[0].api_hit;
                    conn.query(`select * from teams where team_name='${team_name}'`, async (err,result)=>{
                        if(err) res.status(500).send(err);
                        else{
                            const teams = await getTeams(id_team);
                            const hasil = JSON.parse(teams);
                            // for(var i = 0; i<hasil.result.length; i++){
                            //     if(hasil.result[i].team_name == team_name){
                            //         return res.status(400).send('Status : 400 Bad Request');
                            //     }
                            // }
                            if(result.length > 0){
                                return res.status(404).send('Team sudah terdaftar!');
                            }else{
                                conn.query(`insert into teams (team_name,team_league_id,team_logo) values('${team_name}','${team_league_id}','${team_logo}')`,(errors,row)=>{
                                    if(errors) res.status(500).send(errors);
                                    else{
                                        api_hit = api_hit - 1;
                                        conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                            if(errs) res.status(500).send(errs);
                                            else{
                                                return res.status(201).send('Berhasil menambah team ' + team_name);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
            conn.release();
        });
    }
});

//free feature - tidak butuh api_hit
router.get("/api/getTeamsFromDatabase",function(req,res){
    var api_key = req.query.api_key;
    if(!api_key){
        res.status(400).send('inputkan api_key untuk menggunakan fitur ini');
    }else{
        pool.getConnection((err,conn)=>{
          conn.query(`select * from user where api_key = '${api_key}'`,(err,result)=>{
            if(err) res.status(500).send(err);
            else{
              if(result.length>0){
                conn.query(`select * from teams`, (err,result)=>{
                    if(err) res.status(500).send(err);
                    else{
                        res.status(201).send(result);
                    }
                });
              }
              else{
                res.status(402).send("API key Tidak Valid");
              }
            }
          })
          conn.release();
        });
    }
});

//untuk mencari team dengan id_team yang spesifik
router.get("/api/getTeamById/:team_id",function(req,res){
    var team_id = req.params.team_id;
    var api_key = req.query.api_key;
    if(!api_key){
        res.status(400).send('inputkan api_key untuk menggunakan fitur ini');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}'`,(err,result)=>{
            if(err) res.status(500).send(err);
            else{
                if(result.length>0){
                conn.query(`select * from teams where id_team='${team_id}'`, (err,resultteam)=>{
                    if(err) res.status(500).send(err);
                    else{
                        if (resultteam.length>0) {
                            res.status(201).send(resultteam);
                        } else {
                            res.status(404).send("ID Team NOT FOUND");
                        }
                    }
                });
              }
              else{
                res.status(404).send("API Key Tidak Valid");
              }
            }
          })
          conn.release();
        });
    }
});

//untuk mencari team dengan nama team yang mengandung huruf tertentu (inputan)
router.get("/api/getTeamsContaint/:chars",function(req,res){
    var chars = req.params.chars;
    var api_key = req.query.api_key;
    if(!api_key){
        res.status(400).send('inputkan api_key untuk menggunakan fitur ini');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}'`,(err,result)=>{
                if(err) res.status(500).send(err);
                else{
                    if(result.length>0){
                        conn.query(`select * from teams where team_name LIKE '%${chars}%'`, (err,resultteam)=>{
                            if(err) res.status(500).send(err);
                            else{
                                if (resultteam.length>0) {
                                    res.status(201).send(resultteam);
                                } else {
                                    res.status(404).send("Team with certain character NOT FOUND");
                                }
                            }
                        });
                    }
                    else{
                        res.status(404).send("API Key Tidak Valid");
                    }
                }
            });
            conn.release();
        });
    }
});

//cost 1 api_hit
router.put('/api/updateTeam',(req,res)=>{
    var id_team = req.body.id_team;
    var team_name = req.body.team_name;
    var team_league_id = req.body.team_league_id;
    var api_key = req.body.api_key;
    if(!id_team || !team_name || !api_key || !team_league_id){
        res.status(400).send("semua field harus diisi!");
    }
    else{
      pool.getConnection((error,conn)=>{
          conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
              if(err) res.status(500).send(err);
              else{
                  if(result.length==0){
                      res.status(404).send("User belum terdaftar atau api_hit anda habis");
                  }else{
                      var api_hit = result[0].api_hit;
                      conn.query(`select * from teams where id_team='${id_team}'`,(err,result)=>{
                        if(err) res.status(500).send(err);
                        else{
                          if(result.length>0){
                            conn.query(`update teams set team_name='${team_name}', team_league_id='${team_league_id}' where id_team='${id_team}'`,(error,result)=>{
                                if(error) res.status(500).send(error);
                                else{
                                    if(result.length==0){
                                    }
                                    else{
                                      api_hit = api_hit - 1;
                                        conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                            if(errs) res.status(500).send(errs);
                                            else{
                                                res.status(201).json({
                                                    id_team : id_team,
                                                    team_name : team_name,
                                                    team_league_id : team_league_id
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                          }
                          else{
                              res.status(404).send("Status : 404 Bad Request.\nTeam NOT FOUND");
                          }
                        }
                      })
                  }
              }
          });
          conn.release();
      });
    }
});

//cost 1 api_hit
router.post('/api/addMatch',(req,res)=>{
    //var id_match = req.body.id_match;
    var league_key = req.body.league_key;
    var away_team = req.body.away_team;
    var home_team = req.body.home_team;
    var away_score = req.body.away_score;
    var home_score = req.body.home_score;
    var date = req.body.date;
    var time = req.body.time;
    var api_key = req.body.api_key;

    if(!api_key || !league_key || !away_team || !home_team || !away_score || !home_score || !date || !time){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{

                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    var api_hit = result[0].api_hit;
                    conn.query(`select * from leagues where id_league='${league_key}'`, async (err,resultleague)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultleague.length==0){
                                return res.status(404).send("ID LEAGUE NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${home_team}' OR id_team='${away_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length!=2){ // 2 id tim harus ada
                                        return res.status(404).send("ID TEAM NOT FOUND!");
                                    }
                                    conn.query(`insert into matches (league_key, away_team, home_team, home_score, away_score, date, time) values(${league_key},${away_team},${home_team},${home_score},${away_score},'${date}','${time}')`,(errors,row)=>{
                                        if(errors) res.status(500).send(errors);
                                        else{
                                            api_hit = api_hit - 1;
                                            conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                                if(errs) res.status(500).send(errs);
                                                else{
                                                    return res.status(201).send('Match Added');
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            conn.release();
        });
    }
});

//cost 1 api_hit
router.post('/api/addGoalDetail',(req,res)=>{
    var id_match = req.body.id_match;
    var id_team = req.body.id_team;
    var id_player_scored = req.body.id_player_scored;
    var id_player_assist = req.body.id_player_assist; //id player assist tidak harus ada
    var minute_scored = req.body.minute_scored;
    var api_key = req.body.api_key;

    if(!api_key || !id_match || !id_team || !id_player_scored || !minute_scored){ //id player assist tidak harus ada
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{

                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    var api_hit = result[0].api_hit;
                    conn.query(`select * from matches where id_match='${id_match}'`, async (err,resultmatch)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultmatch.length==0){
                                return res.status(404).send("MATCH NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${id_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length==0){
                                        return res.status(404).send("TEAM NOT FOUND!");
                                    }
                                    conn.query(`select * from player where id_player='${id_player_scored}'`, async (err,resplayer)=>{
                                        if(err) res.status(500).send(err);
                                        else{
                                            if(resplayer.length==0){
                                                return res.status(404).send("PLAYER NOT FOUND!");
                                            }
                                            conn.query(`insert into goal_detail values('${id_match}','${id_team}','${id_player_scored}','${id_player_assist}','${minute_scored}')`,(errors,row)=>{
                                                if(errors) res.status(500).send(errors);
                                                else{
                                                    api_hit = api_hit - 1;
                                                    conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                                        if(errs) res.status(500).send(errs);
                                                        else{
                                                            return res.status(201).send('Goal Detail Added');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            conn.release();
        });
    }
});

//cost 1 api_hit
router.post('/api/addCardDetail',(req,res)=>{
    var id_match = req.body.id_match;
    var id_team = req.body.id_team;
    var id_player = req.body.id_player;
    var card_type = req.body.card_type; //card type - 1:yellow card - 2:red card
    var api_key = req.body.api_key;

    if(!api_key || !id_match || !id_team || !id_player || !card_type){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{

                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    var api_hit = result[0].api_hit;
                    conn.query(`select * from matches where id_match='${id_match}'`, async (err,resultmatch)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultmatch.length==0){
                                return res.status(404).send("MATCH NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${id_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length==0){
                                        return res.status(404).send("TEAM NOT FOUND!");
                                    }
                                    conn.query(`select * from player where id_player='${id_player}'`, async (err,resplayer)=>{
                                        if(err) res.status(500).send(err);
                                        else{
                                            if(resplayer.length==0){
                                                return res.status(404).send("PLAYER NOT FOUND!");
                                            }
                                            conn.query(`insert into card_detail values('${id_match}','${id_team}','${id_player}','${card_type}')`,(errors,row)=>{
                                                if(errors) res.status(500).send(errors);
                                                else{
                                                    api_hit = api_hit - 1;
                                                    conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                                        if(errs) res.status(500).send(errs);
                                                        else{
                                                            return res.status(201).send('Card Detail Added');
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
            conn.release();
        });
    }
});

module.exports = router;