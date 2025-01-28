const { isAdmin } = require('../helpers/isAdmin');
const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'KnightBot MD',
            serverMessageId: -1
        }
    }
};

// Function to handle manual demotions via command
async function demoteCommand(sock, chatId, mentionedJids, message) {
    let userToDemote = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        userToDemote = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (userToDemote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user or reply to their message to demote!', 
            ...channelInfo 
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        const mentions = userToDemote.map(jid => `${jid.split('@')[0]}`).join(', ');
        await sock.sendMessage(chatId, { 
            text: `Successfully demoted ${mentions} from admin!`,
            mentions: userToDemote,
            ...channelInfo 
        });
    } catch (error) {
        console.error('Error in demote command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to demote user(s)!', ...channelInfo });
    }
}

// Function to handle automatic demotion detection
async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        console.log('Demotion Event Data:', {
            groupId,
            participants,
            author
        });

        const mentions = participants.map(jid => `${jid.split('@')[0]}`).join(', ');
        let demotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = author;
            demotedBy = `${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
            
            console.log('Author Info:', {
                original: author,
                formatted: authorJid,
                demotedBy,
                mentionList
            });
        } else {
            demotedBy = 'System';
            console.log('No author found in event');
        }

        await sock.sendMessage(groupId, {
            text: `👑 ${mentions} has been demoted from admin by ${demotedBy}`,
            mentions: mentionList,
            ...channelInfo
        });
    } catch (error) {
        console.error('Error handling demotion event:', error);
    }
}

module.exports = { demoteCommand, handleDemotionEvent };
