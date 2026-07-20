export function initHablemosHover(buttonSelector, videoSelector) {
    const button = document.querySelector(buttonSelector);
    const video = document.querySelector(videoSelector);
    if (!button || !video) return;

    function showVideo() {
        video.currentTime = 0;
        video.classList.remove('opacity-0');
        video.classList.add('opacity-100');
        video.play();
    }

    function hideVideo() {
        video.classList.remove('opacity-100');
        video.classList.add('opacity-0');
    }

    video.addEventListener('transitionend', (e) => {
        if (e.propertyName === 'opacity' && video.classList.contains('opacity-0')) {
            video.pause();
        }
    });

    button.addEventListener('mouseenter', showVideo);
    button.addEventListener('mouseleave', hideVideo);
}
