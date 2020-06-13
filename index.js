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

//untuk mendapatkan data semua team
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
            }
        }); 
    }      
});


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


app.listen(3000, function(){
    console.log("LISTENING TO PORT 3000!");
})