const EventEmitter = require('events');
const TimeQueue = require('timequeue');
const fs = require('fs');
const uid = require('uid');

/**
 * The options for the store constructor
 * @typedef {Object} StoreOptions
 * @property {String} [name] The name of the store's data collection. Use a different name per collection to keep data seperate.
 * @property {String} [path] The full path to indicate where to store the .json data file
 * @property {Boolean} [backupEnabled] Whether to enable the scheduled backups or not
 * @property {Number} [backupInterval] The interval to run the scheduled backups at, in milliseconds 
 */
const defaultStoreOpts = {
    name: 'data',
    path: process.cwd() + '/data',
    backupEnabled: true,
    backupInterval: 3600000
}

/**
 * The options for the 'only' filter
 * @typedef {Object} FilterOptions
 * @property {Boolean} [strict=false] Whether to be strict on string matching. If true, strings will be exactly matched, if false, capitalization will be ignored.
 */
const defaultFilterOpts = {
    strict: false
}

/**
 * The store class
 */
class Store extends EventEmitter.EventEmitter {
    /**
     * Create a new store
     * @param {StoreOptions} [opts] The options for the store
     */
    constructor(opts = defaultStoreOpts) {
        super();

        this.backupInterval = null;
        this.opts = opts;
        if (!this.opts.name) this.opts.name = defaultStoreOpts.name;
        if (!this.opts.path) this.opts.path = defaultStoreOpts.path;
        if (!this.opts.backupEnabled) this.opts.backupEnabled = defaultStoreOpts.backupEnabled;
        if (!this.opts.backupInterval) this.opts.backupInterval = defaultStoreOpts.backupInterval;

        this._ensureCreated('folder', this.opts.path);
        this._ensureCreated('file', `${this.opts.path}/${this.opts.name}.json`);

        this.worker = (action, callback = null) => {
            const data = action();
            if (callback) callback(data || null);
        };

        this.queue = new TimeQueue(this.worker, {
            concurrency: 1,
            every: 0
        });

        if (this.opts.backupEnabled) this.startBackups();
    }

