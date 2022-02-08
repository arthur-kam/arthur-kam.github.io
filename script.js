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
var DEFAULT_VIDEO_ID = 'j1hft9Wjq9U';

var videoId = DEFAULT_VIDEO_ID; 
var vidLength;
var startInput, endInput, urlInput;
var timeoutId;

var FORMATTED_START_TIME_ID = 'formattedStartTime';
var FORMATTED_END_TIME_ID = 'formattedEndTime';

var player;
window.onYouTubeIframeAPIReady = function() {
    player = new YT.Player('player', {
        height: '480',
        width: '854',
        videoId: videoId,
        playerVars: {
            modestbranding: 1,
            autoplay: 1,
            enablejsapi: 1,
            html5: 1,
            host: 'https://arthur-kam.github.io',
            origin: document.domain,
        },
        events: { 
            'onReady': onReady,
            'onStateChange': onStateChange,
            'onError': onError,
        }
    });
}

function onReady(event) {
    log('Player ready...');
    vidLength = Math.floor(player.playerInfo.duration);
    
    syncTime();

    player.seekTo(times.start);
    player.playVideo();
}

function syncTime() {
    _resetStartAndEndTimes();
    _syncTimeFields();
    _setInputValueCeilings();
}

function _resetStartAndEndTimes() { 
    times.start = 0;
    times.end = vidLength;
}

function _syncTimeFields() {
    startInput.value = times.start;
    endInput.value = times.end;
    resetFormattedTimeDisplays();
}

function resetFormattedTimeDisplays() {
    _showFormattedTime(startInput, FORMATTED_START_TIME_ID)();
    _showFormattedTime(endInput, FORMATTED_END_TIME_ID)();
}

function _setInputValueCeilings() {
    startInput.setAttribute('max', times.end.toString());
    endInput.setAttribute('max', times.end.toString());
}

function onStateChange(event) {
    log('Player state change...')
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
    if (player) {
        player.seekTo(times.start);
    } else {
        log("Player does not exist...");
    }
}

function _reloadPlayer() {
    if (player) {
        log('Destroyed player...');
        player.destroy();
    }
    onYouTubeIframeAPIReady();
    syncTime();

    
}
// -- end youtube script




function _updateStart() {
    times.start = parseInt(startInput.value);
    if (player.playerInfo.currentTime < times.start) {
        restartVideoSection();
    }
    // log('Start time updated to', times.start);
    if (times.start > times.end) {
        times.end = times.start;
        endInput.value = times.start;
    }
}

function _updateEnd() {
    times.end = parseInt(endInput.value);
    if (times.end < player.playerInfo.currentTime) {
        restartVideoSection();
    }
    // log('End time updated to', times.end);
    if (times.end < times.start) {
        times.start = times.end;
        startInput.value = times.end;
    }
}

function _updateUrl() {
    var url = urlInput.value;
    log('Current video - ID:', videoId);
    videoId = _getVideoId(url);
    log('New video requested - ID:', videoId);
    _reloadPlayer();
}

function _getVideoId(url) {
    if (!url) {
        log('no URL found, defaulting to', DEFAULT_VIDEO_ID);
        return DEFAULT_VIDEO_ID;
    }
    var newId = '';
    url = url.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    if(url[2] !== undefined) {
        newId = url[2].split(/[^0-9a-z_\-]/i);
        newId = newId[0];
    } else {
        try {
            newId = url[0];
        } catch (e) {
            newId = url;
        }
    }
    return newId;
}

function _formatSeconds(s) {
    // given a number representing seconds, formats into a string of mm:ss if the duration 
    // represented is less than 1 hour, and hh:mm:ss otherwise.
    var secondsInAnHour = 60 * 60;
    var allMins = Math.trunc(s / 60);
    var seconds = s % 60;
    var minutes = allMins % 60;
    var padSeconds = seconds > 9 ? '' : '0';
    var padMinutes = minutes > 9 ? '' : '0';
    if (s < secondsInAnHour) {
        return `${minutes}:${padSeconds}${seconds}`;
    } else {
        var hours = Math.trunc(allMins / 60);
        var padHours = hours > 9 ? '' : '0';
        return `${padHours}${hours}:${padMinutes}${minutes}:${padSeconds}${seconds}`;
    }
}

function _validateTime(inputElement) {
    return function() {
        if (inputElement.validity.rangeOverflow) {
            inputElement.value = vidLength;
        }
        if (inputElement.validity.rangeUnderflow || inputElement.validity.valueMissing) {
            inputElement.value = 0;
        }
        if (inputElement.validity.stepMismatch) {
            inputElement.value = parseInt(inputElement.value);
        }
    }
}

function _showFormattedTime(element, formattedDisplayId) {
    return function() {
        var formattedStr = _formatSeconds(element.value);
        document.getElementById(formattedDisplayId).innerHTML = formattedStr;
    }
}


window.onload = (function() {
    startInput = document.querySelector('#startTimeInput');
    startInput.addEventListener('change', _updateStart);
    startInput.addEventListener('input', _validateTime(startInput));
    startInput.addEventListener('input', _showFormattedTime(startInput, FORMATTED_START_TIME_ID))

    endInput = document.querySelector('#endTimeInput');
    endInput.addEventListener('change', _updateEnd);
    endInput.addEventListener('input', _validateTime(endInput));
    endInput.addEventListener('input', _showFormattedTime(endInput, FORMATTED_END_TIME_ID))

    urlInput = document.querySelector('#urlInput');
    urlInput.addEventListener('change', _updateUrl);
})();