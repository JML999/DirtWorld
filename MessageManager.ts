import { Player } from 'hytopia';

export class MessageManager {
    private static readonly MESSAGE_DURATION = 8000; // 8 seconds

    constructor() {}

    /**
     * Sends a message to the player's UI that will auto-dismiss after 8 seconds
     * @param message The message to display
     */
    sendGameMessage(message: string, player: Player) {
        // Send the message with a unique ID
        console.log("sending message", message);
        const messageId = Date.now().toString();
        player.ui.sendData({
            type: 'gameUpdate',
            messageId: messageId,
            message: message
        });

        // Schedule message removal after 8 seconds
        setTimeout(() => {
            player.ui.sendData({
                type: 'removeGameMessage',
                messageId: messageId
            });
        }, MessageManager.MESSAGE_DURATION);
    }
}