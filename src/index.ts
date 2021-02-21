import {
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    MatrixClient,
    PantalaimonClient,  
    RichConsoleLogger,
    SimpleFsStorageProvider
} from "matrix-bot-sdk";
import * as path from "path";
import {promises as fs} from "fs";
import config from "./config";
import CommandHandler from "./commands/handler";
import { runMesseCommand } from "./commands/messe";

const cron = require('node-cron');
const db = require('./sqlite');

db.createCronTable();

// First things first: let's make the logs a bit prettier.
LogService.setLogger(new RichConsoleLogger());

if (!config.logLevel) {
    // For now let's also make sure to log everything (for debugging)
    LogService.setLevel(LogLevel.INFO);
} else {
    switch ( config.logLevel ) {
        case "WARN":
            LogService.setLevel(LogLevel.WARN);
            break;
        case "ERROR":
            LogService.setLevel(LogLevel.ERROR);
            break;
        case "DEBUG":
            LogService.setLevel(LogLevel.DEBUG);
            break;
        default:
            LogService.setLevel(LogLevel.INFO);
            break;
    }
    
}
// Print something so we know the bot is working
LogService.info("index", "Bot starting...");

(async function () {    // This is the startup closure where we give ourselves an async context

    // Prepare the storage system for the bot
    const storage = new SimpleFsStorageProvider(path.join(config.dataPath, "bot.json"));

    // Create the client
    let client: MatrixClient;
    if (config.pantalaimon.use) {
        const pantalaimon = new PantalaimonClient(config.homeserverUrl, storage);
        client = await pantalaimon.createClientWithCredentials(config.pantalaimon.username, config.pantalaimon.password);
    } else {
        client = new MatrixClient(config.homeserverUrl, config.accessToken, storage);
    }

    // Setup the autojoin mixin (if enabled)
    if (config.autoJoin) {
        const userPermitted = config.permissions.invite;
        if ( userPermitted.includes('*') ) {
            AutojoinRoomsMixin.setupOnClient(client);
        } else {
            client.on("room.invite", (roomId: string, inviteEvent: any) => {
                let sender = inviteEvent["sender"];
                let senderServer = sender.split(":");
                
                if ( userPermitted.includes(sender) || userPermitted.includes("*:" + senderServer[1]) ) {
                    return client.joinRoom(roomId);
                } else {
                    return client.leaveRoom(roomId);
                }
            });
        }
    }
    
    cron.schedule('0 1 * * *', function() { // run function everyday at 1am
        db.getCrons(function(list){ //get all row in Crons table
            list.forEach(function(row){  // for each row
                let clock = row.time.split(':');
                let now = new Date();
                let timeout = new Date();
                timeout.setHours(clock[0], clock[1]);
                if ( timeout < now ) {
                    timeout.setDate(timeout.getDate() + 1);
                }
                let diffTime = Math.abs(timeout.getTime() - now.getTime());
                setTimeout(function(){
                    runMesseCommand(row.roomId, ['messe'], client);
                }, diffTime);
                LogService.info("timer set in : " + diffTime / 60000 + " minutes for room: " + row.roomId);
            });
        });
    });
    
    

    // Prepare the command handler
    const commands = new CommandHandler(client);
    
    const myUserId = await client.getUserId();
    const profile = await client.getUserProfile(myUserId);
    if (!profile || profile.displayname !== config.profile.displayname) {
        LogService.info("Main", "Displayname not equal to configured displayname. Setting..");
        await client.setDisplayName(config.profile.displayname);
        LogService.info("Main", "Displayname set");
    }
    if (profile && config.profile.avatar && !profile.avatar_url) {
        LogService.info("Main", "Avatar not set on profile. Setting..");
        const avatarData = await fs.readFile("./data/avatar.png");
        const mxc = await client.uploadContent(avatarData, "image/png", "avatar.png");
        await client.setAvatarUrl(mxc);
        LogService.info("Main", "Avatar set");
    }
    
    await commands.start();
    LogService.info("index", "Starting sync...");
    await client.start(); // This blocks until the bot is killed
})();
