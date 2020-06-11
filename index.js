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

//User Sstatus Code

// 0 => Free user => API hit 10/day
// 1 => Lite User => API hit 50/day
// 2 +> Premium User => API hit unlimited

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
  api_hit = 0;
  status = 0;
  api_key = randomstring.generate(25);
  if(id_user != undefined && password != undefined){
    pool.getConnection((err,conn)=>{
      conn.query(`select * from user where id_user = '${id_user}'`, (err,result)=>{
        if(err) res.status(500).send(err)
        else{
          if(result.length==0){
            conn.query(`insert into user values('${id_user}','${password}',${api_hit},'${api_key}',${status})`, (err,result)=>{
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

app.post("/api/UpgradeUser/:api_key", function(req,res){
  api_key = req.params.api_key;
  id_user = req.body.id_user;
  upgrade_to = req.body.upgrade;

})
//=======================================================================================================================


app.listen(3000, function(){
    console.log("LISTENING TO PORT 3000!");
})
