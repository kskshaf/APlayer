import tplLrc from '../template/lrc.art';

class Lrc {
    constructor(options) {
        this.container = options.container;
        this.async = options.async;
        this.player = options.player;
        this.parsed = [];
        this.index = 0;
        this.current = [];
        this.isActive = options.active || false;
    }

    show() {
        this.isActive = true;
        if (this.player.options.fixed) {
            this.player.storage.set('lrcActive', true);
        }
        this.player.events.trigger('lrcshow');
        this.player.template.lrcWrap.classList.remove('aplayer-lrc-hide');
        this.player.template.lrcButton.classList.remove('aplayer-icon-lrc-inactivity');
        this.switch(this.player.list.index);
    }

    hide() {
        this.isActive = false;
        if (this.player.options.fixed) {
            this.player.storage.set('lrcActive', false);
        }
        this.player.events.trigger('lrchide');
        this.player.template.lrcWrap.classList.add('aplayer-lrc-hide');
        this.player.template.lrcButton.classList.add('aplayer-icon-lrc-inactivity');
        this.container.innerHTML = '';
    }

    toggle() {
        if (this.player.template.lrcWrap.classList.contains('aplayer-lrc-hide')) {
            this.show();
        } else {
            this.hide();
        }
    }

    update(currentTime = this.player.audio.currentTime) {
        if (!this.isActive) {
            return;
        }

        if (!this.current.length) {
            return;
        }

        let index = 0;
        for (let i = 0; i < this.current.length; i++) {
            if (currentTime >= this.current[i][0] && (!this.current[i + 1] || currentTime < this.current[i + 1][0])) {
                index = i;
                break;
            }
        }

        const current = this.container.getElementsByClassName('aplayer-lrc-current')[0];
        const target = this.container.getElementsByTagName('p')[index];
        if (target && (this.index !== index || !target.classList.contains('aplayer-lrc-current'))) {
            this.index = index;
            this.container.style.transform = `translateY(${-this.index * 16}px)`;
            this.container.style.webkitTransform = `translateY(${-this.index * 16}px)`;
            current && current.classList.remove('aplayer-lrc-current');
            target.classList.add('aplayer-lrc-current');
        }
    }

    switch(index, currentTime = this.player.audio.currentTime) {
        if (!this.isActive) {
            return;
        }

        if (!this.player.list.audios[index]) {
            this.current = [];
            this.container.innerHTML = '';
            return;
        }

        if (!this.parsed[index]) {
            if (!this.async) {
                if (this.player.list.audios[index].lrc) {
                    this.parsed[index] = this.parse(this.player.list.audios[index].lrc);
                } else {
                    this.parsed[index] = [[0, 'Not available']];
                }
            } else {
                if (this.player.list.audios[index].lrc) {
                    this.parsed[index] = [[0, 'Loading']];
                    const xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = () => {
                        if (index === this.player.list.index && xhr.readyState === 4) {
                            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                                this.parsed[index] = this.parse(xhr.responseText);
                            } else {
                                this.player.notice(`LRC file request fails: status ${xhr.status}`);
                                this.parsed[index] = [[0, 'Not available']];
                            }
                            if (this.isActive) {
                                this.container.innerHTML = tplLrc({
                                    lyrics: this.parsed[index],
                                });
                                this.current = this.parsed[index];
                                this.update();
                            }
                        }
                    };
                    const apiurl = this.player.list.audios[index].lrc;
                    xhr.open('get', apiurl, true);
                    xhr.send(null);
                } else {
                    this.parsed[index] = [];
                }
            }
        }

        this.container.innerHTML = tplLrc({
            lyrics: this.parsed[index],
        });
        this.current = this.parsed[index];
        this.update(currentTime);
    }

    /**
     * Parse lrc, suppose multiple time tag
     *
     * @param {String} lrc_s - Format:
     * [mm:ss]lyric
     * [mm:ss.xx]lyric
     * [mm:ss.xxx]lyric
     * [mm:ss.xx][mm:ss.xx][mm:ss.xx]lyric
     * [mm:ss.xx]<mm:ss.xx>lyric
     *
     * @return {String} [[time, text], [time, text], [time, text], ...]
     */
    parse(lrc_s) {
        if (lrc_s) {
            lrc_s = lrc_s.replace(/([^\]^\n])\[/g, (match, p1) => p1 + '\n[');
            const lyric = lrc_s.split('\n');
            let lrc = [];
            const lyricLen = lyric.length;
            for (let i = 0; i < lyricLen; i++) {
                // match lrc time
                const lrcTimes = lyric[i].match(/\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g);
                // match lrc text
                const lrcText = lyric[i]
                    .replace(/.*\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/g, '')
                    .replace(/<(\d{2}):(\d{2})(\.(\d{2,3}))?>/g, '')
                    .replace(/^\s+|\s+$/g, '');

                if (lrcTimes) {
                    // handle multiple time tag
                    const timeLen = lrcTimes.length;
                    for (let j = 0; j < timeLen; j++) {
                        const oneTime = /\[(\d{2}):(\d{2})(\.(\d{2,3}))?]/.exec(lrcTimes[j]);
                        const min2sec = oneTime[1] * 60;
                        const sec2sec = parseInt(oneTime[2]);
                        const msec2sec = oneTime[4] ? parseInt(oneTime[4]) / ((oneTime[4] + '').length === 2 ? 100 : 1000) : 0;
                        const lrcTime = min2sec + sec2sec + msec2sec;
                        lrc.push([lrcTime, lrcText]);
                    }
                }
            }
            // sort by time
            lrc = lrc.filter((item) => item[1]);
            lrc.sort((a, b) => a[0] - b[0]);
            return lrc;
        } else {
            return [];
        }
    }

    remove(index) {
        this.parsed.splice(index, 1);
    }

    clear() {
        this.parsed = [];
        this.current = [];
        this.index = 0;
        this.container.innerHTML = '';
    }
}

export default Lrc;
