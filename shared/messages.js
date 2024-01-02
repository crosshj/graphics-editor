
const resolve = {};
const online = {};
if(window.top === window){
	const clients = ['main', 'right', 'top-bar', 'editor'];
	for(const client of clients){
		online[client] = new Promise(r => resolve[client] = r);
	}
}

const broadcast = async (message, source) => {
	await Promise.all(Object.values(online));
	const iframes = document.body.querySelectorAll('iframe');
	for(var iframe of Array.from(iframes)){
		const { href: dest } = iframe.contentWindow.location;
		if(source === dest) continue;
		iframe.contentWindow.postMessage({ source, ...message });
	}
};

export const host = () => {
	const listeners = {};
	const listen = (name, handler) => {
		listeners[name] = listeners[name] || [];
		listeners[name].push(handler);
	};
	window.addEventListener("message", (event) => {
		const { eventName } = event.data;
		const { href: source } = event.source.location;
		debugger;
		if(eventName === "ping" && source.includes('/main')){
			return resolve.main();
		}
		if(eventName === "ping" && source.includes('/right')){
			return resolve.right();
		}
		if(eventName === "ping" && source.includes('/top-bar')){
			return resolve['top-bar']();
		}
		if(eventName === "ping" && source.includes('/editor')){
			return resolve['editor']();
		}
		if(listeners[eventName]){
			for(const listener of listeners[eventName]){
				listener({ source, ...event.data.data });
			}
		}
		broadcast(event.data, source);
	}, false);
	return { broadcast, listen };
};

// CLIENT LISTEN
let listeners = {};
export const listen = (eventName, handler) => {
	const isListening = Object.keys(listeners).length;
	listeners[eventName] = listeners[eventName] || [];
	listeners[eventName].push(handler);

	if(isListening) return;

	window.addEventListener("message", async (event) => {
		const { eventName: messageEventName, data, ...rest } = event.data;
		const eventHandlers = listeners[messageEventName];
		if(!eventHandlers) return;
		for(const handle of eventHandlers){
			await handle({ ...data, ...rest });
		}
	});
};

// CLIENT SEND (maybe can be used by host as well)
export const send = (eventName, data) => {
	window.top.postMessage({ eventName, data });
};
