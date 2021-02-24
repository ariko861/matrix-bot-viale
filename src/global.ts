module.exports = {
    
    sendSimpleMessage: function(client:any, roomId:string, message:string){
        client.sendMessage(roomId, {
            body: message,
            msgtype: "m.notice",
            format: "org.matrix.custom.html",
                formatted_body: message,
        });
    },
    
}
