const isAdmin = require('../helpers/isAdmin');
const { channelInfo } = require('../config/messageConfig');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: 'Only group admins can use the kick command.' });
        return;
    }

    let usersToKick = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user or reply to their message to kick!', 
            ...channelInfo 
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
        const mentions = usersToKick.map(jid => `@${jid.split('@')[0]}`).join(', ');
        await sock.sendMessage(chatId, { 
            text: `Successfully kicked ${mentions}!`,
            mentions: usersToKick,
            ...channelInfo 
        });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to kick user(s)!', ...channelInfo });
    }
}

module.exports = kickCommand;
