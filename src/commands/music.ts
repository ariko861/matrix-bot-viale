import { LogService, MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import config from "../config";
const fs = require('fs');
const appFunction = require("../global");
const db = require('../sqlite');
const lilynode = require("../lilynode");
const musicPath = config.dataPath + "/music";


export async function runMusicCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient) {
    // The first argument is always going to be us, so get the second argument instead.
    let musicNumber = args[1];
    if (!musicNumber || musicNumber === "help" || musicNumber === "aide") {
        let msg = "Aide pour les chants:\n" +
                "- !music <num>                             - Envoyer la partition du chant du carnet au numéro correspondant. ( ex: !music 29 )\n" +
                "- !music <num> son                         - Envoyer l'audio du chant du carnet au numéro correspondant. ( ex: !music 29 son )\n" +
                "- !music <num> soprano/alto/bass/tenor     - Envoyer seulement la voix indiquée du chant correspondant. ( ex: !music 29 soprano)\n";
                        
        let htmlmsg = '<b>Aide pour les chants :</b></br><ul>' +
                "<li>!music <num>                             - Envoyer la partition du chant du carnet au numéro correspondant. ( ex: !music 29 )</li>" +
                "<li>!music <num> son                         - Envoyer l'audio du chant du carnet au numéro correspondant. ( ex: !music 29 son )</li>" +
                "<li>!music <num> soprano/alto/bass/tenor     - Envoyer seulement la voix indiquée du chant correspondant. ( ex: !music 29 soprano)</li>";
                
        return client.sendMessage(roomId, {
                body: msg,
                msgtype: "m.notice",
                format: "org.matrix.custom.html",
                formatted_body: htmlmsg,
            });
    }
    if ( musicNumber === 'list') {
        db.listMusics(function(list){
            let msg = 'Liste des chants disponibles :\n'
            let htmlmsg = '<b>Liste des chants disponibles :</b></br><ul>'
            list.forEach(function(row){
                msg += row.musicNumber + " - " + row.name + "\n";
                htmlmsg += "<li><i>" + row.musicNumber + " - " + row.name + "</i></li>";
            });
            msg += "\nPour ajouter un chant, l'administrateur doit envoyer un fichier .ly avec cette nomenclature : '<numéroduchant>_<nomduchant>.ly";
            htmlmsg += `</ul></br><small>Pour ajouter un chant, l'administrateur doit envoyer un fichier .ly avec cette nomenclature : ${htmlEscape('<numéroduchant>_<nomduchant>')}.ly</small>`;
            
            return client.sendMessage(roomId, {
                body: msg,
                msgtype: "m.notice",
                format: "org.matrix.custom.html",
                formatted_body: htmlmsg,
            });
        });
        
    } else {    
        let lilypondCommands = ["lilypond", "lily", "ly"];
        let midiCommands = ["midi", "son", "sound", "play"];
        let voices = ["soprane", "soprano", "alto", "ténor", "tenor", "bass", "basses"];
        
        let musicOption = "";
        let mime = "";
        let extension = "";
        let msgType = "";
        let voiceOption = "";
        
        if ( args[2] && ( midiCommands.includes(args[2]) || voices.includes(args[2]) ) ) {
            musicOption = "midi";
            extension = ".mid";
            mime = "audio/midi";
            msgType = "m.audio";
            if ( voices.includes(args[2]) ){
                voiceOption = args[2];
            } else if ( args[3] && voices.includes(args[3]) ){
                voiceOption = args[3];
            }
            
        } else {
            musicOption = "png";
            extension = ".png";
            mime = "image/png"; //image/svg+xml for svg
            msgType = "m.image";
        }
            
        let musicFilePath = musicPath + "/" + musicNumber + ".ly";
        try {
            db.getMusic(musicNumber, (err, row) => {
                if (err) {
                    LogService.error(err);
                    throw err;
                } else if (!row){
                    return appFunction.sendSimpleMessage(client, roomId, "Bwouf, je ne connais pas cette chanson !");
                } else {
                    
                    let msgBody = row.musicNumber + voiceOption + " - " + row.name + extension;
                
                    if ( args[2] && lilypondCommands.includes(args[2]) ) {
                        extension = ".ly";
                        mime = "text/x-lilypond";
                        msgType = "m.file";
                        fs.readFile(musicFilePath, async function (err, data) {
                            if (err) return LogService.error(err);
                            let mxc = await client.uploadContent(data, mime, musicNumber + extension );
                            return client.sendMessage(roomId, {
                                body: msgBody,
                                msgtype: msgType,
                                url: mxc,
                                info: {
                                    mimetype: mime,
                                }
                            });
                        });

                    } else {
                    // if file exists :            
                        lilynode.renderFile(musicFilePath, { format: musicOption, voice: voiceOption }, async function(error, output){
                            if (error) {
                                LogService.error(error);
                                return appFunction.sendSimpleMessage(client, roomId, "Bwouf, il y a eu un problème !");
                            } else {
                                let mxc = await client.uploadContent(output, mime, musicNumber + extension );
                                return client.sendMessage(roomId, {
                                    body: msgBody,
                                    msgtype: msgType,
                                    url: mxc,
                                    info: {
                                        mimetype: mime,
                                    }
                                });
                                
                            }
                        });
                    }
                }
            });
        } catch (error) {
            LogService.error(error);
        }
    }
}
