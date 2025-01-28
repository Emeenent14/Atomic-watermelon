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

// Function to handle manual promotions via command
async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    // If no user found through either method
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user or reply to their message to promote!', 
            ...channelInfo 
        });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        const mentions = userToPromote.map(jid => `${jid.split('@')[0]}`).join(', ');
        await sock.sendMessage(chatId, { 
            text: `Successfully promoted ${mentions} to admin!`,
            mentions: userToPromote,
            ...channelInfo 
        });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: 'Failed to promote user(s)!', ...channelInfo });
    }
}

// Function to handle automatic promotion detection
async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        console.log('Promotion Event Data:', {
            groupId,
            participants,
            author
        });

        const mentions = participants.map(jid => `${jid.split('@')[0]}`).join(', ');
        let promotedBy;
        let mentionList = [...participants];

        if (author && author.length > 0) {
            // Ensure author has the correct format
            const authorJid = author;
            promotedBy = `${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
            
            console.log('Author Info:', {
                original: author,
                formatted: authorJid,
                promotedBy,
                mentionList
            });
        } else {
            promotedBy = 'System';
            console.log('No author found in event');
        }
        
        await sock.sendMessage(groupId, {
            text: `👑 ${mentions} has been promoted to admin by ${promotedBy}`,
            mentions: mentionList,
            ...channelInfo
        });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };
