var Twitter = require('node-tweet-stream'),
	express = require('express'),
	http = require('http'),
	app = express(),
	server = http.Server(app),
	io = require('socket.io')(server, {pingTimeout: 180000}),
	emotional = require('emotional'),
	nStore = require('nstore'),
	fs = require('fs'),
	os = require('os');

app.use(express.static('js'));
app.use(express.static('style'));
app.use(express.static('index'));

server.listen(80);

// Set HomePage
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

//create new twitter stream client
var client = new Twitter({
  consumer_key: '9ddOHUc4S6K6PTOURN7aIajvy',
  consumer_secret: 'rjRJTQabY29Ebp26TcSrvLRRBmQmHGSUqmJkOQlsjump2N9IK3',
  token: '611572436-zLJPvLPagZ1ZjPodrcCHQ9DKABWZFwwdkiac9lHM',
  token_secret: 'M4nGXJlAjkinvIBP9ZU8ihJOQ8z50KGpPJWZkpebxY1wx'
})


/*
 * Gets the number of sockets connected
 * param roomId: optional* id of room containing sockets
 * param namespace: optional* name of namespace containing sockets
 * return res: array of sockets contained by io, namespace or room
 */
function findClientsSocket(roomId, namespace) {
    var res = []
    , ns = io.of(namespace ||"/");    // the default namespace is "/"

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId) ;
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

//if db file exists data is cleared
try {
	fs.writeFile('db/tweetdb.db', '');
} catch (e) {

}

//create db
var tweetdb = nStore.new('db/tweetdb.db', function(){
	console.log('db on');
});


//object contianing currently tracked tags
tracking = {tags: {}};
    

