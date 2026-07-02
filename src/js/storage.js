import utils from './utils';

class Storage {
    constructor(player) {
        this.storageName = player.options.storageName;

        this.data = JSON.parse(utils.storage.get(this.storageName));
        if (!this.data) {
            this.data = {};
        }
        this.data.volume = this.data.volume || player.options.volume;
        this.data.lrcActive = this.data.lrcActive !== undefined ? this.data.lrcActive : false;
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        utils.storage.set(this.storageName, JSON.stringify(this.data));
    }
}

export default Storage;
