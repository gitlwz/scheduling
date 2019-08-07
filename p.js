function Pubsub() {
	this.messages = {};
	this.waitingMessages = {};
	this.waitingFunc = {};
	this.lastUid = 0;
}
Pubsub.prototype.requestIdleCallback = function(cb) {
	if (window.requestIdleCallback) return window.requestIdleCallback(cb)
	var start = Date.now();
	return setTimeout(function() {
		cb({
			didTimeout: false,
			timeRemaining: function() {
				return Math.max(0, 50 - (Date.now() - start));
			}
		});
	}, 1);
}
Pubsub.prototype.cancelIdleCallback = function(id) {
	if (window.cancelIdleCallback) return window.cancelIdleCallback(id)
	return clearTimeout(id);
}

Pubsub.prototype.subscribe = function(key, fun) {
	if (!this.messages.hasOwnProperty(key)) {
		this.messages[key] = {};
	}
	var token = 'uid_' + String(++this.lastUid);
	this.messages[key][token] = fun;
	return token;
}

Pubsub.prototype.publish = function(message, data) {
	data = data === undefined ? "" : data;
	this.waitingMessages[message] = data;
	return this.requestIdleCallback(this.createDeliveryFunction(message));
}

Pubsub.prototype.publishFunction = function(message, data) {
	data = data === undefined ? "" : data;
	this.createFunction(message, data);
}
Pubsub.prototype.createFunction = function(message,data){
	if(this.messages.hasOwnProperty(message)){
		let m = this.messages[message];
		for (s in m) {
			this.waitingFunc[s] = data;
			this.requestIdleCallback(this.deliveryFucntion(message,s));
		}
	}
}
Pubsub.prototype.deliveryFucntion = function(message,s){
	var that = this;
	return function(deadline){
		let waitingFuncData = that.waitingFunc[s];
		if (deadline.timeRemaining() > 0 && waitingFuncData !== undefined && that.messages.hasOwnProperty(message) && that.messages[message].hasOwnProperty(s)) {
			that.waitingFunc[s] = undefined;
			that.messages[message][s](message,waitingFuncData)
		}
	}
}


Pubsub.prototype.createDeliveryFunction = function(message) {
	var that = this;
	return function(deadline) {
		that.delivery(message, deadline)
	}
}
Pubsub.prototype.delivery = function(message, deadline) {
	if(this.messages.hasOwnProperty(message)){
		let waitingData = this.waitingMessages[message];
		let m = this.messages[message];
		if (deadline.timeRemaining() > 0 && waitingData !== undefined && m) {
			this.waitingMessages[message] = undefined;
			for (s in m) {
				m[s](message, waitingData);
			}
		}
	}
}
Pubsub.prototype.clearSubscriptions = function(topic) {
	if (this.messages.hasOwnProperty(topic)) {
		delete this.messages[m];
	}
};

Pubsub.prototype.unsubscribe = function(token) {
	for (let m in this.messages) {
		if (this.messages[m].hasOwnProperty(token)) {
			delete this.messages[m][token]
			return;
		}
	}
}
