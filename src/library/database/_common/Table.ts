import { Database, TableSchema } from "../Database";

export interface ITable {
    name: string;
    primary: string;
}

export interface ITypedTable<T extends TableSchema = any> extends ITable {
    name: string;
    primary: keyof T & string;
    schema?: T;
}

export class Table<TData extends TableSchema = any> implements ITable {
    public indexDB: Database<any>;
    public name: string;
    public primary: keyof TData & string;
    private _initialized: boolean = false;

    public constructor(props: ITypedTable<TData>, indexDB: Database<any>) {
        this.indexDB = indexDB;
        this.name = props.name;
        this.primary = props.primary;
    }

    public async init(): Promise<void> {
        if (!this.indexDB.db.objectStoreNames.contains(this.name)) {
            throw new Error(`Object store '${this.name}' does not exist in database`);
        }
        this._initialized = true;
    }

    private _ensureInitialized(): void {
        if (!this._initialized) {
            throw new Error(`Table '${this.name}' not initialized. Call init() first.`);
        }
    }

    private _getStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
        this._ensureInitialized();
        const transaction = this.indexDB.db.transaction([this.name], mode);
        return transaction.objectStore(this.name);
    }

    public async get(key: TData[keyof TData & string]): Promise<TData | undefined> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result as TData | undefined);
            request.onerror = () => reject(request.error);
        });
    }

    public async getMany(keys: Array<TData[keyof TData & string]>): Promise<Array<TData | undefined>> {
        const promises = keys.map(key => this.get(key));
        return Promise.all(promises);
    }

    public async getAll(): Promise<TData[]> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result as TData[]);
            request.onerror = () => reject(request.error);
        });
    }

    public async getAllWithLimit(limit?: number): Promise<TData[]> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.getAll(undefined, limit);
            
            request.onsuccess = () => resolve(request.result as TData[]);
            request.onerror = () => reject(request.error);
        });
    }

    public async put(data: TData): Promise<TData[keyof TData & string]> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readwrite');
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result as TData[keyof TData & string]);
            request.onerror = () => reject(request.error);
        });
    }

    public async putMany(dataArray: TData[]): Promise<Array<TData[keyof TData & string]>> {
        const promises = dataArray.map(data => this.put(data));
        return Promise.all(promises);
    }

    public async add(data: TData): Promise<TData[keyof TData & string]> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readwrite');
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result as TData[keyof TData & string]);
            request.onerror = () => reject(request.error);
        });
    }

    public async update(
        key: TData[keyof TData & string], 
        updates: Partial<TData>
    ): Promise<TData | null> {
        const existing = await this.get(key);
        if (!existing) return null;
        
        const updated = { ...existing, ...updates } as TData;
        await this.put(updated);
        return updated;
    }

    public async delete(key: TData[keyof TData & string]): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readwrite');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async deleteMany(keys: Array<TData[keyof TData & string]>): Promise<void> {
        const promises = keys.map(key => this.delete(key));
        await Promise.all(promises);
    }

    public async clear(): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readwrite');
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async count(): Promise<number> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    public async exists(key: TData[keyof TData & string]): Promise<boolean> {
        const result = await this.get(key);
        return result !== undefined;
    }

    public async find(predicate: (item: TData) => boolean): Promise<TData[]> {
        const allItems = await this.getAll();
        return allItems.filter(predicate);
    }

    public async findOne(predicate: (item: TData) => boolean): Promise<TData | undefined> {
        const allItems = await this.getAll();
        return allItems.find(predicate);
    }

    public async getAllKeys(): Promise<Array<TData[keyof TData & string]>> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.getAllKeys();
            
            request.onsuccess = () => resolve(request.result as Array<TData[keyof TData & string]>);
            request.onerror = () => reject(request.error);
        });
    }

    public async forEach(callback: (item: TData, key: TData[keyof TData & string]) => void | Promise<void>): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.openCursor();
            
            request.onsuccess = async () => {
                const cursor = request.result;
                if (cursor) {
                    try {
                        await callback(cursor.value as TData, cursor.key as TData[keyof TData & string]);
                        cursor.continue();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
}