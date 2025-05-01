const fs = require('fs');
const path = require('path');

async function clearTmpCommand(sock, chatId, msg) {
    try {
        // Check if user is owner
        const isOwner = msg.key.fromMe;
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command is only available for the owner!' 
            });
            return;
        }

        const tmpDir = path.join(process.cwd(), 'tmp');
        
        // Check if tmp directory exists
        if (!fs.existsSync(tmpDir)) {
            await sock.sendMessage(chatId, { 
                text: '⚠️ Temporary directory does not exist!' 
            });
            return;
        }

        // Read all files in tmp directory
        const files = fs.readdirSync(tmpDir);
        
        if (files.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '✅ Temporary directory is already empty!' 
            });
            return;
        }

        // Delete each file
        let deletedCount = 0;
        for (const file of files) {
            try {
                const filePath = path.join(tmpDir, file);
                fs.unlinkSync(filePath);
                deletedCount++;
            } catch (err) {
                console.error(`Error deleting file ${file}:`, err);
            }
        }

        await sock.sendMessage(chatId, { 
            text: `✅ Successfully cleared ${deletedCount} temporary files!` 
        });

    } catch (error) {
        console.error('Error in cleartmp command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to clear temporary files!' 
        });
    }
}

module.exports = clearTmpCommand; 