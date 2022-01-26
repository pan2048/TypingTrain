
function download(filename, text) {
    var pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);

    if (document.createEvent) {
        var event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
}

function upload(event, callback) {
    var file = event.target.files[0];
    if (!file) {
        return;
    }
    var reader = new FileReader();
    reader.onload = function(event) {
        var text = event.target.result; 
        callback(text);
    };
    reader.readAsText(file);
}

module.exports = {
    download,
    upload
}