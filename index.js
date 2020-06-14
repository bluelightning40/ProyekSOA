if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

const express = require('express');
var dateTime = require('node-datetime');
const app = express();
const mysql = require('mysql');
var request = require('request');
const randomstring = require('randomstring');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const fs = require('fs');
const stripe = require('stripe')(stripeSecretKey)
const midtransClient = require('midtrans-client')
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs')

const pool = mysql.createPool({
    host:"sql12.freemysqlhosting.net",
    database:"sql12348366",
    user:"sql12348366",
    password:"t7D7GaLNUE"
})

//User Sstatus Code

// 0 => Free user => API hit 25/day
// 1 => Lite User => API hit 50/day
// 2 => Premium User => API hit 75/day

//Tipe Card Pemain

// 0 => Yellow Card
// 1 => Red Card

app.post('/api/createLeague',(req,res)=>{
    var league_name = req.body.league_name;
    var country_name = req.body.country_name;
    var api_key = req.body.api_key;
    if(!league_name || !country_name){
        res.status(400).send('Status : 400 Bad Request');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{
                var api_hit = result[0].api_hit;
                console.log("a")
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("Upgrade Layanan User Anda Menjadi Premium");
                    }
                    conn.query(`select * from leagues where league_name='${league_name}'`, async (err,result)=>{
                      console.log("b");
                        if(err) res.status(500).send(err);
                        else{
                            const leagues = await getLeagues();
                            const hasil = JSON.parse(leagues);
                            console.log(hasil.result.length);
                            for(var i = 0; i<hasil.result.length; i++){
                                if(hasil.result[i].league_name == league_name){
                                    return res.status(400).send('Status : 400 Bad Request');
                                }
                            }
                            if(result.length > 0){
                                return res.status(404).send('Status : 400 Bad Request');
                            }else{
                                conn.query(`insert into leagues values('','${league_name}','${country_name}')`,(errors,row)=>{
                                    if(errors) res.status(500).send(errors);
                                    else{
                                        api_hit = api_hit - 1;
                                        conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                            if(errs) res.status(500).send(errs);
                                            else{
                                                return res.status(201).send('Berhasil menambah league');
                                            }
                                        });
                                    }
                                });


                            }
                        }
                    });
                }
            });
        });
    }
});

app.get('/api/getLeagues',(req,res)=>{
  var api_key = req.body.api_key;
    pool.getConnection((error,conn)=>{
      conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(errors,row)=>{
        var api_hit = row[0].api_hit;
        if(errors) res.status(500).errors
        else{
          if(row.length==0){
            return res.status(400).send("Upgrade Layanan User Anda Menjadi Premium");
          }
          conn.query(`select * from leagues`, async (error,result)=>{
            if(error) res.status(500).send(error);
            else{
              const leagues = await getLeagues();
              const hasil = JSON.parse(leagues);
              console.log(hasil.result.length);
              var arrTemp = [];
              arrTemp.push(result);
              for(var i = 0; i<hasil.result.length; i++){
                  let temp = {
                    id_league : hasil.result[i].league_key,
                    league_name : hasil.result[i].league_name,
                    country_name : hasil.result[i].country_name
                  }
                  arrTemp.push(temp);
              }
              res.status(200).send(arrTemp);
            }
        });
        }
      })
    });
});

app.get('/api/getLeaguesByCountry',(req,res)=>{
    var name = req.query.name;
    var api_key = req.body.api_key;
    if(name==undefined){
        res.status(400).send("Harus ada parameter name");
    }
    pool.getConnection((error,conn)=>{
        conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
            var api_hit = result[0].api_hit;
            if(err) res.status(500).send(err);
            else{
                if(result.length==0){
                    res.status(404).send("User belum terdaftar atau api_hit anda habis");
                }else{
                    conn.query(`select * from leagues where country_name='${name}'`,(error,result)=>{
                        api_hit = api_hit - 1;
                        if(error) res.status(500).send(error);
                        else{
                            if(result.length==0){
                                res.status(404).send("Status : 404 Bad Request");
                            }else{
                                conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                    if(errs) res.status(500).send(errs);
                                    else{
                                        res.status(200).send(result);
                                    }
                                })
                            }
                        }
                    });
                }
            }
        });
    })
});

