var log = console.log;
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


var times = {
    start: 0,
    end: 0,
};

// default video: YOASOBI - Racing Into The Night (Yoru ni Kakeru) / THE HOME TAKE
YORI_NI_KAKERU = 'j1hft9Wjq9U'

var videoId = YORI_NI_KAKERU; 
var player;
var vidLength;
var startInput;
var endInput;
var urlInput;
var timeoutId;


window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        // height: '360',
        // width: '640',
        height: '480',
        width: '854',
        videoId: videoId,
        playerVars: {
            modestbranding: 1,
            rel: 0,
            autoplay: 1,
            enablejsapi: 1,
            html5: 1,
            origin: document.domain,
        },
        events: { 
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onError,
        }
    });
}

function onPlayerReady(event) {
    log('Player ready');
    vidLength = Math.floor(player.playerInfo.duration);
    // upon loading new video, set start time to 0 and end time to match end of video 
    times.start = 0;
    times.end = vidLength;

    endInput.value = times.end;

    endInput.setAttribute('max', times.end.toString());
    startInput.setAttribute('max', times.end.toString());
   
    player.seekTo(times.start);
    player.playVideo();
}

function onPlayerStateChange(event) {
    log('Player state change')
    if (event.data == YT.PlayerState.PLAYING) {
        var end = Math.min(times.end, vidLength);
        var start = Math.max(player.getCurrentTime(), times.start, 0);
        var duration = end - start;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(restartVideoSection, duration * 1000);

    } 
}

function onError(event) {
    log('- Error:', event);
}

function restartVideoSection() {
    player.seekTo(times.start);
}

function reloadPlayer() {
    if (player) {
        log('Destroyed player');
        player.destroy();
    }
    onYouTubeIframeAPIReady();
}
// -- end youtube script




function updateStart() {
    times.start = parseInt(startInput.value);
    if (player.playerInfo.currentTime < times.start) {
        restartVideoSection();
    }
    console.log('Start time updated to', times.start);
    if (times.start > times.end) {
        times.end = times.start;
        endInput.value = times.start;
    }
}

function updateEnd() {
    times.end = parseInt(endInput.value);
    if (times.end < player.playerInfo.currentTime) {
        restartVideoSection();
    }
    console.log('End time updated to', times.end);
    if (times.end < times.start) {
        times.start = times.end;
        startInput.value = times.end;
    }
}

function updateUrl() {
    var url = urlInput.value;
    log('Current video ID:', videoId);
    videoId = getVideoId(url);
    log('New video requested - ID:', videoId);
    
    reloadPlayer();
}

function getVideoId(url) {
    if (!(url)) {
        log('no URL found, defaulting to', YORI_NI_KAKERU);
        return YORI_NI_KAKERU;
    }
    var ID = '';
    url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
        ID = url[2].split(/[^0-9a-z_\-]/i);
        ID = ID[0];
    } else {
        try {
            ID = url[0];
        } catch (e) {
            ID = url;
        }
    }
    log(typeof ID)
    return ID;
}

function prettyPrintSeconds(s) {
    // given a number representing seconds, formats into a string of mm:ss if the duration represneted is less than 1 hour, and hh:mm:ss otherwise.
    // 1 hour = 3600 seconds
    if (s < 3600) {
        return `${Math.trunc(s / 60)}:${s % 60}`;
    } else {
        allMins = Math.trunc(s / 60);
        seconds = s % 60;
        hours = Math.trunc(allMins / 60);
        minutes = allMins % 60;
        return `${hours}:${minutes}:${seconds}`
    }
}

function validateEnd(event) {
    if (endInput.validity.rangeOverflow) {
        endInput.value = vidLength;
    }
    if (endInput.validity.rangeUnderflow || endInput.validity.valueMissing) {
        endInput.value = 0;
    }
    if (endInput.validity.stepMismatch) {
        endInput.value = parseInt(endInput.value);
    }
}

function validateStart(event) {
    if (startInput.validity.rangeOverflow) {
        startInput.value = vidLength;
    }
    if (startInput.validity.rangeUnderflow || startInput.validity.valueMissing) {
        startInput.value = 0;
    }
    if (startInput.validity.stepMismatch) {
        startInput.value = parseInt(startInput.value);
    }
}


window.onload = (function() {
    startInput = document.querySelector('#startTimeInput');
    startInput.addEventListener('change', updateStart);
    startInput.addEventListener('input', validateStart);

    endInput = document.querySelector('#endTimeInput');
    endInput.addEventListener('change', updateEnd);
    endInput.addEventListener('input', validateEnd);

    urlInput = document.querySelector('#urlInput');
    urlInput.addEventListener('change', updateUrl);
})();