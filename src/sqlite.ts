import { LogService } from "matrix-bot-sdk";

import config from "./config";

const sqlite3 = require("sqlite3");

const dbPath = config.dataPath + "/database.db";

// Setting up a database for storing data.
const db = new sqlite3.Database(dbPath, function(err){
    if (err) {
        LogService.error(err);
        return;
    }
    LogService.info('Connected to ' + dbPath + ' database');
    
});

const dbSchema = `CREATE TABLE IF NOT EXISTS Crons (
        roomId text NOT NULL UNIQUE PRIMARY KEY,
        time text NOT NULL,
        command text NOT NULL
    );`
    
const dbMusicSchema = `CREATE TABLE IF NOT EXISTS Musics (
        musicNumber text NOT NULL UNIQUE PRIMARY KEY,
        name text,
        path text NOT NULL UNIQUE
    );`

const dbAmourCronSchema = `CREATE TABLE IF NOT EXISTS AmourCrons (
        roomId text NOT NULL UNIQUE PRIMARY KEY,
        time text NOT NULL
    );`

const dbAmourSchema = `CREATE TABLE IF NOT EXISTS Amours (
        parole text NOT NULL
    );`


module.exports = {
  
    createCronTable: function(){
        db.exec(dbSchema, function(err:any){
            if (err) {
                LogService.error(err);
            }
        });
    },
    
    createMusicsTable: function(){
        db.exec(dbMusicSchema, function(err:any){
            if (err) {
                LogService.error(err);
            }
        });
    },
    
    createAmourCronsTable: function(){
        db.exec(dbAmourCronSchema, function(err:any){
            if (err) {
                LogService.error(err);
            }
        });
    },
    
    createAmoursTable: function(){
        db.exec(dbAmourSchema, function(err:any){
            if (err) {
                LogService.error(err);
            }
        });
    },
    
    
    insertAmour: function(parole:string, callback:any){
        db.run("INSERT INTO Amours (parole) VALUES ($parole)", {
            $parole: parole,
        }, function(){
            callback();
        });
    },
    
    insertAmourCron: function(roomId:string, time:string, callback:any){
        db.run("INSERT INTO AmourCrons (roomId, time) VALUES ($roomId, $time) ON CONFLICT(roomId) DO UPDATE SET time=excluded.time", {
            $roomId: roomId,
            $time: time,
        }, function(){
            callback();
        });
    },
    
    getAmourCrons: function(callback:any){
        db.all("SELECT * FROM AmourCrons", function(err, list) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(list);
        });
    },
    
    getRoomAmourCron: function(roomId:string, callback:any){
        db.get("SELECT time FROM AmourCrons WHERE roomId = $roomId", {
            $roomId: roomId
        }, function(err, row) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(row);
        });
    },
    
    getAmour: function(callback:any){
        db.get("SELECT * FROM Amours ORDER BY RANDOM() LIMIT 1", function(err, row) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(row);
        });
    }, 
    
    deleteAmourCron: function(roomId:string, callback:any){
        db.run("DELETE FROM AmourCrons WHERE roomId = $roomId", {
            $roomId: roomId
        }, function(){
            callback();
        });
    },
    
    insertMusic: function(musicNumber:string, name:string, path:string, callback:any){
        db.run("INSERT INTO Musics (musicNumber, name, path) VALUES ($musicNumber, $name, $path) ON CONFLICT(musicNumber) DO UPDATE SET name=excluded.name,path=excluded.path", {
            $musicNumber: musicNumber,
            $name: name,
            $path: path
        }, function(){
            callback();
        });
    },
    getMusic: function(musicNumber:string, callback:any){
        db.get("SELECT musicNumber, name, path FROM Musics WHERE musicNumber = $musicNumber", {
            $musicNumber: musicNumber
        }, function(err, row) {
            callback(err, row);
        });
    },   
    listMusics: function(callback:any){
        db.all("SELECT * FROM Musics ORDER BY musicNumber ASC", function(err, list) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(list);
        });
    },
    
    insertCron: function(roomId:string, time:string, command:string, callback:any){
        db.run("INSERT INTO Crons (roomId, time, command) VALUES ($roomId, $time, $command) ON CONFLICT(roomId) DO UPDATE SET time=excluded.time", {
            $roomId: roomId,
            $time: time,
            $command: command
        }, function(){
            callback();
        });
    },
    
    getCrons: function(callback:any){
        db.all("SELECT * FROM Crons", function(err, list) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(list);
        });
    },    
    
    deleteCron: function(roomId:string, callback:any){
        db.run("DELETE FROM Crons WHERE roomId = $roomId", {
            $roomId: roomId
        }, function(){
            callback();
        });
    },
    
    getRoomCron: function(roomId:string, callback:any){
        db.get("SELECT time, command FROM Crons WHERE roomId = $roomId", {
            $roomId: roomId
        }, function(err, row) {
            if (err){
                LogService.error(err);
                return;
            }
            callback(row);
        });
    },   
    
};
