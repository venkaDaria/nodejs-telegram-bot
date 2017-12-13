const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); // filesystem - global access without npm
const request = require('request')
const _ = require('lodash'); // for random

const TOKEN = process.env.TOKEN;
const bot = new TelegramBot(TOKEN, {polling: true});

const KB = {
	currency: 'Exchange rate (UAH)',
	picture: 'Pictures',
	cat: 'Cat',
	food: 'Delicious',
	back: 'Go back'
}	
	
const keyboard = {
	reply_markup: {
		keyboard: [
			[KB.currency, KB.picture]
		]
	}
};	

const pictures = {
	[KB.cat]: [
		'cat1.jpg',
		'cat2.jpg',
		'cat3.jpg'
	], 
	[KB.food]: [
		'food1.jpg',
		'food2.jpg',
		'food3.jpg'
	]
}

const url = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange';

bot.onText(/\/start/, msg => sendGreeting(msg));

bot.on('message', msg => {
	switch (msg.text) {
		case KB.currency:
			sendCurrencyScreen(msg.chat.id);
			break
		case KB.picture:
			sendPictureScreen(msg.chat.id);
			break
		case KB.back:
			sendGreeting(msg, false);
			break
		case KB.food:
		case KB.cat:
			sendPictureByName(msg.chat.id, msg.text)
			break
	}
});

bot.on('callback_query', query => {
	//JSON.stringify(query, null, 2);
	
	bot.answerCallbackQuery({
		callback_query_id: query.id,
		text: `You choose ${query.data}`
	});
	
	request({url, qs: {valcode: query.data, json: 'true'}, json: true}, 
		(error, response, body) => {
			if (error || response.statusCode !== 200) {
				throw new Error(error);
			}
			
			const rate = body[0].rate;
			bot.sendMessage(query.message.chat.id, `1 ${query.data} - <b>${rate}</b> UAH`, {
				parse_mode: 'HTML'
			});
		}
	);
});

function sendGreeting(msg, sayHello = true) {
	var text = 'What do you want to do?';
	if (sayHello) {
		text = `Hello, ${msg.from.first_name}! ` + text;
	}
	
	bot.sendMessage(msg.chat.id, text, keyboard);
}

function sendCurrencyScreen(chatId) {
	bot.sendMessage(chatId, 'Choose a currency: ', {
		reply_markup: {
			inline_keyboard: [
				[
					{
						text: '$ Dollar',
						callback_data: 'USD'
					}
				],
				[
					{
						text: '€ Euro',
						callback_data: 'EUR'
					}
				]
			]
		}
	});	
}
	
function sendPictureScreen(chatId) {
	bot.sendMessage(chatId, 'Choose a type of image:', {
		reply_markup: {
			keyboard: [
				[KB.cat, KB.food],
				[KB.back]
			]
		}
	})
}

function sendPictureByName(chatId, pictureName) {
	const srcs = pictures[pictureName];
	const src = srcs[_.random(0, srcs.length - 1)];
	
	bot.sendMessage(chatId, 'Loading...');
	
	fs.readFile(`${__dirname}/pictures/${src}`, (error, picture) => {
		if (error) {
			throw new Error(error);
		}
		
		bot.sendPhoto(chatId, picture).then(() => {
			bot.sendMessage(chatId, 'Sent!');
		});
	});
}