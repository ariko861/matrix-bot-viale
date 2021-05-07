module.exports = {
    
    sendSimpleMessage: function(client:any, roomId:string, message:string){
        client.sendMessage(roomId, {
            body: message,
            msgtype: "m.notice",
            format: "org.matrix.custom.html",
                formatted_body: message,
        });
    },
    
    formatTime: function(time: string){
        var result = "", m;
        var re = /^\s*([01]?\d|2[0-3]):?([0-5]\d)\s*$/;
        if ((m = time.match(re))) {
            result = (m[1].length === 2 ? "" : "0") + m[1] + ":" + m[2];
        }
        return result;
    }
    
}
