export function sendMessage(json) {
    window.parent.postMessage(json, '*');
}