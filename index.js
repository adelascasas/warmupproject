const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const paith = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const uuidv4 = require('uuid/v4');
const SendEmail = require('./sendEmail.js');
const cookieParser = require('cookie-parser');

mongoose.connect("mongodb://127.0.0.1:27017/tictactoe",{ useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
let Player;
let BlackList;
db.once('open', function() { 
  Player =  mongoose.model("Player",mongoose.Schema({
         _id: String,
         username: String,
         password: String,
         email:String,
         verified: Boolean,
         key: String,
         games: [{_id: String, grid: [String], winner:String,start_date:String }] 
     }),"players");
  BlackList = mongoose.model('BlackList', mongoose.Schema({
         _id: String,
         token: String
  }),'blacklist');
});

const checkWinner = (grid) => {
    let winner = '';
    if((grid[0]==grid[1] && grid[1] == grid[2]) && grid[0]!=' '){
         winner = grid[0];
    }
    else if((grid[3]==grid[4] && grid[4] == grid[5]) && grid[3]!=' '){
         winner = grid[3];
    }
    else if((grid[6]==grid[7] && grid[7] == grid[8]) && grid[6]!=' '){
         winner = grid[6];
    }
    else if((grid[0]==grid[4] && grid[4] == grid[8]) && grid[0]!=' '){
         winner = grid[0];
    }
    else if((grid[2]==grid[4] && grid[4] == grid[6]) && grid[2]!=' '){
         winner = grid[2];
    }
   else if((grid[0]==grid[3] && grid[3] == grid[6]) && grid[0]!=' '){
         winner = grid[0];
    }
    else if((grid[1]==grid[4] && grid[4] == grid[7]) && grid[1]!=' '){
         winner = grid[1];
    }
    else if((grid[2]==grid[5] && grid[5] == grid[8]) && grid[2]!=' '){
         winner = grid[2];
    }    
    return winner;
}

const formatDate = () => {
  let date = new Date(),
  month = ''+(date.getMonth()+1),
  day =  date.getDate() + '',
  year = date.getFullYear();
  month = month.length < 2 ? '0' + month : month;
  day = day.length < 2 ? '0' + day: day;
  return [year, month, day].join('-');
  
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/ttt/', (req, res) => {
	res.sendFile(path.join(__dirname+'/login.html'));
});


app.post('/ttt/', (req,res) => {
      if (!req.body.name || req.body.name.length === 0){
          res.sendFile(path.join(__dirname+'/login.html'));           
      }
      else{
           fs.readFile(path.join(__dirname+'/login.html'),'utf-8',(err, data) => {
             if (err) throw err;
             res.send(data + `<p id='intro'>Hello ${req.body.name}, ${formatDate()}</p>`);
          });   
       }  
});

const recordGame  = (grid, move,player,winner) => {
               //access latest games array for playe
               //update winner and grid
              Player.updateOne(player, {
                    $set: {
                        "games.0.grid": grid,
                        "games.0.winner": winner     
                     }},(err,result)=> {if(err){console.log(err)}} );                          
}

const getGrid = (oldgrid,move) => { 
                     let updatedgrid = oldgrid.slice(0);
                     if(move==null){ 
                         return updatedgrid;
                     } 
                     updatedgrid[move] = 'X';
                     return updatedgrid;
}

app.post('/ttt/play', verifyToken ,(req,res) => {
         BlackList.findOne({token: req.token}).exec().then((doc) => {
              if(doc){
                   res.json({status: 'ERROR'}); 
              }
             else{
                  jwt.verify(req.token, 'MySecretKey',(err, authData)=> {
                      if(err) {res.json({status: 'ERROR'});}
                      else{
                          Player.findOne(authData.user).exec().then((doc) => {
                              let grid = getGrid(doc.games[0].grid,req.body.move);
                              let move = req.body.move;
                              if(move==null) { 
                                    res.json({grid}); 
                                    return; 
                              }
                              let winner = checkWinner(grid);
                              if(winner!=''){
                                  res.json({grid, winner});
                              }
                             else{
                                   for(let index=0;index<grid.length;index+=1){
                                      if(grid[index] == ' '){
                                         grid[index] = 'O';
                                         break;
                                     }
                                   }
                                   winner = checkWinner(grid);
                                   if(winner=='' && grid.every( value => value != ' ')){
                                      winner=' ';
                                   }
                                   if(winner != ''){
                                        res.json({grid, winner});
                                   }
                                   else{
                                       res.json({grid});
                                   }
                             }
                             recordGame(grid,move,authData.user,winner);
                           });
                      }      
                });
                }
         });
});


app.get('/ttt/styles.css', (req, res) => {
  res.sendFile(__dirname + "/" + "styles.css");
});


app.get('/ttt/script.js', (req, res) => {
  res.sendFile(__dirname + "/" + "script.js");
});

app.post( '/adduser' , (req, res)=> {
    const newuser  = new Player();
     newuser._id =  uuidv4();
     newuser.username = req.body.username;
     newuser.password = req.body.password;
     newuser.email = req.body.email;
     newuser.verified =  false;
     newuser.key = uuidv4();
     newuser.games = [];
    newuser.save((err, doc) => {
          if(err) {res.json({status: 'ERROR'});}
          else{
              console.log(doc);
              res.json({status: 'OK'});
              SendEmail(doc.email, doc.key);
          } 
     });
});

app.post('/verify' , (req,res) => {
    const param = {email: req.body.email };
    if(req.body.key != 'abracadabra'){
          param.key = req.body.key;
    }
    Player.findOne(param).exec().then((doc) => {
         if(!doc) { 
               res.json({status: 'ERROR'});
               return;
             }
         console.log(doc);
         doc.verified = true;
         doc.save((err, doc)=>{
           if(err) { res.json({status: "ERROR"});}
              else{
                   console.log(doc);
                   res.json({ status: 'OK'});
              }
         });
    }).catch(err => res.json({status: 'ERROR'}));
});

app.post('/login', (req,res) => {
       let player = {
           username: req.body.username,
           password: req.body.password
       };
       Player.findOne(player).exec().then((doc) => { 
            console.log(doc);
            if(!doc || doc.verified == false){
                  res.json({status: 'ERROR'});
              }
           else{
               jwt.sign({user: player}, 'MySecretKey',(err, token) => {
                     if(err) { res.send({status: 'ERROR'})}
                     else {
                          //create new object in user game array
                          let game = {
                          _id: uuidv4(),
                          start_date: formatDate(),
                          grid: [' ',' ',' ',' ',' ',' ',' ',' ',' '],
                          winner: ""
                          };
                          Player.updateOne(player,
                              {$push:{
                                   games: {
                                       $each: [game],
                                       $position: 0
                                  }
                                }},
                             (err, result) => {if(err){console.log(err);}}
                          );
                         res.cookie('token',token);
                         res.json({status: 'OK'});
                     }
              });
           }
       });
});



app.post('/logout',verifyToken,(req,res) => {
       jwt.verify(req.token, 'MySecretKey',(err, data)=>{
           if(err) {res.json({status:'ERROR'});}
           else{
              let invalidToken = new BlackList();
              invalidToken._id = uuidv4();
              invalidToken.token = req.token;
              invalidToken.save((err, doc) => {
                  if(err) {res.json({status: 'ERROR'});}
                  else{
                      Player.findOne(data.user).exec().then((doc) => {  
                          if(doc.games[0].grid.filter((v)=>{return v==' '}).length==9){
                               Player.updateOne(data.user, { 
                                      $pull: { 
                                           games: { $position: 0}     
                                        } 
                                    }, (err,obj)=>{res.json({status:'OK'});});
                            }            
                        });
                  }
              });
           }   
       });       
});

app.post('/listgames',verifyToken,(req,res) => {
      BlackList.findOne({token: req.token}).exec().then((doc) => {
          if(doc){
                   res.json({status: 'ERROR'});
           }
          else{
              jwt.verify(req.token, 'MySecretKey',(err, data)=>{
                    if(err) {res.json({status: 'ERROR'});}
                    else{
                       Player.findOne(data.user).exec().then((doc) => {
                              let games = doc.games.filter((v)=>{ 
                                      return v.grid.filter((x)=>{return x==' '}).length!=9;
                              });
                              games = games.map((v)=>{return {
                                id: v._id,
                                start_date: v.start_date
                              }});
                            console.log(games);
                           res.json({status: 'OK',games});
                       }).catch((err)=>{res.json({status:'ERROR'});});
                    }                        
              });    
          }
      });
});


app.post('/getgame',verifyToken,(req,res)=> {
        BlackList.findOne({token: req.token}).exec().then((doc) => {
          if(doc){
                   res.json({status: 'ERROR'});
           }
          else{
              jwt.verify(req.token, 'MySecretKey',(err, data)=>{
                    if(err) {res.json({status: 'ERROR'});}
                    else{
                          Player.findOne(data.user).exec().then((doc) => {                           
                           let game = doc.games.filter((v)=>{ return v._id == req.body.id});
                           if(game[0].winner==''){
                                res.json({status:'OK', grid: game[0].grid});}
                           else{
                                res.json({status:'OK', grid: game[0].grid, winner:game[0].winner});}
                           }).catch((err)=>{res.json({status:'ERROR'});});
                     }
                  });
              }
         });
});

    


app.post('/getscore',verifyToken,(req,res) => {
         BlackList.findOne({token: req.token}).exec().then((doc) => {
          if(doc){
                   res.json({status: 'ERROR'});
           }
          else{
              jwt.verify(req.token, 'MySecretKey',(err, data)=>{
                    if(err) {res.json({status: 'ERROR'});}
                    else{
                        Player.findOne(data.user).exec().then((doc) => {
                           let human = doc.games.filter((v)=>{return v.winner=='X'}).length;
                           let wopr = doc.games.filter((v)=>{return v.winner=='O'}).length;
                           let tie = doc.games.filter((v)=>{return v.winner==' '}).length;
                           res.json({status: 'OK',human,wopr,tie});
                       }).catch((err)=>{res.json({status:'ERROR'});});
                    }
                  });
              }
         });
});

//Verify Token

function verifyToken(req,res,next) {
    let token = req.cookies['token'];
    if(!token) { res.send({status: 'ERROR'});}    
    else{
       req.token = token;
       next();
    }
}



app.listen(5000, '192.168.122.10');
