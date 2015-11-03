//initalise global variables
var socket = io(),
    soscpu = 0,
    sosmemory = 0,
    rgood = 0,
    rbad = 0,
    rneutral = 0,
    ResultCount = [],
    tweetinsec = 0,
    tweetsnumbers = 0;

//On recieving a good tweet
socket.on('good tweet', function(msg){
    if ($('#good .tweet').length > 10) {
        $('#good .tweet').last().remove();
    }
    $('#good').prepend(tweets(msg.tweet));
    addCount(msg.count);
});

//On recieving a bad tweet
socket.on('bad tweet', function(msg){
    if ($('#bad .tweet').length > 10) {
        $('#bad .tweet').last().remove();
    }
    $('#bad').prepend(tweets(msg.tweet));
    addCount(msg.count);
});

//On recieving a neutral tweet
socket.on('a tweet', function(msg){
    if ($('#neutral .tweet').length > 10) {
        $('#neutral .tweet').last().remove();
    }
    $('#neutral').prepend(tweets(msg.tweet));
    addCount(msg.count);
});

//on connection with server
socket.on('connected', function() {
    console.log('connected');
    emitMsj('start stream');
});

//on recieving server data
socket.on('os', function(osload) {
    soscpu = osload.cpu[0];
    sosmemory = osload.memory;
    if (soscpu > 1) {
        soscpu = 1;
    }
});

//displays avg tweets to page
socket.on('avg', function (avg){
	if(avg > 0.1){
		$('#avg').html('Mean Sentiment: ' + avg.toFixed(2) + '<b id="sentG">(Positive)</b>');
	} else if(avg < -0.1){
		$('#avg').html('Mean Sentiment: ' + avg.toFixed(2) + '<b id="sentB">(Negative)</b>');
	} else {
		$('#avg').html('Mean Sentiment: ' + avg.toFixed(2) + '<b id="sentN">(Neutral)</b>');
	}
});

/*
 * formats html for displaying tweet object in tweet stream output
 * param tweet: tweet object
 * returns out: formated html string for displaying tweet object
 */
function tweets(tweet){
	out = '<div class="tweet"> <div class="tweeter"><img src=' + tweet.user.profile_image_url + '><b> ' + tweet.user.name + " </b> @" + tweet.user.screen_name + '</div><div>' + tweet.text + '</div></div>';
	return out;
}

/*
 * Sends data to the server
 * param signal: the signal id to be emited
 * param o: data to be sent to server
 */
function emitMsj(signal, o) {
    socket.emit(signal, o);
}

/* Determines tag tracking input on pressing enter
 * param e: key pressed
 * return: false
 */
function onEnter(e){
    if(e.keyCode === 13){
        track();
    }
    return false;
}

/* 
 * Track tag entered in input and show tag in tracked section
 * after: server notified of new tag to track and appended to tracked tags on display
 */
function track(){
	var tag = document.getElementById('tag').value;
	var id = tag.replace(/\s/g, "");
	id = id.replace(/#/g, "hash");
	$('#tracking').append("<div id=" + "tag" + id + " class='tag' onclick='unTrack(`" + tag + "`)'>" + tag + "</div>");
	emitMsj('track', tag);
    document.getElementById('tag').value = '';
}

/*
 * Removes all currently tracked tags
 * after: server notified to stop tracking and tracking section cleared of tags on display
 */
function removeAll(){
	$('#tracking').html('<div class="tracking">Tracking:</div>');
	emitMsj('removeAll');
}

/*
 * Untracks a specified tag
 * param tag: tag to be untracked
 * after: server notified to untrack tag and tag no longer displayed in tracked section
 */
function unTrack(tag){
	var id = tag.replace(/\s/g, "");
	id = id.replace(/#/g, "hash");
	var s = '#tag' + id;
	$(s).remove();
	emitMsj('unTrack', tag);
}

/*
 * Clears the page of data from the server. Tweet counts, tweets and avg sentiement.
 * after: tweet count, avg, tracked tags as well as tweet stream all cleared and no new tweets being recieved
 */
function clearPage(){
	removeAll();
	socket.disconnect();
	socket.connect();
	$('#tweetcount').html("Tweet Counts:");
	$('#avg').html("Mean Sentiment:");
	$('#good').html("");
	$('#bad').html("");
	$('#neutral').html("");
    rgood = 0;
    rneutral = 0;
    rbad = 0;
}

/*
 * Update the number of tweets the mean will be calculated over
 * after: server notified of new number of tweets to store and average
 */
function numChange(){
	var num = document.getElementById('trackNum').value;
	emitMsj('meanNum', num);
}

/*
 * Recieve new tweet count data
 * param result: object containing the number of tweets processed
 * after: tweet count updated to latest totals
 */
function addCount(result) {
    rgood = result.good;
    rbad = result.bad;
    rneutral = result.neutral;
    tweetsnumbers = result.tweetsnumbers;
    tweetinsec++;
    document.getElementById('tweetcount').innerHTML = "Tweet Counts:" + tweetsnumbers;
}