app.put('/api/updateLeague',(req,res)=>{
    var key = req.body.key;
    var name = req.body.name;
    var country = req.body.country;
    var api_key = req.body.api_key;
    if(key==undefined){
        res.status(400).send("Harus ada league_key");
    }else if(name==undefined && country==undefined){
        res.status(400).send("Harus ada yang diupdate")
    }
    pool.getConnection((error,conn)=>{
        conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
            var api_hit = result[0].api_hit;
            if(err) res.status(500).send(err);
            else{
                if(result.length==0){
                    res.status(404).send("User belum terdaftar atau api_hit anda habis");
                }else{
                    conn.query(`update leagues set league_name='${name}', country_name='${country}' where id_league='${key}'`,(error,result)=>{
                        api_hit = api_hit - 1;
                        if(error) res.status(500).send(error);
                        else{
                            if(result.length==0){
                                res.status(404).send("Status : 404 Bad Request");
                            }
                            else{
                                conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                    if(errs) res.status(500).send(errs);
                                    else{
                                        res.status(201).json({
                                            key : key,
                                            league_name : name,
                                            country_name : country
                                        })
                                    }
                                })

                            }
                        }
                    });
                }
            }
        })
    });
});

app.delete('/api/deleteLeague',(req,res)=>{
    var key = req.body.key;
    var api_key = req.body.api_key;
    if(key==undefined){
        res.status(400).send("Harus ada league_key");
    }else{
        pool.getConnection((error,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
                var api_hit = result[0].api_hit;
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        res.status(404).send("User belum terdaftar atau api_hit anda habis");
                    }else{
                        conn.query(`delete from leagues where id_league='${key}'`,(error,result)=>{
                            api_hit = api_hit - 1;
                            if(error) res.status(500).send(error);
                            else{
                                if(result.length==0){
                                    res.status(404).send("Status : 404 Bad Request");
                                }else{
                                    conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                        if(errs) res.status(500).send(errs);
                                        else{
                                            res.status(200).send("Berhasil Delete Leagues");
                                        }
                                    })
                                }
                            }
                        });
                    }
                }
            })
        });
    }
});

async function getLeagues(){
    return new Promise(function(resolve,reject){
        var options = {
            'method': 'GET',
            'url': `https://allsportsapi.com/api/football/?met=Leagues&APIkey=${API_KEY_SPORT}`,
            'headers':{
            }
        };
        request(options,function(error,response){
            if(error) reject(new Error(error));
            else resolve(response.body);
        });
    });
}

//=======================================================================================================================

