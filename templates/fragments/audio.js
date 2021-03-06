window.addEventListener('load', function() {
    try {
        if (!window.localStorage.volume) {
            window.localStorage.volume = 1;
    }
    } catch (ex) { /* this causes security exceptions in sandboxed iframes */ }
    var controls = document.querySelectorAll('.audio .control');
    for (var i = 0; i < controls.length; i++) {
        controls[i].addEventListener('click', audio_controlClick, false);
    }
    var audioElements = document.querySelectorAll('audio');
    for (var i = 0; i < audioElements.length; i++) {
        audioElements[i].addEventListener('ended', function(e) {
            if (!e.target.loop) {
                pause(e.target);
            }
        }, true);
        audioElements[i].addEventListener('progress', updateAudio, false);
        if (audioElements[i].readyState > 0) {
            updateAudio({ target: audioElements[i] });
        }
        audioElements[i].addEventListener('timeupdate', updateAudio, false);
    }
    var buffers = document.querySelectorAll('.audio .seek .buffering, .audio .seek .progress, .audio .seek .unbuffered');
    for (var i = 0; i < buffers.length; i++) {
        buffers[i].addEventListener('click', handleSeek, false);
    }
    var volumes = document.querySelectorAll('.audio .volume, .audio .volume .amount');
    for (var i = 0; i < volumes.length; i++) {
        var amount = volumes[i].querySelector('.amount');
        try {
            if (amount)
                amount.style.width = (window.localStorage.volume * 100) + '%';
        } catch (ex) {
            amount.style.width = '100%';
        }
        volumes[i].addEventListener('mousedown', audio_beginAdjustVolume, false);
        volumes[i].addEventListener('mousemove', audio_adjustVolume, false);
        volumes[i].addEventListener('mouseup', audio_endAdjustVolume, false);
        volumes[i].addEventListener('mouseleave', audio_endAdjustVolume, false);
    }
}, false);
function audio_beginAdjustVolume(e) {
    e.preventDefault();
    var container = e.target;
    if (e.target.className.indexOf('volume') == -1)
        container = e.target.parentElement;
    container.classList.add('action');
    audio_adjustVolume(e);
}
function audio_endAdjustVolume(e) {
    var container = e.target;
    if (e.target.className.indexOf('volume') == -1)
        container = e.target.parentElement;
    container.classList.remove('action');
}
function audio_adjustVolume(e) {
    e.preventDefault();
    var container = e.target;
    if (e.target.className.indexOf('volume') == -1)
        container = e.target.parentElement;
    if (container.className.indexOf('action') == -1)
        return;
    var audio = document.getElementById(container.getAttribute('data-audio'));
    var amount;
    if (e.offsetX)
        amount = e.offsetX / container.clientWidth;
    else
        amount = e.layerX / container.clientWidth;
    audio.volume = amount;
    try {
        window.localStorage.volume = amount;
    } catch (ex) { /* ... */ }
    container.querySelector('.amount').style.width = (amount * 100) + '%';
}
function handleSeek(e) {
    e.preventDefault();
    var container = e.target.parentElement;
    var audio = document.getElementById(container.getAttribute('data-audio'));
    var seek = audio.duration * (e.layerX / container.clientWidth);
    audio.currentTime = seek;
}
function updateAudio(e) {
    var audio = e.target;
    var buffer = document.querySelectorAll('.seek[data-audio="' + audio.id + '"] .buffering')[0];
    var progress = document.querySelectorAll('.seek[data-audio="' + audio.id + '"] .progress')[0];
    var indicator = document.querySelectorAll('.seek[data-audio="' + audio.id + '"] .indicator')[0];
    var time = document.querySelectorAll('.time[data-audio="' + audio.id + '"]')[0];
    var bufferWidth;
    if (audio.buffered.length == 0)
        bufferWidth = 100;
    else
        bufferWidth = audio.buffered.end(audio.buffered.length - 1) / audio.duration * 100;
    if (bufferWidth > 100)
        bufferWidth = 100;
    buffer.style.width = bufferWidth + '%';
    progress.style.width = indicator.style.left = audio.currentTime / audio.duration * 100 + '%';
    var minutes = Math.floor(audio.currentTime / 60);
    var seconds = Math.floor(audio.currentTime % 60);
    if (seconds < 10)
        time.textContent = minutes + ':0' + seconds;
    else
        time.textContent = minutes + ':' + seconds;
}
function audio_controlClick(e) {
    e.preventDefault();
    var target = e.target;
    if (!target.className)
        target = target.parentElement;
    var audio = document.getElementById(target.getAttribute('data-audio'));
    if (target.className.indexOf('play') != -1) {
        audio_play(audio);
        if (target.className.indexOf('large') != -1)
            target.parentElement.removeChild(target);
    } else if (target.className.indexOf('pause') != -1) {
        audio_pause(audio);
    } else if (target.className.indexOf('loop') != -1) {
        audio.loop = !audio.loop;
        if (audio.paused)
            audio_play(audio);
        if (target.className.indexOf('enabled') != -1)
            target.classList.remove('enabled');
        else
            target.classList.add('enabled');
    } else if (target.className.indexOf('unmute') != -1) {
        audio.muted = false;
        target.classList.remove('unmute');
        target.classList.add('mute');
    } else if (target.className.indexOf('mute') != -1) {
        audio.muted = true;
        target.classList.remove('mute');
        target.classList.add('unmute');
    }
}
function audio_play(audio) {
    var playbackControl = document.querySelectorAll('a.control.play[data-audio="' + audio.id + '"]')[0];
    playbackControl.classList.remove('play');
    playbackControl.classList.add('pause');
    audio.play();
}
function audio_pause(audio) {
    var playbackControl = document.querySelectorAll('a.control.pause[data-audio="' + audio.id + '"]')[0];
    playbackControl.classList.remove('pause');
    playbackControl.classList.add('play');
    audio.pause();
}
function playMedia() {
    var audio = document.querySelectorAll('audio');
    for (var i = 0; i < audio.length; i++) {
        audio_play(audio[i]);
    }
}
function pauseMedia() {
    var audio = document.querySelectorAll('audio');
    for (var i = 0; i < audio.length; i++) {
        audio_pause(audio[i]);
    }
}
function mediaHashHandler(hash) {
    var parts = hash.split(',');
    var audio = document.getElementById('audio-{{ filename }}');
    var loopControl = document.querySelector('.audio .control.loop');
    var largePlayControl = document.querySelector('.audio .control.play.large');
    var muteControl = document.querySelector('.audio .control.mute');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i] == 'loop') {
            audio.loop = true;
            loopControl.classList.add('enabled');
        } else if (parts[i] == 'noloop') {
            audio.loop = false;
            loopControl.classList.remove('enabled');
        } else if (parts[i] == 'autoplay') {
            if (!mobile)
                play(audio);
        } else if (parts[i] == 'noautoplay') {
            if (!mobile) {
                largePlayControl.classList.remove('hidden');
                pause(audio);
            }
        } else if (parts[i] == 'mute') {
            audio.muted = true;
            muteControl.classList.add('unmute');
            muteControl.classList.remove('mute');
        } else if (parts[i] == 'nobrand') {
            audio.parentElement.classList.add('nobrand');
        }
    }
}
