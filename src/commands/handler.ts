import { LogService, MatrixClient, MessageEvent, RichReply, UserID } from "matrix-bot-sdk";
import { runHelloCommand } from "./hello";
import { runMesseCommand } from "./messe";
import { runAutoCommand } from "./auto";
import { runMusicCommand } from "./music";
import { runAmourCommand } from "./amour";
import { runInviteCommand } from "./invite";
import config from "../config";
import * as htmlEscape from "escape-html";
const fs = require('fs');
const db = require('../sqlite');
const musicPath = config.dataPath + "/music/";
const appFunction = require("../global");

// The prefix required to trigger the bot. The bot will also respond
// to being pinged directly.
export const COMMAND_PREFIX = "!patton";
export const MUSIC_PREFIX = "!music";

// This is where all of our commands will be handled
export default class CommandHandler {

    // Just some variables so we can cache the bot's display name and ID
    // for command matching later.
    private displayName: string;
    private userId: string;
    private localpart: string;

    constructor(private client: MatrixClient) {
    }

    public async start() {
        // Populate the variables above (async)
        await this.prepareProfile();

        // Set up the event handler
        this.client.on("room.message", this.onMessage.bind(this));
    }

    private async prepareProfile() {
        this.userId = await this.client.getUserId();
        this.localpart = new UserID(this.userId).localpart;

        try {
            const profile = await this.client.getUserProfile(this.userId);
            if (profile && profile['displayname']) this.displayName = profile['displayname'];
        } catch (e) {
            // Non-fatal error - we'll just log it and move on.
            LogService.warn("CommandHandler", e);
        }
    }

