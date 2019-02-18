/**
 * Created by amirchervinsky on 1/31/16.
 */
(function($) {
    $(window).load(function() {

        var colorThief = new ColorThief();
        var active = false;

        var sampleIntervalId = null;
        var refreshInterval = 500;
        var audioContext = null;
        var analyzerNode = null;
        var mediaSourceNode = null;
        var animationId = null;
        var status = 0; //flag for sound is playing 1 or stopped 0
        var allCapsReachBottom = false;
        var canvas = null;

        var targetDiv = $(".spectrumAnalyzer");
        var numberOfBars = 60; // show 60 bars
        var	gap = 2; //gap between bars
        var meterWidth = (targetDiv.width() / numberOfBars) - gap;

        targetDiv.append('<canvas id="canvas" width="' + targetDiv.width() + '" height="' + targetDiv.height() + '"></canvas>');
        canvas = targetDiv.find("#canvas").get(0);
        var vid = $("#vid").get(0);

        vid.onplay = function() {
            if (prepareAPI()){
                mediaSourceNode = audioContext.createMediaElementSource(vid);
                analyzerNode = audioContext.createAnalyser();
                mediaSourceNode.connect(analyzerNode);
                analyzerNode.connect(audioContext.destination);

                status = 1;
                sampleIntervalId = setInterval(function(){
                    doSample();
                }, refreshInterval);
            }
        };

        function prepareAPI(){
            window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
            window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
            window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
            try {
                audioContext = new AudioContext();
                return true;
            } catch (e) {
                console.log('spectrumAnalyzer::Your browser does not support AudioContext');
                return false;
            }
        }

        function doSample(){
            var sample = new Float32Array(analyzerNode.frequencyBinCount);
            analyzerNode.getFloatFrequencyData(sample);
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
            }

            var frameColors = colorThief.getPalette(vid,3);
            if (frameColors){
                var color1 = frameColors[0];
                var color2 = frameColors[1];
                var color3 = frameColors[2];
                var hex1 = rgbToHex(color1[0],color1[1],color1[2]);
                var hex2 = rgbToHex(color2[0],color2[1],color2[2]);
                var hex3 = rgbToHex(color3[0],color3[1],color3[2]);
                drawSpectrum(hex1, hex2, hex3);
            }else{
                drawSpectrum('#0f0', '#ff0', '#f00'); // default colors
            }
        }

        function drawSpectrum(hex1, hex2, hex3){
            var	cwidth = canvas.width;
            var	cheight = canvas.height - 2;
            var	capHeight = 2;
            var	capStyle = '#fff';
            var	capYPositionArray = [];    //store the vertical position of hte caps for the previous frame
            var ctx = canvas.getContext('2d');
            var	gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(1, hex1);
            gradient.addColorStop(0.5, hex2);
            gradient.addColorStop(0, hex3);

            var drawMeter = function() {
                var array = new Uint8Array(analyzerNode.frequencyBinCount);
                analyzerNode.getByteFrequencyData(array);
                if (status === 0) {
                    //fix when some sounds end the value still not back to zero
                    for (var i = array.length - 1; i >= 0; i--) {
                        array[i] = 0;
                    };
                    allCapsReachBottom = true;
                    for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                        allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                    };
                    if (allCapsReachBottom) {
                        cancelAnimationFrame(animationId); //since the sound is top and animation finished, stop the requestAnimation to prevent potential memory leak,THIS IS VERY IMPORTANT!
                        return;
                    };
                };
                var step = 10;// Math.round(array.length / numberOfBars); //sample limited data from the total array
                ctx.clearRect(0, 0, cwidth, cheight);
                for (var i = 0; i < numberOfBars; i++) {
                    var value = array[i * step];
                    if (capYPositionArray.length < Math.round(numberOfBars)) {
                        capYPositionArray.push(value);
                    };
                    ctx.fillStyle = capStyle;
                    //draw the cap, with transition effect
                    if (value < capYPositionArray[i]) {
                        ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                    } else {
                        ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
                        capYPositionArray[i] = value;
                    };
                    ctx.fillStyle = gradient; //set the filllStyle to gradient for a better look
                    ctx.fillRect(i * (meterWidth + gap) , cheight - value + capHeight, meterWidth, cheight); //the meter
                }
                animationId = requestAnimationFrame(drawMeter);
            }
            animationId = requestAnimationFrame(drawMeter);
        }

        function rgbToHex (r, g, b) {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

    });
})(jQuery);
