import { MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import config from "../config";

const db = require('../sqlite');
const appFunction = require("../global");

export async function runAmourCommand(roomId: string, args: string[], client: MatrixClient, textBody: string) {
    
    function checkDailyTimeAndRegister(dailytime){
        if (dailytime) {
            db.insertAmourCron(roomId, dailytime, function(){
                let text = 'Patton va maintenant envoyer son amour tous les jours à ' + `${dailytime}`;
                return appFunction.sendSimpleMessage(client, roomId, text);
            });
        }
    }
    
    switch (args[0]) {
        case 'amour':
            db.getAmour((row) => {
                if (row){
                    return appFunction.sendSimpleMessage(client, roomId, "Bwouf, " + row.parole);
                } else {
                    return appFunction.sendSimpleMessage(client, roomId, "Bwouf, on ne m'a encore rien appris en amour !")
                }
            });
            break;
            
        case 'amour+':
            db.insertAmour(textBody, () => {
                return appFunction.sendSimpleMessage(client, roomId, "Bwouf, votre message d'amour " +'"' + textBody + '"' + " a bien été ajouté !");
            });
            break;
        
        case 'amourcron':
            db.getRoomAmourCron(roomId, (row) => {
                if (row) {
                    return appFunction.sendSimpleMessage(client, roomId, "Patton va vous envoyer son amour tous les jours à " + row.time);
                } else {
                    return appFunction.sendSimpleMessage(client, roomId, "Patton n'est pas encore programmé pour envoyer son amour");
                }
            });
            break;
            
        case 'amourcron+':
            let dailytime = args[1];
            if (!dailytime) {
                let d = new Date();
                dailytime = d.toLocaleTimeString("fr-FR", {hour12: false, hour: '2-digit', minute:'2-digit'});
                checkDailyTimeAndRegister(dailytime);   
            } else {
                dailytime = appFunction.formatTime(dailytime);
                if ( !dailytime ) {
                    return appFunction.sendSimpleMessage(client, roomId, `L'heure doit être donnée sous le format 00:00 et comprise entre 00:00 et 23:59, sinon Patton ne comprend pas.`);
                }
                checkDailyTimeAndRegister(dailytime);
            }
            
            break;
        
        case 'amourcron-':
            db.deleteAmourCron(roomId, () => {
                return appFunction.sendSimpleMessage(client, roomId, "Patton ne va plus envoyer d'amour à présent...")
            });
            break;
        
    }
    
}