    private async onMessage(roomId: string, ev: any) {
        const event = new MessageEvent(ev);
        if (event.isRedacted) return; // Ignore redacted events that come through
        if (event.sender === this.userId) return; // Ignore ourselves
        if (event.messageType !== "m.text" && event.messageType !== "m.file") return; // Ignore non-text messages
        
        let matrixClient = this.client;
        
        let senderServerAndName = event.sender.split(":");
        // This part is to see if the user is allowed to use the bot.
        const userPermitted = config.permissions.use;
        const userIsAllowed = ( userPermitted.includes(event.sender) || userPermitted.includes("*:" + senderServerAndName[1]) || userPermitted.includes("*") );
        
        const invitePermission = config.permissions.invite;
        const inviteIsAllowed = ( invitePermission.includes(event.sender) || invitePermission.includes("*:" + senderServerAndName[1]) || invitePermission.includes("*") );
        
        const adminPermission = config.permissions.admin;
        const administrationAllowed = ( adminPermission.includes(event.sender) || adminPermission.includes("*:" + senderServerAndName[1]) || adminPermission.includes("*") );
        
        if (event.messageType === "m.file") { // Appel cette fonction si le message est une image
            if (!administrationAllowed) return;
            if ( !event.textBody.endsWith(".ly") ) return;
            let mxc = event['content']['url']
            let response = await this.client.downloadContent(mxc);
            
            let fileName = event.textBody;
            let musicNumber = fileName.substring(0, fileName.indexOf('_') );
            let musicName = fileName.substring(fileName.indexOf('_') + 1, fileName.indexOf('.ly') );
            
            fs.writeFile( musicPath + musicNumber + '.ly' , response.data, (err) => {
                if (err) throw err;
                db.insertMusic(musicNumber, musicName, "/music/" + musicNumber + '.ly', function(){
                    return appFunction.sendSimpleMessage(matrixClient, roomId, 'Bwouf, nouvelle musique ajoutée !');                    
                });
            });
            

            
        } else {

            // Ensure that the event is a command before going on. We allow people to ping
            // the bot as well as using our COMMAND_PREFIX.
            const prefixes = [COMMAND_PREFIX, MUSIC_PREFIX, `${this.localpart}:`, `${this.displayName}:`, `${this.userId}:`];
            const prefixUsed = prefixes.find(p => event.textBody.startsWith(p));
                        
            let args = [];
            let textBody = "";
            
            // Try and figure out what command the user ran, defaulting to help
            try {
                if (!prefixUsed) {
                    const roomMembers = await this.client.getJoinedRoomMembers(roomId);   
                    if ( roomMembers.length > 2 ) { // Check if the room is a direct message room
                        return; 
                    }
                    args = event.textBody.trim().split(' ');
                    textBody = event.textBody.trim().substring(args[0].length).trim()
                } else {
                    args = event.textBody.substring(prefixUsed.length).trim().split(' ');
                    textBody = event.textBody.trim().substring(prefixUsed.length + 1 + args[0].length).trim()
                }
            } catch (e) {
                LogService.error("getJoinedRoomMembers error", e)
            }
            
            // Try and figure out what command the user ran, defaulting to help
            try {
                if (!userIsAllowed) return appFunction.sendSimpleMessage(this.client, roomId, "Désolé, Patton n'obéit qu'à ses maîtres."); // renvoie un message si l'utilisateur n'est pas autorisé.
                
                const salutations = ['hello', 'salut', 'bonjour'];
                const invitations = ['invite', 'cherche'];
                const musications = ['music', 'musique', 'song', 'chanson', 'chant'];
                const amourations = ['amour', 'amour+', 'amourcron+', 'amourcron', 'amourcron-']
                
                if ( prefixUsed === "!music" ) {
                    args.unshift("music");
                    return runMusicCommand(roomId, event, args, this.client);
                }
                if ( salutations.includes(args[0]) ) {
                    return runHelloCommand(roomId, event, args, this.client);
                } else if (args[0] === "messe" || args[0] === "evangile" || args[0] === "lecture" || args[0] === "psaume"){
                    return runMesseCommand(roomId, args, this.client);
                } else if (args[0] === "auto"){
                    return runAutoCommand(roomId, args, this.client);
                } else if ( invitations.includes(args[0]) ){
                    if ( !inviteIsAllowed ) return appFunction.sendSimpleMessage(this.client, roomId, "Désolé, Patton n'obéit qu'à ses maîtres."); // renvoie un message si l'utilisateur n'est pas autorisé.
                    return runInviteCommand(roomId, event, args, this.client);
                } else if ( musications.includes(args[0]) ){
                    return runMusicCommand(roomId, event, args, this.client);
                } else if ( amourations.includes(args[0]) ){
                    return runAmourCommand(roomId, args, this.client, textBody);
                } else {
                    const help = "" +
                        "- !patton messe [tout]     - Afficher les lectures de la messe du jour ( ajouter 'tout' pour obtenir le contenu des textes également ).\n" +
                        "- !patton evangile         - Afficher l'évangile du jour.\n" +
                        "- !patton lecture          - Afficher la première lecture du jour.\n" +
                        "- !patton psaume           - Afficher le psaume de la messe du jour.\n" +
                        "- !patton auto hh:mm       - Programmer automatiquement la commande messe tous les jours à l'heure donnée.\n" +
                        "- !patton auto stop        - Annuler l'envoi automatique\n" +
                        "- !music <num>             - Envoyer la partition du chant du carnet au numéro correspondant. ( ex: !music 29 )\n" +
                        "- !music <num> son         - Envoyer l'audio du chant du carnet au numéro correspondant. ( ex: !music 29 )\n" +
                        "- !patton help             - Afficher ce menu d'aide\n";

                    const text = `Menu d'aide, bwouf :\n${help}`;
                    const html = `<b>Menu d'aide, bwouf:</b><br /><pre><code>${help}</code></pre>`;
                    const reply = RichReply.createFor(roomId, ev, text, html); // Note that we're using the raw event, not the parsed one!
                    reply["msgtype"] = "m.notice"; // Bots should always use notices
                    return this.client.sendMessage(roomId, reply);
                }
            } catch (e) {
                // Log the error
                LogService.error("CommandHandler", e);

                // Tell the user there was a problem
                const message = "There was an error processing your command";
                const reply = RichReply.createFor(roomId, ev, message, message); // We don't need to escape the HTML because we know it is safe
                reply["msgtype"] = "m.notice";
                return this.client.sendMessage(roomId, reply);
            }
        }
    }
}
