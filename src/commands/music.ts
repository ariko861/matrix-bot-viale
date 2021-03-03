import { LogService, MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import config from "../config";
const fs = require('fs');
const appFunction = require("../global");
const lilynode = require("lilynode");
const musicPath = config.dataPath + "/music";


export async function runMusicCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient) {
    // The first argument is always going to be us, so get the second argument instead.
    let musicNumber = args[1];
    if (!musicNumber) return appFunction.sendSimpleMessage(client, roomId, "Bwouf, il me faut un numéro de chanson à aller chercher !");
    
    let musicOption = "";
    let mime = "";
    let extension = "";
    let msgType = "";
    
    if ( args[2] && args[2] === "midi" ) {
        musicOption = "midi";
        extension = ".mid";
        mime = "audio/midi";
        msgType = "m.audio";
    } else {
        musicOption = "png";
        extension = ".png";
        mime = "image/png"; //image/svg+xml for svg
        msgType = "m.image";
    }
    
    let musicFilePath = musicPath + "/" + musicNumber + ".ly";
    try {
        fs.access(musicPath, fs.F_OK, (err) => {
            if (err) {
                LogService.error(err);
                return appFunction.sendSimpleMessage(client, roomId, "Bwouf, je ne connais pas cette chanson !");
            }
            
            
            // if file exists :            
            lilynode.renderFile(musicFilePath, { format: musicOption}, async function(error, output){
                if (error) {
                    LogService.error(error);
                    return appFunction.sendSimpleMessage(client, roomId, "Bwouf, il y a eu un problème !");
                } else {
                    let mxc = await client.uploadContent(output, mime, musicNumber + extension );
                    fs.writeFileSync(musicPath + "/" + musicNumber + extension, output);
                    LogService.error(mxc);
                    return client.sendMessage(roomId, {
                        body: musicNumber + extension,
                        msgtype: msgType,
                        url: mxc,
                        info: {
                            mimetype: mime,
                        }
                    });
                    
                }
            });
            
        });
    } catch (error) {
        LogService.error(error);
    }
}
