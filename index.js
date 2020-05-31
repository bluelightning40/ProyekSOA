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


app.listen(3000, function(){
    console.log("LISTENING TO PORT 3000!");
})