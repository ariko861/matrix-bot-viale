import { MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import { runMesseCommand } from "./messe";

const db = require('../sqlite');

function formatTime(time) {
    var result = "", m;
    var re = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;
    if ((m = time.match(re))) {
        result = (m[1].length === 2 ? "" : "0") + m[1] + ":" + m[2];
    }
    return result;
}

function sendSimpleMessage(client, roomId, message){
    client.sendMessage(roomId, {
        body: message,
        msgtype: "m.notice",
        format: "org.matrix.custom.html",
            formatted_body: message,
    });
}

export async function runAutoCommand(roomId: string, args: string[], client: MatrixClient) {
    
    let cancel_commands = ["cancel", "annuler", "annule", "stop"];
    function checkDailyTimeAndRegister(dailytime){
        if (dailytime) {
            db.insertCron(roomId, dailytime, 'messe', function(){
                let text = 'Le bot AELF est maintenant programmé pour donner les lectures tous les jours à ' + `${dailytime}`;
                return sendSimpleMessage(client, roomId, text);
            });
        }
    }
    
    if ( cancel_commands.includes(args[1]) ){
        db.deleteCron(roomId, function(){
            return sendSimpleMessage(client, roomId, "L'envoi automatique a été annulé !")
        });
    } else {
        // The first argument is always going to be us, so get the second argument instead.
        let dailytime = args[1];
        if (!dailytime) { // si la commande auto est tapée seule
            db.getRoomCron(roomId, function(row){ // vérifier si un envoi auto est déjà programmé.
                if (row) {
                    return sendSimpleMessage(client, roomId, "La commande '" + row.command + "' est programmée pour s'executer tous les jours à " + row.time);
                } else { // si non, programmer à l'heure actuelle.
                    let d = new Date();
                    dailytime = d.toLocaleTimeString("fr-FR", {hour12: false, hour: '2-digit', minute:'2-digit'});
                    checkDailyTimeAndRegister(dailytime);
                }
            });
        } else {
            dailytime = formatTime(dailytime);
            if ( !dailytime ) {
                return sendSimpleMessage(client, roomId, `L'heure doit être donnée sous le format 00:00 et comprise entre 00:00 et 23:59`);
                
            }
        }
        checkDailyTimeAndRegister(dailytime);
//         if (dailytime) {
//             db.insertCron(roomId, dailytime, 'messe', function(){
//                 let text = 'Le bot AELF est maintenant programmé pour donner les lectures tous les jours à ' + `${dailytime}`;
//                 return sendSimpleMessage(client, roomId, text);
//             });
//         }
    }
    
    


    
}
