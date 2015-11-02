/*
 * EveryCode About Chart
 * Chart with Display Good Neutral Bad Graph.
 */
$(function () {
    $(document).ready(function () {
        Highcharts.setOptions({
            global: {
                useUTC: false
            }
        });

        $('#TweetChart').highcharts({
            chart: {
                type: 'spline',
                animation: Highcharts.svg, 
                marginRight: 10,
                events: {
                    load: function () {

                        // set up the updating of the chart each second
                        var series_positive = this.series[0];
                        var series_neutral = this.series[1];
                        var series_negative = this.series[2];

                        setInterval(function () {
                            var x = (new Date()).getTime(), // current time
                                y = rgood;
                                y2 = rneutral;
                                y3 = rbad;
                            series_positive.addPoint([x, y], false, true);
                            series_neutral.addPoint([x, y2], false, true);
                            series_negative.addPoint([x, y3], true, true);
                        }, 600);
                    }
                }
            },
            title: {
                text: 'Twitter Sentiment Analysis'
            },
            xAxis: {
                type: 'datetime',
                tickPixelInterval: 150
            },
            yAxis: {
                title: {
                    text: 'Numbers Of Tweets'
                },
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.name + '</b><br/>' +
                        Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                        Highcharts.numberFormat(this.y, 2);
                }
            },
            legend: {
                enabled: true
            },
            exporting: {
                enabled: false
            },
            series: [{
                name: 'Good',
                color: '#00ff00',
                data: (function () {
                    
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: rgood,
                            y2:rneutral,
                            y3:rbad
                        });
                    }
                    return data;
                }())
            },
            {
                name: 'Neutral',
                color: '#666666',

                data: (function () {
                    
                    var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: rgood,
                            y2:rneutral,
                            y3:rbad
                        });
                    }
                    return data;
                }())
            },
            {
                name: 'Bad',
                color: '#ff6a6a',
                data: (function () {

                        var data = [],
                        time = (new Date()).getTime(),
                        i;

                    for (i = -19; i <= 0; i += 1) {
                        data.push({
                            x: time + i * 1000,
                            y: rgood,
                            y2:rneutral,
                            y3:rbad
                        });
                    }
                    return data;
                }())
            }]
        });
    });
});


/*
 * Chart With Display CPU Usage And Memory with Gauge
 */
$(function() {
   
    var charts = [
        $('#real-time-cpu').epoch({ type: 'time.gauge', value: soscpu }),
        $('#real-time-memory').epoch({ type: 'time.gauge', value: sosmemory })
    ];

    function updateCharts() {
        charts[0].update(soscpu);
        charts[1].update(sosmemory); 
    }

    setInterval(updateCharts, 500);
    updateCharts();
});


/*
 * Chart With Display CPU With Area Graph
 */
(function() {

    /*
     * Class for generating real-time data for area
     */
    var RealTimeDataArea = function(layers) {
        this.layers = layers;
        this.timestamp = ((new Date()).getTime() / 1000)|0;
    };

    RealTimeDataArea.prototype.history = function(entries) {
        if (typeof(entries) != 'number' || !entries) {
            entries = 60;
        }

        var history = [];
        for (var k = 0; k < this.layers; k++) {
            history.push({ values: [] });
        }

        for (var i = 0; i < entries; i++) {
            for (var j = 0; j < this.layers; j++) {
                history[j].values.push({time: this.timestamp, y:soscpu*100});
            }
            this.timestamp++;
        }

        return history;
    };

    RealTimeDataArea.prototype.next = function() {
        var entry = [];
        for (var i = 0; i < this.layers; i++) {
            entry.push({ time: this.timestamp, y: soscpu*100});    
        }
        this.timestamp++;
        return entry;
    }

    window.RealTimeDataArea = RealTimeDataArea;

})();


$(function() {
    var data = new RealTimeDataArea(1);

    var chart = $('#real-time-area').epoch({
        type: 'time.area',
        data: data.history(),
        axes: ['left', 'bottom', 'right']
    });
    
    setInterval(function() { chart.push(data.next()); }, 500);
    chart.push(data.next());
});

/*
 * Chart With Display Tweets In Second
 */
(function() {

    /*
     * Class for generating real-time data for line
     */
    var RealTimeDataSec = function(layers) {
        this.layers = layers;
        this.timestamp = ((new Date()).getTime() / 1000)|0;
    };

    RealTimeDataSec.prototype.history = function(entries) {
        if (typeof(entries) != 'number' || !entries) {
            entries = 60;
        }

        var history = [];
        for (var k = 0; k < this.layers; k++) {
            history.push({ values: [] });
        }

        for (var i = 0; i < entries; i++) {
            for (var j = 0; j < this.layers; j++) {
                history[j].values.push({time: this.timestamp, y:tweetinsec});
            }
            this.timestamp++;
        }

        return history;
    };

    RealTimeDataSec.prototype.next = function() {
        var entry = [];
        for (var i = 0; i < this.layers; i++) {
            entry.push({ time: this.timestamp, y: tweetinsec});    
        }
        this.timestamp++;
        return entry;
    }

    window.RealTimeDataSec = RealTimeDataSec;

})();

$(function() {
    var data = new RealTimeDataSec(1);

    var chart = $('#real-time-Sec').epoch({
        type: 'time.line',
        data: data.history(),
        axes: ['left', 'bottom', 'right']
    });
    
    setInterval(function() {
        document.getElementById('tweetcountinsec').innerHTML = "Tweet in second:" + tweetinsec + "/s";
        chart.push(data.next());
        tweetinsec = 0; 
    }, 1000);
    chart.push(data.next());
});