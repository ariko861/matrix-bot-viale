import { LogService, MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import config from "../config";
const fs = require('fs')
const appFunction = require("../global");
const lilynode = require("lilynode");
const musicPath = config.dataPath + "/music";


export async function runMusicCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient) {
    // The first argument is always going to be us, so get the second argument instead.
    let musicNumber = args[1];
    if (!musicNumber) return appFunction.sendSimpleMessage(client, roomId, "Bwouf, il me faut un numéro de chanson à aller chercher !");
    
    let musicFilePath = musicPath + "/" + musicNumber + ".ly";
    try {
        fs.access(musicPath, fs.F_OK, (err) => {
            if (err) {
                LogService.error(err);
                return appFunction.sendSimpleMessage(client, roomId, "Bwouf, je ne connais pas cette chanson !");
            }
            // if file exists :
            let mime = "image/svg+xml";
            lilynode.renderFile(musicFilePath, { format: "svg"}, async function(error, output){
                if (error) {
                    LogService.error(error);
                    return appFunction.sendSimpleMessage(client, roomId, "Bwouf, il y a eu un problème !");
                } else {
                    let mxc = await client.uploadContent(output, mime, musicNumber + ".svg");
                    LogService.error(mxc);
                    return client.sendMessage(roomId, {
                        body: musicNumber+ ".svg",
                        msgtype: "m.image",
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
