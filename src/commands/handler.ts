import { LogService, MatrixClient, MessageEvent, RichReply, UserID } from "matrix-bot-sdk";
import { runHelloCommand } from "./hello";
import { runMesseCommand } from "./messe";
import { runAutoCommand } from "./auto";
import config from "../config";
import * as htmlEscape from "escape-html";

// The prefix required to trigger the bot. The bot will also respond
// to being pinged directly.
export const COMMAND_PREFIX = "!patton";

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
        if (event.messageType !== "m.text") return; // Ignore non-text messages
        
        // This part is to see if the user is allowed to use the bot.
        const userPermitted = config.permissions.use;
        let senderServerAndName = event.sender.split(":");
        const userIsAllowed = ( userPermitted.includes(event.sender) || userPermitted.includes("*:" + senderServerAndName[1]) || userPermitted.includes("*") );
        

        // Ensure that the event is a command before going on. We allow people to ping
        // the bot as well as using our COMMAND_PREFIX.
        const prefixes = [COMMAND_PREFIX, `${this.localpart}:`, `${this.displayName}:`, `${this.userId}:`];
        const prefixUsed = prefixes.find(p => event.textBody.startsWith(p));
        
        
        let args = [];
        
        // Try and figure out what command the user ran, defaulting to help
        try {
            if (!prefixUsed) {
                const roomMembers = await this.client.getJoinedRoomMembers(roomId);   
                if ( roomMembers.length > 2 ) { // Check if the room is a direct message room
                    return; 
                }
                args = event.textBody.trim().split(' ');
            } else {
                args = event.textBody.substring(prefixUsed.length).trim().split(' ');
            }
        } catch (e) {
            LogService.error("getJoinedRoomMembers error", e)
        }
        
        // Try and figure out what command the user ran, defaulting to help
        try {
            if (!userIsAllowed) { // Send a message refusing authorization if user is not allowed
                const notAuthorized = "Désolé, Patton n'obéit qu'à ses maîtres.";
                
                const text = `${notAuthorized}`;
                const html = `${htmlEscape(notAuthorized)}`;
                const reply = RichReply.createFor(roomId, ev, text, html); // Note that we're using the raw event, not the parsed one!
                reply["msgtype"] = "m.notice"; // Bots should always use notices
                return this.client.sendMessage(roomId, reply);
            }
            const salutations = ['hello', 'salut', 'bonjour'];
            if ( salutations.includes(args[0]) ) {
                return runHelloCommand(roomId, event, args, this.client);
            } else if (args[0] === "messe" || args[0] === "evangile" || args[0] === "lecture" || args[0] === "psaume"){
                return runMesseCommand(roomId, args, this.client);
            } else if (args[0] === "auto"){
                return runAutoCommand(roomId, args, this.client);
            } else {
                const help = "" +
                    "!patton messe [tout]     - Afficher les lectures de la messe du jour ( ajouter 'tout' pour obtenir le contenu des textes également ).\n" +
                    "!patton evangile         - Afficher l'évangile du jour.\n" +
                    "!patton lecture          - Afficher la première lecture du jour.\n" +
                    "!patton psaume           - Afficher le psaume de la messe du jour.\n" +
                    "!patton auto hh:mm       - Programmer automatiquement la commande messe tous les jours à l'heure donnée.\n" +
                    "!patton auto stop        - Annuler l'envoi automatique\n" +
                    "!patton help             - Afficher ce menu d'aide\n";

                const text = `Menu d'aide, bwouf :\n${help}`;
                const html = `<b>Menu d'aide, bwouf:</b><br /><pre><code>${htmlEscape(help)}</code></pre>`;
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
