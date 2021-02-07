import { parseFullSymbol } from './helpers.js';
import { w3cwebsocket as W3CWebSocket } from "websocket";

const ENDPOINT = "wss://streamer.cryptocompare.com/v2?api_key=4e48b5ba63d7b0bda376e103d891d2841e1054978da5fc0b60fa40226cab7735"

const socket = new W3CWebSocket(ENDPOINT);
const channelToSubscription = new Map();

socket.onerror = function() {
    console.log('Connection Error');
};

socket.onmessage = function(m) {
	const data = JSON.parse(m.data)
	const {
		TYPE,
		M,
		FSYM,
		TSYM,
		TS,
		P,
 	} = data;

	if (parseInt(TYPE) !== 0) {
		return;
	}
	const tradePrice = parseFloat(P);
	const tradeTime = parseInt(TS);
	const channelString = `0~${M}~${FSYM}~${TSYM}`;
	const subscriptionItem = channelToSubscription.get(channelString);
	if (subscriptionItem === undefined) {
		return;
	}
	const lastDailyBar = subscriptionItem.lastDailyBar;
	const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

	let bar;
	if (tradeTime >= nextDailyBarTime) {
		bar = {
			time: nextDailyBarTime,
			open: tradePrice,
			high: tradePrice,
			low: tradePrice,
			close: tradePrice,
		};
	} else {
		bar = {
			...lastDailyBar,
			high: Math.max(lastDailyBar.high, tradePrice),
			low: Math.min(lastDailyBar.low, tradePrice),
			close: tradePrice,
		};
	}
	subscriptionItem.lastDailyBar = bar;

	// send data to every subscriber of that symbol
	subscriptionItem.handlers.forEach(handler => handler.callback(bar));
};


function getNextDailyBarTime(barTime) {
	const date = new Date(barTime * 1000);
	date.setDate(date.getDate() + 1);
	return date.getTime() / 1000;
}
export function subscribeOnStream(
	symbolInfo,
	resolution,
	onRealtimeCallback,
	subscribeUID,
	onResetCacheNeededCallback,
	lastDailyBar,
) {
	const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
	const channelString = `0~${parsedSymbol.exchange}~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
	const handler = {
		id: subscribeUID,
		callback: onRealtimeCallback,
	};
	let subscriptionItem = channelToSubscription.get(channelString);
	if (subscriptionItem) {
		// already subscribed to the channel, use the existing subscription
		subscriptionItem.handlers.push(handler);
		return;
	}
	subscriptionItem = {
		subscribeUID,
		resolution,
		lastDailyBar,
		handlers: [handler],
	};
	channelToSubscription.set(channelString, subscriptionItem);
	const req = {"action":"SubAdd", "subs": [channelString] }
	socket.send(JSON.stringify(req));
}

export function unsubscribeFromStream(subscriberUID) {
	// find a subscription with id === subscriberUID
	for (const channelString of channelToSubscription.keys()) {
		const subscriptionItem = channelToSubscription.get(channelString);
		const handlerIndex = subscriptionItem.handlers
			.findIndex(handler => handler.id === subscriberUID);

		if (handlerIndex !== -1) {
			// remove from handlers
			subscriptionItem.handlers.splice(handlerIndex, 1);

			if (subscriptionItem.handlers.length === 0) {
				const req = {"action":"SubRemove", "subs": [channelString] }
				socket.send(JSON.stringify(req));
				channelToSubscription.delete(channelString);
				break;
			}
		}
	}
}
