const fs = require('fs');
const path = require('path');
const isAdmin = require('../helpers/isAdmin');
const { channelInfo } = require('../config/messageConfig');

// Define paths
const databaseDir = path.join(process.cwd(), 'database');
const warningsPath = path.join(databaseDir, 'warnings.json');

// Initialize warnings file if it doesn't exist
function initializeWarningsFile() {
    // Create database directory if it doesn't exist
    if (!fs.existsSync(databaseDir)) {
        fs.mkdirSync(databaseDir, { recursive: true });
    }
    
    // Create warnings.json if it doesn't exist
    if (!fs.existsSync(warningsPath)) {
        fs.writeFileSync(warningsPath, JSON.stringify({}), 'utf8');
    }
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    // Initialize files first
    initializeWarningsFile();

    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: 'Please make the bot an admin first.',
            ...channelInfo 
        });
        return;
    }

    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { 
            text: 'Only group admins can use the warn command.',
            ...channelInfo 
        });
        return;
    }

    let userToWarn;
    
    // Check for mentioned users
    if (mentionedJids && mentionedJids.length > 0) {
        userToWarn = mentionedJids[0];
    }
    // Check for replied message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToWarn = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToWarn) {
        await sock.sendMessage(chatId, { 
            text: 'Please mention the user or reply to their message to warn!', 
            ...channelInfo 
        });
        return;
    }

    try {
        // Read warnings, create empty object if file is empty
        let warnings = {};
        try {
            warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
        } catch (error) {
            warnings = {};
        }

        // Initialize nested objects if they don't exist
        if (!warnings[chatId]) warnings[chatId] = {};
        if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;
        
        warnings[chatId][userToWarn]++;
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

        await sock.sendMessage(chatId, { 
            text: `⚠️ Warning ${warnings[chatId][userToWarn]}/3\n${userToWarn.split('@')[0]} has been warned!`,
            mentions: [userToWarn],
            ...channelInfo 
        });

        // Auto-kick after 3 warnings
        if (warnings[chatId][userToWarn] >= 3) {
            await sock.groupParticipantsUpdate(chatId, [userToWarn], "remove");
            delete warnings[chatId][userToWarn];
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
            
            await sock.sendMessage(chatId, { 
                text: `${userToWarn.split('@')[0]} has been kicked after receiving 3 warnings!`,
                mentions: [userToWarn],
                ...channelInfo 
            });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        await sock.sendMessage(chatId, { 
            text: 'Failed to warn user!', 
            ...channelInfo 
        });
    }
}

module.exports = warnCommand;