    /**
     * Adds a new object to the store
     * @param {Object | Array<Object>} vals An object or an array of objects to add to the store
     * @returns {String | Array<String>} The ID of the item added, or an array of IDs belonging to the items added
     * @fires Store#added
     */
    add(vals) {
        return new Promise(async (resolve, reject) => {
            const newData = await this.object();

            if (Array.isArray(vals)) {
                let ids = [];
                let data = [];

                vals.forEach(async (val, index) => {    
                    if (!val || val.constructor !== Object)
                    return reject(new TypeError(`Value [${index}]: must be an object`));
        
                    if (Object.keys(val).length == 0)
                    return reject(new TypeError(`Value [${index}]: must not be an empty object`));
    
                    const id = uid(16);
                    val._id = id;
                    newData[id] = val;
                    
                    ids.push(id);
                    data.push(val);
                });

                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(newData));
                }, () => {
                    /**
                     * Fires when a new item is added to the store
                     * 
                     * @event Store#added
                     * @property {Object | Array<Object>} value The item added, or an array of the items added
                     */
                    this.emit('added', data);

                    resolve(ids);
                });
            } else {
                const val = vals;
    
                if (!val || val.constructor !== Object)
                return reject(new TypeError('Value must be an object'));
    
                if (Object.keys(val).length == 0)
                return reject(new TypeError('Value must not be an empty object'));
    
                const id = uid(16);
                val._id = id;
                newData[id] = val;
    
                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(newData));
                }, () => {
                    /**
                     * Fires when a new item is added to the store
                     * 
                     * @event Store#added
                     * @property {Object | Array<Object>} value The item added, or an array of the items added
                     */
                    this.emit('added', val);

                    resolve(id);
                });
            }
        });
    }

    /**
     * Get an item from the store
     * @param {String} id The ID of the item to get from the store
     * @returns {Object | undefined} The item that belongs to that ID, or undefined if none is found 
     */
    get(id) {
        return new Promise(async (resolve, reject) => {
            const data = await this.object();
            const item = data[id];
            
            if (!item) return resolve(undefined);
            else return resolve(item);
        });
    }

    /**
     * Indicates if a specific item how many items exist that match a provided filter
     * @param {Object | Function | String} filter Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @returns {Boolean | Number} Either a boolean indicating if an item is found, or a number indicating how many items matching the filter were found
     */
    has(filter) {
        return new Promise(async (resolve, reject) => {
            // TODO: has
        });
    }

    /**
     * Ensures an item in the store exists, adding it if it doesn't
     * @param {Object | Function | String} filter Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @param {Object} item The item to add to the store, if it doesn't exist
     * @return {Boolean | Number} A boolean indicating whether the item exists or was added
     * @fires Store#added
     */
    ensure(filter, item) {
        return new Promise(async (resolve, reject) => {
            // TODO: ensure
        });
    }

    /**
     * Get all items from the store
     * @returns {Array<Object>} An array of items in the store
     */
    all() {
        return new Promise(async (resolve, reject) => {
            this.queue.push(() => {
                const data = fs.readFileSync(`${this.opts.path}/${this.opts.name}.json`, 'utf8');
                return JSON.parse(data.toString());
            }, (data) => {
                resolve(Object.values(data));
            });
        });
    }

    /**
     * Get all items from the store, in raw object (key- > value) form
     * @returns {Object} An object of items in the store
     */
    object() {
        return new Promise(async (resolve, reject) => {
            this.queue.push(() => {
                const data = fs.readFileSync(`${this.opts.path}/${this.opts.name}.json`, 'utf8');
                return JSON.parse(data.toString());
            }, (data) => {
                resolve(data);
            });
        });
    }

    /**
     * Get all items from the store that match an object (key -> value) filter
     * @param {Object} obj An object containing the keys/values to filter by
     * @param {FilterOptions} [opts] The options for the filter
     * @returns {Array<Object>} An array of items in the store that matched the filter
     */
    only(obj, opts = defaultFilterOpts) {
        return new Promise(async (resolve, reject) => {
            if (!opts.strict) opts.strict = false;

            const data = await this.all();
            const items = data.filter((x) => {
                let val;

                for (const o in obj) {
                    if (!x[o]) return val = false;
                    
                    if (typeof (x[o]) === 'string' && opts.strict === false) {
                        if (x[o].toLowerCase() === obj[o].toLowerCase()) return val = true;
                        else return val = false;
                    } else {
                        if (x[o] === obj[o]) return val = true;
                        else return val = false;
                    }
                }

                return val;
            });
            
            if (!items.length) return resolve([]);
            else return resolve(items);
        });
    }

    /**
     * Get all items from the store that match a function filter
     * @param {Function} func A function that returns a truthy value for items that match the filter
     * @returns {Array<Object>} An array of items in the store that matched the filter
     */
    filter(func) {
        return new Promise(async (resolve, reject) => {
            const data = await this.all();
            const items = data.filter(func);
            
            if (!items.length) return resolve([]);
            else return resolve(items);
        });
    }

    /**
     * Filters all items from the store that match a function filter, but only returns the first match
     * @param {Function} func A function that returns a truthy value for the item that matches the filter
     * @returns {Object | undefined} The item itself, or undefined if the item doesn't exist
     */
    first(func) {
        return new Promise(async (resolve, reject) => {
            const data = await this.all();
            const item = data.find(func);
            
            if (!item) return resolve(undefined);
            else return resolve(item);
        });
    }

    /**
     * Edit an item in the store
     * @param {Function | Object | String} key Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @param {Object} newValues An object of keys/values to add, edit or remove to/from the item
     * @returns {Boolean | undefined} A boolean indicating the result of the action, or undefined if the item doesn't exist
     * @fires Store#edited
     */
    edit(key, newValues) {
        return new Promise(async (resolve, reject) => {
            const id = await this._get(key);
            if (!id) return resolve(undefined);
            
            const data = await this.object();
            const item = data[id];
            
            if (!item) return resolve(undefined);
            else {
                let newItem = item;
                const oldItem = item;
                
                for (const v of Object.keys(newValues)) {
                    if (!newItem[v]) newItem[v] = newValues[v];
                    else if (newValues[v] === undefined) delete newItem[v];
                    else newItem[v] = newValues[v];
                }

                data[id] = newItem;
                
                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(data));
                }, () => {
                    /**
                     * Fired when an item in the store is edited
                     * 
                     * @event Store#edited
                     * @type {Object}
                     * @property {Object} old The value of the item before the edit
                     * @property {Object} new The value of the item after the edit
                     */
                    this.emit('edited', {
                        old: oldItem,
                        new: newItem
                    });

                    resolve(true);
                });
            }
        });
    }
    /**
     * A combination function that edits an existing item, or adds a new item if it doesn't exist in the store
     * @param {Function | Object | String} key Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @param {Object} newValues An object of keys/values to add, edit or remove to/from the item. If the item doesn't exist and is added, only keys with a truthy value are added.
     * @returns {Boolean | undefined} A boolean indicating the result of the action
     * @fires Store#added
     * @fires Store#edited
     */
    upsert(key, newValues) {
        return new Promise(async (resolve, reject) => {
            // TODO: upsert
        });
    }
    
    /**
     * Replace an item in the store entirely
     * @param {Function | Object | String} key Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @param {Object} value The new object to replace the existing item in the store with
     * @returns {Boolean | undefined} A boolean indicating the result of the action, or undefined if the item doesn't exist
     * @fires Store#replaced
     */
    replace(key, value) {
        return new Promise(async (resolve, reject) => {
            const id = await this._get(key);
            if (!id) return resolve(undefined);

            const data = await this.object();
            const item = data[id];
            
            if (!item) return resolve(undefined);
            else {
                const oldItem = item;

                value._id = item._id;

                data[id] = value;
                
                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(data));
                }, () => {
                    /**
                     * Fired when an item in the store is replaced with a new item
                     * 
                     * @event Store#replaced
                     * @type {Object}
                     * @property {Object} old The value of the item before the replace
                     * @property {Object} new The value of the item after the replace
                     */
                    this.emit('replaced', {
                        old: oldItem,
                        new: value
                    });

                    resolve(true);
                });
            }
        });
    }

    /**
     * Iterates ofer all items in the store and deletes items that match a filter provided
     * @param {Function | Object} filter Either an object containing the keys/values to filter by, or a filter function that returns a truthy value
     * @returns {Number} A number indicating how many items were deleted from the store
     */
    sweep(filter) {
        return new Promise(async (resolve, reject) => {
            let items;

            // Object
            if (this._isObject(filter)) {
                items = await this.only(filter);
                if (!items || !items.length) return resolve(undefined);
            }

            // Function
            if (typeof (filter) === 'function') {
                items = await this.filter(filter);
                if (!items || !items.length) return resolve(undefined);
            }

            const actions = items.map((x) => this.delete(x._id));

            try {
                const results = await Promise.all(actions);

                return resolve(results.filter((x) => x === true).length);
            } catch(err) {
                return reject(err);
            }
        });
    }

    /**
     * Delete an item from the store
     * @param {Function | Object | String} key Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @returns {Boolean | undefined} A boolean indicating the result of the action, or undefined if the item doesn't exist
     * @fires Store#deleted
     */
    delete(key) {
        return new Promise(async (resolve, reject) => {
            const id = await this._get(key);
            if (!id) return resolve(undefined);

            const data = await this.object();
            const item = data[id];
            
            if (!item) return resolve(undefined);
            else {
                const oldItem = item;

                delete data[id];
                
                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(data));
                }, () => {
                    /**
                     * Fires when an item from the store is deleted
                     * 
                     * @event Store#deleted
                     * @property {Object} oldItem The item deleted from the store
                     */
                    this.emit('deleted', oldItem);

                    resolve(true);
                });
            }
        });
    }

    /**
     * Deletes all items from the store
     * @returns {Boolean} A boolean indicating the result of the action
     * @fires Store#emptied
     */
    empty() {
        return new Promise(async (resolve, reject) => {
            this.queue.push(() => {
                fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, '{}');
            }, () => {
                /**
                 * Fires when the store is emptied
                 * 
                 * @event Store#emptied
                 */
                this.emit('emptied');

                resolve(true);
            });
        });
    }

    /**
     * Ensure a directory or file has been created and exists
     * @private
     * @param {'file' | 'folder'} type The type to ensure exists
     * @param {String} dir The full path or full path and filename to ensure exists
     * @returns {Boolean} A boolean indicating the result of the action
     */
    _ensureCreated(type, dir) {
        const exists = fs.existsSync(dir);

        if (exists) return true; else {
            if (type === 'file') {
                fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, '{}');
                return true;
            }

            if (type === 'folder') {
                fs.mkdirSync(this.opts.path);
                return true;
            }
        }
    }

    /**
     * Helper to check if a variable is an object
     * @param {*} obj Any variable to check
     * @returns {Boolean} A boolean indicating whether the variable is an object or not
     */
    _isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    /**
     * Helper to simplify fetching an item's ID using multiple filter methods
     * @private
     * @param {Object | Function | String} filter Either an object containing the keys/values to find by, a filter function that returns a truthy value, or the item's ID
     * @returns {String | undefined} The ID of the item, or undefined if none can be found
     */
    _get(filter) {
        return new Promise(async (resolve, reject) => {
            // Object
            if (this._isObject(filter)) {
                const item = await this.only(filter);
                if (!item || !item.length) return resolve(undefined);

                return resolve(item[0]._id);
            }

            // Function
            if (typeof (filter) === 'function') {
                const item = await this.find(filter);
                if (!item) return resolve(undefined);

                return resolve(item._id);
            }

            // ID
            const item = await this.get(filter);
            if (!item) return resolve(undefined);

            return resolve(item._id);
        });
    }

    /**
     * Start the scheduled backups, using the store's backupInterval option
     * @returns {Boolean} A boolean indicating the result of the action
     * @fires Store#backupsStarted
     */
    startBackups() {
        return new Promise(async (resolve, reject) => {
            if (this.backupInterval !== null) return reject(`Backups already running`);

            this.backupInterval = setInterval(() => { this.backup(); }, this.opts.backupInterval);

            /**
             * Fires when scheduled backups are started
             * 
             * @event Store#backupsStarted
             */
            this.emit('backupsStarted');

            return resolve(true);
        });
    }

    /**
     * Stop the scheduled backups
     * @returns {Boolean} A boolean indicating the result of the action
     * @fires Store#backupsStopped
     */
    stopBackups() {
        return new Promise(async (resolve, reject) => {
            if (this.backupInterval === null) return reject(`Backups are not running`);

            clearInterval(this.backupInterval);
            this.backupInterval = null;

            /**
             * Fires when scheduled backups are stopped
             * 
             * @event Store#backupsStopped
             */
            this.emit('backupsStopped');

            return resolve(true);
        });
    }

    /**
     * Create a backup of the store
     * @param {Boolean} [scheduled=false] A boolean indicating whether the backup is made by the scheduled backup interval or manually
     * @returns {Boolean} A boolean indicating the result of the action
     * @fires Store#backup 
     */
    backup(scheduled = false) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => {
                fs.copyFileSync(`${this.opts.path}/${this.opts.name}.json`, `${this.opts.path}/${this.opts.name}--backup.json`);
            }, () => {
                /**
                 * Fires when a new backup has been made
                 * 
                 * @event Store#backup
                 * @type {Object}
                 * @property {String} path The full path and filename, indicating where the backup is located
                 * @property {Boolean} scheduled A boolean indicating whether the backup is scheduled or not
                 */
                this.emit('backup', {
                    path: `${this.opts.path}/${this.opts.name}--backup.json`,
                    scheduled
                });

                resolve(true);
            });
        });
    }

    /**
     * Replace the store's contents with the contents of an earlier or previous backup
     * @returns {Boolean} A boolean indicating the result of the action
     * @fires Store#restore
     */
    restore() {
        return new Promise((resolve, reject) => {
            const backupExists = fs.existsSync(`${this.opts.path}/${this.opts.name}--backup.json`);

            if (!backupExists)
            return reject(new Error(`Backup doesn't exist`));

            this._ensureCreated('folder', this.opts.path);
            this._ensureCreated('file', `${this.opts.path}/${this.opts.name}.json`);

            this.queue.push(() => {
                const data = fs.readFileSync(`${this.opts.path}/${this.opts.name}--backup.json`, 'utf8');
                return JSON.parse(data.toString());
            }, (data) => {
                this.queue.push(() => {
                    fs.writeFileSync(`${this.opts.path}/${this.opts.name}.json`, JSON.stringify(data));
                }, () => {
                    /**
                     * Fires when the store has been restored from a backup
                     * 
                     * @event Store#restore
                     */
                    this.emit('restore');

                    resolve(true);
                });
            });
        });
    }
}

module.exports = Store;