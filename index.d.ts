declare module 'thattonybo/store' {
  import { EventEmitter } from 'events';
  import TimedQueue from 'timequeue';

  namespace Store {
    /**
     * The options for the store constructor
     */
    interface Options {
      /**
       * The interval to run the scheduled backups at, in milliseconds
       */
      backupInterval?: number;

      /**
       * Whether to enable the scheduled backups or not
       */
      backupEnabled?: boolean;

      /**
       * The name of the store's data collection. Use a different name per collection to keep data seperate.
       */
      name?: string;

      /**
       * The full path to indicate where to store the .json data file
       */
      path?: string;
    }

    /**
     * The options for the 'only' filter
     */
    interface FilterOptions {
      /**
       * Whether to be strict on string matching. 
       * 
       * If true, strings will be exactly matched, if false, capitalization will be ignored.
       */
      strict?: boolean;
    }

    /**
     * Type definition for [Store.worker]
     */
    type Worker<T = unknown> = (action: () => T, callback: (data: T | null) => void) => void;

    /**
     * The typed object
     */
    type TypedObject<V = unknown> = {
      [x in string | number]: V;
    };

    /**
     * Object to add multiple filters with a string filter, but key-only
     */
    interface SingularFilterFunction<T, TReturn> {
      (key: (item: T) => boolean): Promise<TReturn>;
      (key: string): Promise<TReturn>;
    }

    /**
     * Object to add multiple filters with a string filter, but with key and values
     */
    interface MultiFilterFunction<T, TReturn> {
      (key: (item: T) => boolean, value: T): Promise<TReturn>;
      (key: string, value: T): Promise<TReturn>;
    }

    /**
     * Object to add multiple filters, without any string filter
     */
    interface NonStringFilterFunction<T, TReturn> {
      (key: (item: T) => boolean, value: T): Promise<TReturn>;
    }
  }

  class Store<T = object> extends EventEmitter {
    /**
     * Create a new store
     * @param opts The options for the store
     */
    constructor(opts?: Store.Options);

    /**
     * The options for the store
     */
    public opts: Store.Options;

    /**
     * The worker
     */
    public worker: Store.Worker;

    /**
     * The queue
     */
    public queue: TimedQueue;

    /**
     * Indicates if a specific items how many items exists that match a provided filter
     */
    // TODO: this function isn't finished
    public has: Store.SingularFilterFunction<T, T>;

    /**
     * Ensures an item in the store exists, adding it if it doesn't
     */
    // TODO: this function isn't finished
    public ensure: Store.SingularFilterFunction<T, T>;

    /**
     * Edit an item in the store
     */
    public edit: Store.MultiFilterFunction<T, boolean>;

    /**
     * A combination function that edits an existing item, or adds a new item if it doesn't exist in the store
     */
    public upsert: Store.MultiFilterFunction<T, boolean>;

    /**
     * Replace an item in the store entirely
     */
    public replace: Store.MultiFilterFunction<T, boolean>;

    /**
     * Iterates all items in the store and deletes items that match a filter provided
     */
    public sweep: Store.NonStringFilterFunction<T, boolean>;

    /**
     * Delete an item from the store
     */
    public delete: Store.SingularFilterFunction<T, boolean>;

    /**
     * Adds a new object to the store
     * @param vals An object to insert to the store
     * @returns The ID of the item added
     */
    public add(vals: T): Promise<string>;

    /**
     * Adds multiple objects to the store
     * @param vals An Array of objects to add to the store
     * @returns An Array of IDs belonging to the items added
     */
    public add(vals: T[]): Promise<string[]>;

    /**
     * Gets an item from the store
     * @param id The ID of the item to get from the store
     * @returns The item that belongs to that ID, or undefined if none is found 
     */
    public get(id: string): Promise<T | undefined>;

    /**
     * Get all items from the store
     */
    public all(): Promise<T[]>;

    /**
     * Get all items from the store, in raw object (key -> value) form
     */
    public object(): Promise<Store.TypedObject<T>>;

    /**
     * Get all items from the store that match an object (key -> value) filter
     * @param obj An object containing the key/values to filter by
     * @param opts The options for the filter
     */
    public only<F extends object = Store.TypedObject<T>>(obj: F, opts?: Store.FilterOptions): Promise<T[]>;
  
    /**
     * Get all items from the store that match a function filter
     * @param func A function that returns a truthy value for items that match the filter
     */
    public filter(func: (item: T) => boolean): Promise<T[]>;

    /**
     * Filters all items from the store that match a function filter, but only returns the first match
     * @param func A function that returns a truthy value for the item that matches the filter
     */
    public first(func: (item: T) => boolean): Promise<T | undefined>;

    /**
     * Deletes all items from the store
     */
    public empty(): Promise<boolean>;
  }

  export = Store;
}
