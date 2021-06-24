import { MatrixClient, MentionPill, MessageEvent, MessageEventContent } from "matrix-bot-sdk";
import * as htmlEscape from "escape-html";
import config from "../config";

export async function runFormCommand(roomId: string, args: string[], client: MatrixClient) {
    
    //let arg = args[1];
    var got = require('got');
    
    var url = config.formUrl;
    var token = config.formToken;
    
    

(async () => {
	const {body} = await got.post(url, {
		json: {
			token: token
		},
		responseType: 'json'
	});

	console.log(body.link);
    return client.sendMessage(roomId, {
        body: body.link,
        msgtype: "m.notice",
        format: "org.matrix.custom.html",
        formatted_body: body.link,
    });
	//=> {hello: 'world'}
})();

                   

            
        
            
    
}
