const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual Telegram bot token
const token = '6832984501:AAF07ysitoEpXzavwzvggkhWMEprw4i1Nyw';  
const bot = new TelegramBot(token, { polling: true });

// In-memory store for user data
let usersData = {};

// Function to send a message to the admin
function sendAdminNotification(message) {
    const adminChatId = '7152830690'; // Replace with your actual admin Chat ID
    bot.sendMessage(adminChatId, message).catch(error => {
        console.error("Failed to send message to admin:", error);
    });
}

// Welcome message and handling referrals
function sendWelcomeMessage(chatId) {
    const welcomeOpts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Join Channel 1", url: "https://t.me/+warzZu2LpW8xMTk1" }],
                [{ text: "Join Channel 2", url: "https://t.me/DevilMods444" }],
                [{ text: "I've Joined", callback_data: 'check_membership' }]
            ]
        }
    };
    bot.sendMessage(chatId, "Please join these channels to earn money:", welcomeOpts);
}

// Main menu with various options
function sendMainMenu(chatId) {
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Check Wallet", callback_data: 'check_wallet' }],
                [{ text: "Withdraw", callback_data: 'withdraw' }],
                [{ text: "Refer", callback_data: 'refer' }],
                [{ text: "Support", url: "https://t.me/Shahil444" }]
            ]
        }
    };
    bot.sendMessage(chatId, "Select an option:", opts);
}

// Handling different types of callback queries
function handleCallbackQuery(query, chatId) {
    switch (query.data) {
        case 'check_membership':
            if (!usersData[chatId].joined) {
                usersData[chatId].joined = true;
                usersData[chatId].balance += 2;
                bot.sendMessage(chatId, "You have joined successfully ✅\nYour balance is now: ₹" + usersData[chatId].balance);
                sendMainMenu(chatId);
            } else {
                bot.sendMessage(chatId, "You have already joined the channels ✅");
            }
            break;
        case 'check_wallet':
            bot.sendMessage(chatId, `Your current balance is: ₹${usersData[chatId].balance}`);
            break;
        case 'withdraw':
            bot.sendMessage(chatId, "Enter the amount to withdraw:", { reply_markup: { force_reply: true } });
            break;
        case 'refer':
            bot.sendMessage(chatId, `Share this link to refer friends: https://t.me/clickforcashh_bot?start=${chatId}`);
            break;
        default:
            sendMainMenu(chatId);
    }
}

// Respond to callback queries
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id.toString();
    handleCallbackQuery(query, chatId);
});

// Handle /start command and referral tracking
bot.onText(/\/start(.*)/, (msg, match) => {
    const chatId = msg.chat.id.toString();
    const refId = match[1].trim(); // Extract referral ID if present

    if (!usersData[chatId]) { // New user case
        usersData[chatId] = { balance: 0, referred: 0, joined: false, referrer: "" };
        sendWelcomeMessage(chatId);
        
        if (refId && !usersData[refId] && refId !== chatId) { // Check for valid and non-self referral
            usersData[chatId].referrer = refId;
            if (!usersData[refId]) { // Create referrer data if it does not exist
                usersData[refId] = { balance: 0, referred: 0, joined: false, referrer: "" };
            }
            usersData[refId].referred++;
            bot.sendMessage(refId, `A new user has joined using your referral link. Total referred: ${usersData[refId].referred}`);
        }
    } else {
        sendMainMenu(chatId);
    }
});

// Handle direct message responses for withdrawals
bot.on('message', (msg) => {
    if (msg.reply_to_message && msg.reply_to_message.text.includes("Enter the amount to withdraw:")) {
        const chatId = msg.chat.id;
        const amount = parseFloat(msg.text);
        if (!isNaN(amount) && amount <= usersData[chatId].balance && amount > 0) {
            bot.sendMessage(chatId, "Please enter your UPI ID for the transaction:", { reply_markup: { force_reply: true } });
            bot.once('message', (msg) => {
                if (msg.text.includes('@')) {  // Simple validation for UPI ID format
                    const upiId = msg.text;
                    usersData[chatId].balance -= amount;
                    sendAdminNotification(`Withdrawal request: ₹${amount} to UPI ID ${upiId} from user ${chatId}.`);
                    bot.sendMessage(chatId, `Withdrawal request for ₹${amount} to UPI ID ${upiId} has been sent for processing.`);
                } else {
                    bot.sendMessage(chatId, "Invalid UPI ID. Please try again.");
                }
            });
        } else {
            bot.sendMessage(chatId, "Invalid amount or insufficient funds.");
        }
    }
});

// Admin command to see total users
bot.onText(/\/users/, (msg) => {
    const adminChatId = '7152830690'; // Replace with your actual admin chat ID
    if (msg.chat.id.toString() === adminChatId) {
        const totalUsers = Object.keys(usersData).length;
        bot.sendMessage(msg.chat.id, `Total registered users: ${totalUsers}`);
    } else {
        bot.sendMessage(msg.chat.id, "You do not have permission to use this command.");
    }
});

console.log("Bot started. Press Ctrl+C to terminate.");
