if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

const express = require('express');
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

let coreApi = new midtransClient.CoreApi({
        isProduction : false,
        serverKey : midtransSecretKey,
        clientKey : midtransPublicKey
    });

const pool = mysql.createPool({
    host:"localhost",
    database:"proyek_soa",
    user:"root",
    password:""
})

//User Sstatus Code

// 0 => Free user => API hit 10/day
// 1 => Lite User => API hit 50/day
// 2 => Premium User => API hit 100/day

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
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("Upgrade Layanan User Anda Menjadi Premium");
                    }
                    conn.query(`select * from leagues where league_name='${league_name}'`, async (err,result)=>{
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
                                    conn.query(`select * from leagues`,(err,result)=>{
                                        if(err) res.status(500).send(err);
                                        else{
                                            var jumlah = result.length + 1;
                                            conn.query(`insert into leagues values('${jumlah}','${league_name}','${country_name}')`,(errors,row)=>{
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
    pool.getConnection((error,conn)=>{
        conn.query(`select * from leagues`,(error,result)=>{
            if(error) res.status(500).send(error);
            else{
                res.status(200).send(result);
            }
        });
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
                    conn.query(`update leagues set league_name='${name}', country_name='${country}' where league_key='${key}'`,(error,result)=>{
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
                        conn.query(`delete from leagues where league_key='${key}'`,(error,result)=>{
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
            'url': `https://allsportsapi.com/api/football/?met=Leagues&APIkey=${API_KEY_SPOR}`,
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
app.post('/api/addTeam',(req,res)=>{
    var team_league_id = req.body.team_league_id;
    var team_name = req.body.team_name;
    var team_id = req.body.team_id;
    var team_logo = req.body.team_logo;
    if(!team_league_id || !team_name || !team_id){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from teams where team_id='${team_id}'`, (err,result)=>{
                if(err) res.status(500).send(err);
                else{
                    if(result.length > 0){
                        res.status(404).send('ID_TEAM sudah terpakai!');
                    }else{
                        conn.query(`insert into teams values('${team_id}','${team_name}','${team_league_id}','${team_logo}')`,(errors,row)=>{
                            if(errors) res.status(500).send(errors);
                            else{
                                res.status(201).send('Add Team ' + team_name + ' berhasil');
                            }
                        });
                    }
                }
            });
        });
    }
});

app.get("/api/getTeams",function(req,res){
    pool.getConnection((err,conn)=>{
        conn.query(`select * from teams`, (err,result)=>{
            if(err) res.status(500).send(err);
            else{
                res.status(404).send(result);
            }
        });
    });
});

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

//=======================================================================================================================

app.post("/api/RecuitPlayer",function(req,res){
  team_id = req.body.team_id;
  id_player = req.body.id_player;
  pool.getConnection((err,conn)=>{
    conn.query(`update set id_team=${team_id} where id_player='${id_player}'`,(err,result)=>{
      if(err) res.status(500).send(err);
      else{
        res.status(201).send('Rekrut Player ' + id_player + ' berhasil')
      }
    })
  })
})

app.post("/api/PecatPemain",function(req,res){
  id_player = req.body.id_player;
  pool.getConnection((err,conn)=>{
    conn.query(`update set id_team=0 where id_player='${id_player}'`,(err,result)=>{
      if(err) res.status(500).send(err);
      else{
        res.status(201).send("Pecat Player " + id_player + " berhasil")
      }
    })
  })
})

app.post("/api/RegisterUser", function(req,res){
  id_user = req.body.id_user;
  password = req.body.pass;
  email = req.body.email;
  api_hit = 0;
  status = 0;
  api_key = randomstring.generate(25);
  if(id_user != undefined && password != undefined){
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where id_user = '${id_user}'`, (err,result)=>{
        if(err) res.status(500).send(err)
        else{
          if(result.length==0){
            conn.query(`insert into user values('${id_user}','${email}','${password}',${api_hit},'${api_key}',${status})`, (err,result)=>{
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
            res.status(201).send("API key = " + result[0]);
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
                conn.query(`update set status = ${upgrade_to} where email_user = '${email}'`, (err,result)=>{
                  if(err) res.status(500).send(err);
                  else{
                    res.status(201).send("Upgrade Success !!");
                  }
                });
              }
              else{
                conn.query(`update set status = ${upgrade_to} where email_user = '${email}'`, (err,result)=>{
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

//=======================================================================================================================


app.listen(port, function(){
    console.log(`LISTENING TO PORT ${port}!`);
})