emotional.load(function(){
  io.sockets.on('connection', function (socket){
    console.log('a user connected');

    //Store tags tracked by socket
    socket.tracking = [];

    //Number of tweets to avg
    socket.tnumber = 5;


	//object for tracking cpu metrics
	var count = { good:0 , neutral:0 , bad:0 , tweetsnumbers:0 };
	var load = { cpu:[], memory:0 };

    //Client start streaming tweets
    socket.on("start stream", function(){
    	console.log('stream start');

    	//Store previous tweets
		tweetdb.save(socket.id, {tweets:[]}, function (err){
			if (err) { console.log(err); }
			console.log('db tweet object created for socket id: ' + socket.id);
		});

    	//Keep On Passing The CPU Usages To Client WIth 0.5 Second
    	setInterval(function() {
        	var totalmemory = os.totalmem(); 
        	var freememory = os.freemem();
        	load.memory = (totalmemory-freememory)/totalmemory;
        	load.cpu = os.loadavg();
        	socket.emit('os', load); 
      	}, 500);

      	//on server recieving a tweet
      	client.on("tweet", function (tweet) {
        	if (socket.tracking.length > 0){
          		for (var i = 0; i < socket.tracking.length; i++){		
            		if (tweet.text.indexOf(socket.tracking[i]) > -1){	//iff tweet contains tracked tag/phrase
              			count.tweetsnumbers++;

              			//add tweet to record of previous tweets
              			tweetdb.get(socket.id, function(err, doc, key){	//get tweets from db
              				console.log('got store');
              				if (err) {
              					console.log(err);
              					tweetdb.save(socket.id, {tweets:[]}, function (err){
									if (err) { console.log(err); }
									console.log('db tweet object created for socket id: ' + socket.id);
								});
              				} else {
	              				doc.tweets.push(tweet);							//add latest tweet
	              				if (doc.tweets.length > socket.tnumber){		//if tweets is longer than the amount being tracked
	              					doc.tweets.splice(0, 1);					//remove oldest tweet
	              					tweetdb.save(socket.id, doc, function (err){
	              						console.log('added to store');
	              						if (err){console.log(err);}
	              					});
	              				}
	              			}
              			});

              			var msg = {};

              			//calculate sentiment and send tweet to client
              			if(emotional.get(tweet.text).polarity > 0.1){				//if tweet has positve sentiment
                			if(tweet.filter_level = 'medium'){
                				count.good++;
		            			msg.tweet = tweet;
		            			msg.count = count;
	                			socket.emit("good tweet", msg);
                			}
              			} else if(emotional.get(tweet.text).polarity < -0.1){		//if tweet has negative sentiment
                			if(tweet.filter_level = 'medium'){
                				count.bad++;
					            msg.tweet = tweet;
					            msg.count = count;
			                  	socket.emit("bad tweet", msg);
                			}
              			} else {													//if tweet is neutral
			                if(tweet.filter_level = 'medium'){
			                	count.neutral++;
					            msg.tweet = tweet;
					            msg.count = count;
			                	socket.emit("a tweet", msg);
			                }
              			}

              			//calculate mean sentiment of previous n tweets
              			tweetdb.get(socket.id, function(err, doc, key){
			              	var avg = 0;
			              	console.log('calculate avg');
					       	if (err) {
					       		console.log(err);
					       	} else  {
					       		if (doc.tweets.length == 0){
					       		} else if (doc.tweets.length < socket.tnumber){
					        		for (var i = 0; i < doc.tweets.length; i++){
					           			avg += emotional.get(doc.tweets[i].text).polarity;
					        		} 
					        		avg = avg/doc.tweets.length;
					        	} else {
					        		for (var i = 0; i < socket.tnumber; i++){
					           			avg += emotional.get(doc.tweets[i].text).polarity;
					        		}
					         		avg = avg/socket.tnumber;
					        	}
					        	var stats = fs.statSync("db/tweetdb.db");
 								var fileSizeInBytes = stats["size"];
 								if (fileSizeInBytes > 10000000) {
 									fs.writeFile('db/tweetdb.db', '', function(){
										console.log('db reset');
									});
 								}
					        	socket.emit('avg', avg);
					        }
		      			});
            		}
          		}
        	}
      	});

	  	//on Twitter streaming error
      	client.on('error', function(error) {
        	console.log(error);
      	});
    });

    //client track tag
    socket.on("track", function (tag){
     	num = tracking.tags[tag];
     	if (num > 1){
        	tracking.tags[tag]++;
      	} else {
        	client.track(tag);
        	tracking.tags[tag] = 1;
      	}
      	socket.tracking.push(tag);
    });

    //client untrack tag
    socket.on("unTrack", function (tag){
      	unTrack(tag);
      	var index = socket.tracking.indexOf(tag);
      	socket.tracking.splice(index, 1);
    });

    /*
     * untracks tag from the stream
     * param tag: tag to be untracked
     * after: tweet stream no longer retrieves tweets related to tag
     */
    function unTrack(tag){
      	if (tracking.tags[tag] == 1){
        	delete tracking.tags[tag];
        	client.untrack(tag);
      	} else {
        	tracking.tags[tag]--;
      	}
    }

    //client untrack all tags
    socket.on("removeAll", function (){
      	for(var i=0; i < socket.tracking.length; i++){
        	unTrack(socket.tracking[i]);
      	}
      	socket.tracking = [];
      	socket.tweet = [];
    });

    //client disconects
    socket.on("disconnect", function(){
      	console.log('A user disconnected');
      	for(var i=0; i < socket.tracking.length; i++){
        unTrack(socket.tracking[i]);
      	}
		tweetdb.remove(socket.id, function (err) {
  			console.log('cleared tweets');
		});
      	delete client[socket.id];
      	delete socket;
		var clients = findClientsSocket() ;
      	if (clients.length < 1){
      		fs.writeFile('db/tweetdb.db', '', function(){
				console.log('db reset');
			});
      	}
    });

    //client change mean tweet number
    socket.on("meanNum", function(num){
    	socket.tnumber = num;
    });

    //tell client they have connected
    socket.emit("connected");
  });
});

console.log('listening on 80');
