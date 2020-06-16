if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
  }

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY
const API_KEY_SPORT = process.env.API_KEY_SPORT
const port = process.env.PORT;

const express= require('express');
const router = express.Router();
const mysql = require('mysql')
const app = express();
var request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:false}));

const pool = mysql.createPool({
    host:process.env.HOST,
    database: process.env.DB,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

router.post('/api/createLeague',(req,res)=>{
    var league_name = req.body.league_name;
    var country_name = req.body.country_name;
    var api_key = req.body.api_key;
    if(!league_name || !country_name){
        res.status(400).send('Status : 400 Bad Request');
    }else{
        pool.getConnection((err,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(err,result)=>{
                console.log("a")
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        return res.status(400).send("Upgrade Layanan User Anda Menjadi Premium");
                    }
                    var api_hit = result[0].api_hit;
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
                                })


                            }
                        }
                    });
                }
            });
            conn.release();
        });
    }
});

router.get('/api/getLeagues',(req,res)=>{
  var api_key = req.body.api_key;
    pool.getConnection((error,conn)=>{
      conn.query(`select * from user where api_key='${api_key}' and api_hit>0 and status=2`,(errors,row)=>{
        if(errors) res.status(500).errors
        else{
          if(row.length==0){
            return res.status(400).send("Upgrade Layanan User Anda Menjadi Premium");
          }
          var api_hit = row[0].api_hit;
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
      conn.release();
    });
});

router.get('/api/getLeaguesByCountry',(req,res)=>{
    var name = req.query.name;
    var api_key = req.body.api_key;
    if(name==undefined){
        res.status(400).send("Harus ada parameter name");
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
          conn.release();
      })
    }
});

router.put('/api/updateLeague',(req,res)=>{
    var key = req.body.key;
    var name = req.body.name;
    var country = req.body.country;
    var api_key = req.body.api_key;
    if(key==undefined || key==""){
        res.status(400).send("Harus ada league_key");
    }else if((name==undefined && country==undefined) ||(name=="" && country=="")){
        res.status(400).send("Harus ada yang diupdate")
    }
    pool.getConnection((error,conn)=>{
        conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
            if(err) res.status(500).send(err);
            else{
                if(result.length==0){
                    res.status(404).send("User belum terdaftar atau api_hit anda habis");
                }else{
                    var api_hit = result[0].api_hit;
                    conn.query(`select * from leagues where id_league='${key}'`,(err,result)=>{
                      if(err) res.status(500).send(err);
                      else{
                        if(result.length>0){
                          conn.query(`update leagues set league_name='${name}', country_name='${country}' where id_league='${key}'`,(error,result)=>{
                              api_hit = api_hit - 1;
                              if(error) res.status(500).send(error);
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
                          });
                        }
                        else{
                          res.status(404).send("Status : 404 Bad Request");
                        }
                      }
                    })
                }
            }
        })
        conn.release();
    });
});

router.delete('/api/deleteLeague',(req,res)=>{
    var key = req.body.key;
    var api_key = req.body.api_key;
    if(key==undefined){
        res.status(400).send("Harus ada league_key");
    }else{
        pool.getConnection((error,conn)=>{
            conn.query(`select * from user where api_key='${api_key}' and api_hit>0`,(err,result)=>{
                if(err) res.status(500).send(err);
                else{
                    if(result.length==0){
                        res.status(404).send("User belum terdaftar atau api_hit anda habis");
                    }else{
                        var api_hit = result[0].api_hit;
                        conn.query(`select * from leagues where id_league='${key}'`,(err,result)=>{
                          if(err) res.status(500).send(err);
                          else{
                            if(result.length>0){

                              conn.query(`delete from leagues where id_league='${key}'`,(error,result)=>{
                                  api_hit = api_hit - 1;
                                  if(error) res.status(500).send(error);
                                  else{
                                    conn.query(`update user set api_hit=${api_hit} where api_key='${api_key}'`,(errs,rows)=>{
                                      if(errs) res.status(500).send(errs);
                                      else{
                                        res.status(200).send("Berhasil Delete Leagues");
                                      }
                                    })
                                  }
                              });
                            }
                            else{
                              res.status(404).send("Bad Request");
                            }
                          }
                        })
                    }
                }
            })
            conn.release();
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





module.exports = router;