async function getTeams(ctrid){
    return new Promise(function(resolve,reject){
        var options = {
            'method': 'GET',
            'url': `https://allsportsapi.com/api/football/?&met=Teams&teamId='${ctrid}'&APIkey=${API_KEY_SPOR}`,
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
app.post('/api/addTeam',(req,res)=>{
    var id_team = req.body.id_team;
    var team_name = req.body.team_name;
    var team_league_id = req.body.team_league_id;
    var api_key = req.body.api_key;
    var team_logo = req.body.team_logo;
    if(!team_league_id || !team_name || !team_id){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{
                var api_hit = result[0].api_hit;
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    conn.query(`select * from teams where id_team='${id_team}'`, async (err,result)=>{
                        if(err) res.status(500).send(err);
                        else{
                            const teams = await getTeams(id_team);
                            const hasil = JSON.parse(teams);
                            console.log(hasil.result.length);
                            // for(var i = 0; i<hasil.result.length; i++){
                            //     if(hasil.result[i].league_name == league_name){
                            //         return res.status(400).send('Status : 400 Bad Request');
                            //     }
                            // }
                            if(result.length > 0){
                                return res.status(404).send('ID_TEAM sudah terpakai!');
                            }else{
                                conn.query(`insert into teams values('${id_team}','${team_name}','${team_league_id}','${team_logo}')`,(errors,row)=>{
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
        });
    }
});

//free feature - tidak butuh api_hit
app.get("/api/getTeamsFromDatabase",function(req,res){
    pool.getConnection((err,conn)=>{
        conn.query(`select * from teams`, (err,result)=>{
            if(err) res.status(500).send(err);
            else{
                res.status(404).send(result);
            }
        });
    });
});

//untuk mencari team dengan id_team yang spesifik
app.get("/api/getTeamById/:team_id",function(req,res){
    var team_id = req.params.team_id;
    pool.getConnection((err,conn)=>{
        conn.query(`select * from teams where team_id='${team_id}'`, (err,result)=>{
            if(err) res.status(500).send(err);
            else{
                res.status(404).send(result);
            }
        });
    });
});

//untuk mencari team dengan nama team yang mengandung huruf tertentu (inputan)
app.get("/api/getTeamsContaint/:chars",function(req,res){
    var chars = req.params.chars;
    pool.getConnection((err,conn)=>{
        conn.query(`select * from teams where team_id LIKE '%${chars}%'`, (err,result)=>{
            if(err) res.status(500).send(err);
            else{
                res.status(404).send(result);
            }
        });
    });
});

//cost 1 api_hit
app.put('/api/updateTeam',(req,res)=>{
    var id_team = req.body.id_team;
    var team_name = req.body.team_name;
    var team_league_id = req.body.team_league_id;
    var api_key = req.body.api_key;
    if(!id_team || !team_name || !api_key || !team_league_id){
        res.status(400).send("semua field harus diisi!");
    }
    pool.getConnection((error,conn)=>{
        conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
            var api_hit = result[0].api_hit;
            if(err) res.status(500).send(err);
            else{
                if(result.length==0){
                    res.status(404).send("User belum terdaftar atau api_hit anda habis");
                }else{
                    conn.query(`update teams set team_name='${team_name}', team_league_id='${team_league_id}' where id_team='${id_team}'`,(error,result)=>{
                        api_hit = api_hit - 1;
                        if(error) res.status(500).send(error);
                        else{
                            if(result.length==0){
                                res.status(404).send("Status : 404 Bad Request.\nTeam NOT FOUND");
                            }
                            else{
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
            }
        });
    });
});

//cost 1 api_hit
app.post('/api/addMatch',(req,res)=>{
    var id_match = req.body.id_match;
    var league_key = req.body.league_key;
    var away_team = req.body.away_team;
    var home_team = req.body.home_team;
    var away_score = req.body.away_score;
    var home_score = req.body.home_score;
    var date = req.body.date;
    var time = req.body.time;
    var api_key = req.body.api_key;

    if(!api_key || !id_match || !league_key || !away_team || !home_team || !away_score || !home_score || !date || !time){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{
                var api_hit = result[0].api_hit;
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    conn.query(`select * from leagues where id_league='${league_key}'`, async (err,resultleague)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultleague.length==0){
                                return res.status(400).send("ID LEAGUE NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${home_team}' OR id_team='${away_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length!=2){ // 2 id tim harus ada
                                        return res.status(400).send("ID TEAM NOT FOUND!");
                                    }
                                    conn.query(`insert into matches values('${id_match}','${league_key}','${away_team}','${home_team}','${home_score}','${away_score}','${date}','${time}')`,(errors,row)=>{
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
        });
    }
});

//cost 1 api_hit
app.post('/api/addGoalDetail',(req,res)=>{
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
                var api_hit = result[0].api_hit;
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    conn.query(`select * from matches where id_match='${id_match}'`, async (err,resultmatch)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultmatch.length==0){
                                return res.status(400).send("MATCH NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${id_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length==0){
                                        return res.status(400).send("TEAM NOT FOUND!");
                                    }
                                    conn.query(`select * from player where id_player='${id_player_scored}'`, async (err,resplayer)=>{
                                        if(err) res.status(500).send(err);
                                        else{
                                            if(resplayer.length==0){
                                                return res.status(400).send("PLAYER NOT FOUND!");
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
        });
    }
});

//cost 1 api_hit
app.post('/api/addCardDetail',(req,res)=>{
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
                var api_hit = result[0].api_hit;
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("upgrade ke premium user untuk akses fitur ini");
                    }
                    conn.query(`select * from matches where id_match='${id_match}'`, async (err,resultmatch)=>{
                        if(err) res.status(500).send(err);
                        else{
                            if(resultmatch.length==0){
                                return res.status(400).send("MATCH NOT FOUND!");
                            }
                            conn.query(`select * from teams where id_team='${id_team}'`, async (err,resultteam)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    if(resultteam.length==0){
                                        return res.status(400).send("TEAM NOT FOUND!");
                                    }
                                    conn.query(`select * from player where id_player='${id_player}'`, async (err,resplayer)=>{
                                        if(err) res.status(500).send(err);
                                        else{
                                            if(resplayer.length==0){
                                                return res.status(400).send("PLAYER NOT FOUND!");
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
        });
    }
});

//=======================================================================================================================

app.get("/api/RecruitPlayer",function(req,res){
  team_id = req.body.team_id;
  id_player = req.body.id_player;
  api_key = req.body.api_key;
  pool.getConnection((err,conn)=>{
    conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
      if(err) res.status(500).send(err);
      else{
        if(result.length>0){
          api_hit = result[0].api_hit;
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
        else[
          res.status(400).send("API key tidak Valid atau User telah mencapai batas Request !!")
        ]
      }
    })

  })
})

app.post("/api/PecatPemain",function(req,res){
  id_player = req.body.id_player;
  api_key = req.body.api_key;
  pool.getConnection((err,conn)=>{
    conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
      if(err) res.status(500).send(err);
      else{
        if(result.length>0){
          api_hit = result[0].api_hit;
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
          res.status(400).send("API key tidak Valid atau User telah mencapai batas Request !!")
        }
      }
    })
  })
})

app.post("/api/RegisterUser", function(req,res){
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
      conn.query(`select * from user where id_user = '${id_user}'`, (err,result)=>{
        if(err) res.status(500).send(err)
        else{
          if(result.length==0){
            conn.query(`insert into user values('${id_user}','${email}','${password}',${api_hit},'${api_key}',${status},'${formatted}')`, (err,result)=>{
              if(err) res.status(500).send(err);
              else{
                res.status(201).send("API key = " + api_key)
              }
            })
          }
          else{
            res.status(400).send("User telah terdaftar!!")
          }
        }
      })
    })
  }
})

app.post("/api/loginUser", function(req,res){
  id_user = req.body.id_user;
  password = req.body.pass;
  if(id_user != undefined && password != undefined){
    pool.getConnection((err,conn)=>{
      conn.query(`select api_key from user where id_user = '${id_user}' and password = '${password}'`, (err,result)=>{
        if(err) res.status(500).send(err)
        else{
          if(result.length>0){
            res.status(201).send("API key = " + result[0].api_key);
          }
          else{
            res.status(400).send("User belum terdaftar!!")
          }
        }
      })
    })
  }
})

app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(`${__dirname}/public`));

app.get("/",function(req,res){
  res.render('index');
})

app.post("/api/UpgradeUser/:upgrade_to", function(req,res){
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
  });
});

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
  });
},5000);

//=======================================================================================================================

app.listen(port, function(){
    console.log(`LISTENING TO PORT ${port}!`);
})
