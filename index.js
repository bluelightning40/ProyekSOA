<<<<<<< Updated upstream
=======
if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
  }
  
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

>>>>>>> Stashed changes
const express = require('express');
const app = express();
const mysql = require('mysql');
var request = require('request');
app.use(express.urlencoded({extended:true}));

const pool = mysql.createPool({
    host:"localhost",
    database:"proyek_soa",
    user:"root",
    password:""
})

app.post('/api/createLeague',(req,res)=>{
    var league_name = req.body.league_name;
    var country_name = req.body.country_name;
    if(!league_name || !country_name){
        res.status(400).send('Semua field harus di isi');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from leagues where league_name='${league_name}'`, async (err,result)=>{
                if(err) res.status(500).send(err);
                else{
                    const leagues = await getLeagues();
                    const hasil = JSON.parse(leagues);
                    console.log(hasil.result.length);
                    for(var i = 0; i<hasil.result.length; i++){
                        if(hasil.result[i].league_name == league_name){
                            return res.status(404).send('League suda ada sebelumnya di3rd api');
                        }
                    }
                    if(result.length > 0){
                        return res.status(404).send('League suda ada sebelumnya');
                    }else{
                            conn.query(`select * from leagues`,(err,result)=>{
                                if(err) res.status(500).send(err);
                                else{
                                    var jumlah = result.length + 1;
                                    conn.query(`insert into leagues values('${jumlah}','${league_name}','${country_name}')`,(errors,row)=>{
                                        if(errors) res.status(500).send(errors);
                                        else{
                                            return res.status(201).send('Berhasil menambah league');
                                        }
                                    });
                                }
                            });
                        
                    }
                }
            });
        });
    }
});


async function getLeagues(){
    return new Promise(function(resolve,reject){
        var options = {
            'method': 'GET',
            'url': `https://allsportsapi.com/api/football/?met=Leagues&APIkey=f4289b1b8aef1ff94659ddbc6d79451d1953a065486cc24956415dd551f8ad04`,
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

app.post("/api/RecuitPlayer",function(req,res){
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
                res.status(404).send(result);
            }
        });
    });
});

//untuk meregistrasikan team baru
app.post("/api/addTeam",function(req,res){
    var nama_user = req.body.nama_user;
    var password_user = req.body.password_user;
    var email_user = req.body.email_user;
    var tipe_user = 0;
    var saldo_user = 0;
    var api_key = Math.random().toString().slice(2,12);

    console.log(api_key);

    var kembar = 0, kembarapi=0;
    if (!nama_user||!password_user||!email_user) {
        res.status(400).send("semua field harus terisi!");        
    } else {
        pool.query('select * from user', (error,rows,fields) => {
            if (error) {
                console.error(error);
            } else {
                rows.forEach(row=>{
                    if(email_user==row.email_user){
                        kembar=1;
                    }
                    do{//biar API tidak kembar
                        api_key = Math.random().toString().slice(2,12);
                        if (api_key==row.api_key) {
                            kembarapi=1;
                        }
                    }while(kembarapi==1);
                    console.log("HASIL RANDOM API : " + api_key);
                });
                if (kembar==1) {
                    res.status(404).send("email_user telah terpakai!");
                } else {
                    pool.query("insert into user values(?,?,?,?,?,?)",[email_user,password_user,nama_user,saldo_user, api_key, tipe_user], (error, rows, fields) => {
                        if (error) {
                            console.error(error);
                        } else {
                            res.status(200).send("Register berhasil. API_KEY : " + api_key); 
                        }
                    });
                }
<<<<<<< Updated upstream
            }
        }); 
    }      
});
=======
              });
            }
          });
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
            });
          }
          else{
            res.status(400).send("User telah terdaftar!!")
          }
        }
      });
    });
  }
});

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
      });
    });
  }
});

app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(`${__dirname}/public`));
>>>>>>> Stashed changes


app.post("/api/createjobvacancy",function(req,res){
    const api_key = req.body.api_key;

    if (!api_key) {
        res.status(400).send("field API_KEY harus terisi!");   
    }
    else{
        pool.getConnection(function(err,conn){
            if(err) res.status(500).send(err);
            else{
                conn.query(`select * from user where api_key='${api_key}'`,function(error,result){
                    if(error ) res.status(500).send(error);
                    else{
                        if(result.length <=0){
                            return res.status(400).send("user dengan api_key yang diinput tidak ditemukan");
                        }
                        conn.query(`select * from user where api_key='${api_key}'`,
                        function(error,results){
                            if(error) res.status(500).send(error);
                            else{
                                var tmp= JSON.parse(JSON.stringify(result[0]));
                                var currHit = parseInt(tmp['api_hit']);

                                if (currHit<1) {
                                    return res.status(400).send("API_HIT user tidak cukup untuk membuat iklan lowongan pekerjaan!");
                                } else {
                                    var hitbaru = currHit - 1;

                                    conn.query(`UPDATE user SET api_hit='${hitbaru}' WHERE api_key='${api_key}'`, function (err, result) {
                                        if (err) res.status(500).send(error);
                                        else{
                                            const judul_iklan = req.body.judul_iklan;
                                            const nama_perusahaan = req.body.nama_perusahaan;
                                            const deskripsi_iklan = req.body.deskripsi_iklan;
                                            const posisi_pekerjaan = req.body.posisi_pekerjaan;
                                            const bidang_industri = req.body.bidang_industri;
                                            const kota_perusahaan = req.body.kota_perusahaan;
                                            const range_gaji = req.body.range_gaji;

                                            pool.query("insert into lowongan_kerja values(?,?,?,?,?,?,?,?)",["",judul_iklan,nama_perusahaan,deskripsi_iklan,posisi_pekerjaan, bidang_industri, kota_perusahaan, range_gaji], (error, rows, fields) => {
                                                if (error) {
                                                    res.status(500).send(error);
                                                } else {
                                                    res.status(200).send("Berhasil menambah iklan lowongan pekerjaan."); 
                                                }
                                            });
                                        }
                                    });
                                }              
                            }
                        });                    
                    }
                })
            }
        });
    }
});

//=======================================================================================================================

<<<<<<< Updated upstream

app.listen(3000, function(){
    console.log("LISTENING TO PORT 3000!");
})
=======
app.listen(port, function(){
    console.log(`LISTENING TO PORT ${port}!`);
});
>>>>>>> Stashed changes
