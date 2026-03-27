// ==UserScript==
// @name         YouTube Speed Controller with UI version
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Manage YouTube playback speeds dynamically through a UI.
// @author       Your Name
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==
(function () {
    'use strict';

    const getSpeedList = () => GM_getValue('videoSpeeds', {});
    const saveSpeedList = (list) => GM_setValue('videoSpeeds', list);

    let speedApplyInterval = null;

    const applyPlaybackSpeed = () => {
        const videoId = new URL(location.href).searchParams.get('v');
        if (!videoId) return;

        const videoSpeeds = getSpeedList();
        const targetSpeed = videoSpeeds[videoId];
        if (!targetSpeed) return;

        const video = document.querySelector('video');
        if (!video) return;

        // ★修正1: ratechangeイベントを監視して再適用（YouTubeによる上書きを防ぐ）
        video.removeEventListener('ratechange', onRateChange);
        video.addEventListener('ratechange', onRateChange);

        if (video.playbackRate !== targetSpeed) {
            video.playbackRate = targetSpeed;
            console.log(`Speed set to ${targetSpeed} for ${videoId}`);
        }
    };

    // ★修正2: YouTubeが速度をリセットしてきたら再設定
    const onRateChange = (e) => {
        const videoId = new URL(location.href).searchParams.get('v');
        if (!videoId) return;

        const videoSpeeds = getSpeedList();
        const targetSpeed = videoSpeeds[videoId];
        if (!targetSpeed) return;

        const video = e.target;
        if (video.playbackRate !== targetSpeed) {
            console.log(`Rate changed to ${video.playbackRate}, restoring ${targetSpeed}`);
            video.playbackRate = targetSpeed;
        }
    };

    // ★修正3: 動画要素が現れるまでリトライする
    const applyWithRetry = (retries = 10, interval = 500) => {
        if (speedApplyInterval) clearInterval(speedApplyInterval);

        let attempts = 0;
        speedApplyInterval = setInterval(() => {
            const video = document.querySelector('video');
            if (video) {
                applyPlaybackSpeed();

                // loadedmetadata後にも再適用（読み込み完了でリセットされる対策）
                video.addEventListener('loadedmetadata', applyPlaybackSpeed, { once: true });
            }
            attempts++;
            if (attempts >= retries) clearInterval(speedApplyInterval);
        }, interval);
    };

    const observePageChanges = () => {
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log(`Navigation detected: ${lastUrl}`);
                applyWithRetry();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    const registerSpeedForVideo = () => {
        const videoId = new URL(location.href).searchParams.get('v');
        if (!videoId) {
            alert('This is not a valid video page.');
            return;
        }
        const currentSpeeds = getSpeedList();
        const currentSpeed = currentSpeeds[videoId] || '';
        const newSpeed = prompt(`Enter playback speed for this video (current: ${currentSpeed}):`, currentSpeed);
        if (newSpeed) {
            currentSpeeds[videoId] = parseFloat(newSpeed);
            saveSpeedList(currentSpeeds);
            alert(`Playback speed set to ${newSpeed} for video ID: ${videoId}`);
            applyWithRetry();
        }
    };

    const showSpeedList = () => {
        const currentSpeeds = getSpeedList();
        const list = Object.entries(currentSpeeds)
            .map(([id, speed]) => `Video ID: ${id}, Speed: ${speed}`)
            .join('\n');
        alert(`Registered Speeds:\n${list || 'No speeds registered.'}`);
    };

    const init = () => {
        console.log('YouTube Speed Controller initialized.');
        observePageChanges();
        applyWithRetry();
        GM_registerMenuCommand('Set Speed for Current Video', registerSpeedForVideo);
        GM_registerMenuCommand('Show Registered Speeds', showSpeedList);
    };

    init();
})();
