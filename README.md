NoMQ
====

No(de) MQ, allows you to create MQ-like patterns, without the overhead of an MQ server.
It's mission is to stay **very** lightweight but fully functional, Redis is used for transport and persistance.

Request-reply
-------------
This pattern allows you to create workers for one or more requesters.
The following Requester asks it's workers to multiply the value by two:

	r = new Requester('timestwo');

	r.on('reply', function(msg) {
		return console.log("" + msg.value + " * 2 = " + msg.answer);
	});

	counter = 0;

	setInterval(function() {
		return r.request({
		  "value": ++counter
		});
	}, 100);

This is the accompanying worker:

	r = new Replier('timestwo');

	r.on('request', function(msg) {
		console.log("received msg: " + (JSON.stringify(msg)));
		msg.answer = msg.value * 2;
		return this.reply(msg);
	});

The idea is that you create requester and worker with the same 'identity' (in this case *timestwo*), the Requester issues requests, while the Replier answers them. These can be totally different processes, eventually on different machines.

Publish-Subscribe
-----------------
TODO