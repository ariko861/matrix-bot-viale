import { LogService, MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";

const appFunction = require("../global");

export async function runInviteCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient) {
    // The first argument is always going to be us, so get the second argument instead.
    let guest = args[1];
    if (!guest) return appFunction.sendSimpleMessage(client, roomId, "Bwouf, qui dois je aller chercher ?");
    try {
        let guestName = await client.getUserProfile(guest);
        let newRoom = await client.createRoom({visibility:"private", invite:[guest], is_direct: true});
        let newEncrypt = await client.sendEvent(newRoom, "m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" });
        LogService.error(newEncrypt);
    } catch (e) {
        LogService.error("InviteHandler", e);
        return appFunction.sendSimpleMessage(client, roomId, "Bwouf, je n'ai pas trouvé cette personne !");
        
    }
    
    
    
/*    client.createRoom(function(newRoomId){
        if (newRoomId){
            
        } else {
            return appFunction.sendSimpleMessage(client, roomId, "Bwouf, j'ai rencontré")
        }
    });
    
    let text = `Bwouf ${sayHelloTo}!`;
    let html = `Bwouf ${htmlEscape(sayHelloTo)}!`;

    if (sayHelloTo.startsWith("@")) {
        Awesome! The user supplied an ID so we can create a proper mention instead
        const mention = await MentionPill.forUser(sayHelloTo, roomId, client);
        text = `Bwouf ${mention.text}!`;
        html = `Bwouf ${mention.html}!`;
    }*/
}
 
