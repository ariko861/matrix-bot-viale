import { MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";

export async function runHelloCommand(roomId: string, event: MessageEvent<MessageEventContent>, args: string[], client: MatrixClient) {
    // The first argument is always going to be us, so get the second argument instead.
    let sayHelloTo = args[1];
    if (!sayHelloTo) sayHelloTo = event.sender;

    let text = `Bwouf ${sayHelloTo}!`;
    let html = `Bwouf ${htmlEscape(sayHelloTo)}!`;

    if (sayHelloTo.startsWith("@")) {
        // Awesome! The user supplied an ID so we can create a proper mention instead
        const mention = await MentionPill.forUser(sayHelloTo, roomId, client);
        text = `Bwouf ${mention.text}!`;
        html = `Bwouf ${mention.html}!`;
    }

    // Now send that message as a notice
    return client.sendMessage(roomId, {
        body: text,
        msgtype: "m.notice",
        format: "org.matrix.custom.html",
        formatted_body: html,
    });
}
