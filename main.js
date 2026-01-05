// ==UserScript==
// @name         YouTube Speed Controller with UI version
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Manage YouTube playback speeds dynamically through a UI.
// @author       Your Name
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    // デフォルトの速度リストを取得
    const getSpeedList = () => GM_getValue('videoSpeeds', {});

    // 速度リストを保存
    const saveSpeedList = (list) => GM_setValue('videoSpeeds', list);

    // 再生速度を適用
    const applyPlaybackSpeed = () => {
        const videoId = new URL(location.href).searchParams.get('v');
        const videoSpeeds = getSpeedList();
        const targetSpeed = videoSpeeds[videoId];

        if (targetSpeed) {
            const video = document.querySelector('video');
            if (video && video.playbackRate !== targetSpeed) {
                video.playbackRate = targetSpeed;
                console.log(`Playback speed set to ${targetSpeed} for video ID: ${videoId}`);
            }
        }
    };

    // ページ遷移を監視
    const observePageChanges = () => {
        let lastUrl = location.href;

        const observer = new MutationObserver(() => {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log(`Navigation detected: ${lastUrl}`);
                setTimeout(applyPlaybackSpeed, 1000);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    // 動画速度を登録するUI
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
            applyPlaybackSpeed();
        }
    };

    // 動画速度リストを表示するUI
    const showSpeedList = () => {
        const currentSpeeds = getSpeedList();
        const list = Object.entries(currentSpeeds)
            .map(([id, speed]) => `Video ID: ${id}, Speed: ${speed}`)
            .join('\n');
        alert(`Registered Speeds:\n${list || 'No speeds registered.'}`);
    };

    // 初期化
    const init = () => {
        console.log('YouTube Speed Controller initialized.');
        observePageChanges();
        setTimeout(applyPlaybackSpeed, 1000);

        // メニューコマンドを登録
        GM_registerMenuCommand('Set Speed for Current Video', registerSpeedForVideo);
        GM_registerMenuCommand('Show Registered Speeds', showSpeedList);
    };

    init();
})();
