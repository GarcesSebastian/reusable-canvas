import { Table } from "./_common/Table";
import { ITable } from "./_common/Table";

export type TableSchema = Record<string, any>;
export type TableName<T extends Record<string, TableSchema>> = keyof T & string;

export interface ITypedTable<T extends TableSchema = any> extends ITable {
    name: string;
    primary: keyof T & string;
    schema?: T;
}

interface WorkerResponse {
    id: string;
    success: boolean;
    data?: any;
    error?: string;
}

export class Database<TSchema extends Record<string, TableSchema> = {}> {
    private _db: IDBDatabase | null = null;
    private _worker: Worker | null = null;
    private _workerPromises: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

    public name: string;
    public version: number;
    public tables: Map<string, Table<any>> = new Map();
    private _pendingTables: Map<string, ITypedTable<any>> = new Map();

    public constructor(name: string, version: number = 1) {
        this.name = name;
        this.version = version;
        this._initWorker();
    }

    private _initWorker(): void {
        const workerScript = `
            let db = null;
            let dbName = '';
            let dbVersion = 1;

            async function openDatabase(name, version) {
                return new Promise((resolve, reject) => {
                    const request = indexedDB.open(name, version);
                    
                    request.onsuccess = () => {
                        db = request.result;
                        resolve(db);
                    };
                    
                    request.onerror = () => reject(request.error);
                });
            }

            async function bulkInsert(tableName, dataArray) {
                if (!db) throw new Error('Database not opened in worker');
                
                const transaction = db.transaction([tableName], 'readwrite');
                const store = transaction.objectStore(tableName);
                
                const promises = dataArray.map(data => {
                    return new Promise((resolve, reject) => {
                        const request = store.put(data);
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });
                });
                
                return Promise.all(promises);
            }

            async function bulkUpdate(tableName, updates) {
                if (!db) throw new Error('Database not opened in worker');
                
                const transaction = db.transaction([tableName], 'readwrite');
                const store = transaction.objectStore(tableName);
                const results = [];
                
                for (const update of updates) {
                    const getRequest = await new Promise((resolve, reject) => {
                        const req = store.get(update.key);
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => reject(req.error);
                    });
                    
                    if (getRequest) {
                        const updatedData = { ...getRequest, ...update.data };
                        const putResult = await new Promise((resolve, reject) => {
                            const req = store.put(updatedData);
                            req.onsuccess = () => resolve(req.result);
                            req.onerror = () => reject(req.error);
                        });
                        results.push(putResult);
                    }
                }
                
                return results;
            }

            async function bulkDelete(tableName, keys) {
                if (!db) throw new Error('Database not opened in worker');
                
                const transaction = db.transaction([tableName], 'readwrite');
                const store = transaction.objectStore(tableName);
                
                const promises = keys.map(key => {
                    return new Promise((resolve, reject) => {
                        const request = store.delete(key);
                        request.onsuccess = () => resolve(true);
                        request.onerror = () => reject(request.error);
                    });
                });
                
                return Promise.all(promises);
            }

            async function getDatabaseSize() {
                if (!db) throw new Error('Database not opened in worker');
                
                let totalBytes = 0;
                const storeNames = Array.from(db.objectStoreNames);
                
                for (const storeName of storeNames) {
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    const records = await new Promise((resolve, reject) => {
                        const request = store.getAll();
                        request.onsuccess = () => resolve(request.result);
                        request.onerror = () => reject(request.error);
                    });
                    
                    for (const record of records) {
                        try {
                            if (record instanceof Blob) {
                                totalBytes += record.size;
                            } else if (typeof record === "object") {
                                totalBytes += new Blob([JSON.stringify(record)]).size;
                            } else {
                                totalBytes += new Blob([String(record)]).size;
                            }
                        } catch {
                            totalBytes += 0;
                        }
                    }
                }
                
                return totalBytes / (1024 * 1024);
            }

            async function complexQuery(tableName, queryType, params) {
                if (!db) throw new Error('Database not opened in worker');
                
                const transaction = db.transaction([tableName], 'readonly');
                const store = transaction.objectStore(tableName);
                
                switch (queryType) {
                    case 'FILTER_LARGE_DATASET':
                        const allRecords = await new Promise((resolve, reject) => {
                            const request = store.getAll();
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                        
                        const filterFn = new Function('record', 'params', params.filterCode);
                        return allRecords.filter(record => filterFn(record, params.filterParams));
                        
                    case 'AGGREGATE':
                        const records = await new Promise((resolve, reject) => {
                            const request = store.getAll();
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                        
                        const aggregateFn = new Function('records', 'params', params.aggregateCode);
                        return aggregateFn(records, params.aggregateParams);
                        
                    default:
                        throw new Error('Unknown query type');
                }
            }

            self.onmessage = async function(event) {
                const { id, type, payload } = event.data;
                
                try {
                    let result;
                    
                    switch (type) {
                        case 'INIT_DB':
                            dbName = payload.name;
                            dbVersion = payload.version;
                            await openDatabase(dbName, dbVersion);
                            result = 'Database initialized';
                            break;
                            
                        case 'BULK_INSERT':
                            result = await bulkInsert(payload.tableName, payload.data);
                            break;
                            
                        case 'BULK_UPDATE':
                            result = await bulkUpdate(payload.tableName, payload.updates);
                            break;
                            
                        case 'BULK_DELETE':
                            result = await bulkDelete(payload.tableName, payload.keys);
                            break;
                            
                        case 'GET_SIZE':
                            result = await getDatabaseSize();
                            break;
                            
                        case 'COMPLEX_QUERY':
                            result = await complexQuery(payload.tableName, payload.queryType, payload.params);
                            break;
                            
                        default:
                            throw new Error('Unknown message type: ' + type);
                    }
                    
                    self.postMessage({
                        id,
                        success: true,
                        data: result
                    });
                    
                } catch (error) {
                    self.postMessage({
                        id,
                        success: false,
                        error: error.message
                    });
                }
            };
        `;

        const blob = new Blob([workerScript], { type: 'application/javascript' });
        this._worker = new Worker(URL.createObjectURL(blob));
        
        this._worker.onmessage = (event) => {
            const response: WorkerResponse = event.data;
            const promise = this._workerPromises.get(response.id);
            
            if (promise) {
                this._workerPromises.delete(response.id);
                
                if (response.success) {
                    promise.resolve(response.data);
                } else {
                    promise.reject(new Error(response.error));
                }
            }
        };
        
        this._worker.onerror = (error) => {
            console.error('Worker error:', error);
        };
    }

    private async _sendToWorker(type: string, payload: any): Promise<any> {
        if (!this._worker) {
            throw new Error('Worker not initialized');
        }
        
        const id = Math.random().toString(36).substr(2, 9);
        
        return new Promise((resolve, reject) => {
            this._workerPromises.set(id, { resolve, reject });
            
            this._worker!.postMessage({
                id,
                type,
                payload
            });
            
            setTimeout(() => {
                if (this._workerPromises.has(id)) {
                    this._workerPromises.delete(id);
                    reject(new Error('Worker operation timeout'));
                }
            }, 30000);
        });
    }

    private _open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.name, this.version);

            request.onupgradeneeded = () => {
                this._db = request.result;
                console.log("onupgradeneeded fired, current version:", this.version);
                
                for (const [tableName, tableProps] of this._pendingTables) {
                    if (!this._db.objectStoreNames.contains(tableName)) {
                        this._db.createObjectStore(tableName, { 
                            keyPath: tableProps.primary,
                            autoIncrement: false 
                        });
                        console.log(`Created object store: ${tableName}`);
                    }
                }
            };

            request.onsuccess = () => {
                this._db = request.result;
                this.version = this._db.version;
                resolve(this._db);
            };

            request.onerror = () => {
                reject(request.error);
            };

            request.onblocked = () => {
                console.warn("Database upgrade blocked. Close other tabs/windows using this database.");
            };
        });
    }

    public async init(): Promise<void> {
        this._db = await this._open();
        
        await this._sendToWorker('INIT_DB', {
            name: this.name,
            version: this.version
        });
        
        for (const [tableName, tableProps] of this._pendingTables) {
            const table = new Table(tableProps, this);
            await table.init();
            this.tables.set(tableName, table);
        }
        this._pendingTables.clear();
    }

    public createTable<
        TName extends string,
        TData extends TableSchema
    >(
        props: ITypedTable<TData> & { name: TName }
    ): Database<TSchema & Record<TName, TData>> {
        if (this.tables.has(props.name)) {
            throw new Error(`Table '${props.name}' already exists`);
        }
        
        if (this._db && this._db.objectStoreNames.contains(props.name)) {
            throw new Error(`Object store '${props.name}' already exists in database`);
        }
        
        this._pendingTables.set(props.name, props);
        
        if (this._db) {
            this._db.close();
            this.version++;
            this._db = null;
        }

        return this as any;
    }

    public async addTable<
        TName extends string,
        TData extends TableSchema
    >(
        props: ITypedTable<TData> & { name: TName }
    ): Promise<Database<TSchema & Record<TName, TData>>> {
        if (this.tables.has(props.name)) {
            throw new Error(`Table '${props.name}' already exists`);
        }
        
        if (this._db && this._db.objectStoreNames.contains(props.name)) {
            throw new Error(`Object store '${props.name}' already exists in database`);
        }
        
        this._pendingTables.set(props.name, props);
        
        if (this._db) {
            console.log(`Creating new table '${props.name}'. Database will be upgraded.`);
            this._db.close();
            this.version++;
            this._db = null;
            
            await this.init();
        }

        return this as any;
    }

    public get<TName extends TableName<TSchema>>(
        tableName: TName
    ): Table<TSchema[TName]> | null {
        const table = this.tables.get(tableName);
        return table || null;
    }

    public getTable<TName extends TableName<TSchema>>(
        name: TName
    ): Table<TSchema[TName]> | null {
        return this.get(name);
    }

    public hasTable(name: string): boolean {
        return this.tables.has(name);
    }

    public async bulkInsert<TName extends TableName<TSchema>>(
        tableName: TName,
        dataArray: TSchema[TName][],
        useWorker: boolean = true
    ): Promise<Array<TSchema[TName][keyof TSchema[TName] & string]>> {
        if (useWorker) {
            return this._sendToWorker('BULK_INSERT', {
                tableName,
                data: dataArray
            });
        }
        
        const table = this.get(tableName);
        if (!table) throw new Error(`Table '${tableName}' not found`);
        return table.putMany(dataArray);
    }

    public async bulkUpdate<TName extends TableName<TSchema>>(
        tableName: TName,
        updates: Array<{
            key: TSchema[TName][keyof TSchema[TName] & string];
            data: Partial<TSchema[TName]>;
        }>,
        useWorker: boolean = true
    ): Promise<any[]> {
        if (useWorker) {
            return this._sendToWorker('BULK_UPDATE', {
                tableName,
                updates
            });
        }
        
        const table = this.get(tableName);
        if (!table) throw new Error(`Table '${tableName}' not found`);
        
        const results = [];
        for (const update of updates) {
            const result = await table.update(update.key, update.data);
            results.push(result);
        }
        return results;
    }

    public async bulkDelete<TName extends TableName<TSchema>>(
        tableName: TName,
        keys: Array<TSchema[TName][keyof TSchema[TName] & string]>,
        useWorker: boolean = true
    ): Promise<void> {
        if (useWorker && keys.length > 50) {
            await this._sendToWorker('BULK_DELETE', {
                tableName,
                keys
            });
            return;
        }
        
        const table = this.get(tableName);
        if (!table) throw new Error(`Table '${tableName}' not found`);
        await table.deleteMany(keys);
    }

    public async getDatabaseSizeMB(useWorker: boolean = true): Promise<number> {
        if (useWorker) {
            return this._sendToWorker('GET_SIZE', {});
        }
        
        if (!this._db) {
            throw new Error("Database not initialized. Call init() first.");
        }

        let totalBytes = 0;
        const storeNames = Array.from(this._db.objectStoreNames);

        for (const storeName of storeNames) {
            totalBytes += await new Promise<number>((resolve, reject) => {
                const tx = this._db!.transaction(storeName, "readonly");
                const store = tx.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => {
                    let bytes = 0;

                    for (const record of request.result) {
                        try {
                            if (record instanceof Blob) {
                                bytes += record.size;
                            } else if (typeof record === "object") {
                                bytes += new Blob([JSON.stringify(record)]).size;
                            } else {
                                bytes += new Blob([String(record)]).size;
                            }
                        } catch {
                            bytes += 0;
                        }
                    }

                    resolve(bytes);
                };

                request.onerror = () => reject(request.error);
            });
        }

        return totalBytes / (1024 * 1024);
    }

    public async complexQuery<TName extends TableName<TSchema>>(
        tableName: TName,
        queryType: 'FILTER_LARGE_DATASET' | 'AGGREGATE',
        params: any,
        useWorker: boolean = true
    ): Promise<any> {
        if (useWorker) {
            return this._sendToWorker('COMPLEX_QUERY', {
                tableName,
                queryType,
                params
            });
        }
        
        const table = this.get(tableName);
        if (!table) throw new Error(`Table '${tableName}' not found`);
        return table.getAll();
    }

    public get db(): IDBDatabase {
        if (!this._db) {
            throw new Error("Database not initialized. Call init() first.");
        }
        return this._db;
    }

    public async close(): Promise<void> {
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }

    public async deleteDatabase(): Promise<void> {
        await this.close();
        
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.name);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        });
    }

    public getAllTables(): { [K in TableName<TSchema>]: Table<TSchema[K]> } {
        const result: any = {};
        for (const [name, table] of this.tables) {
            result[name] = table;
        }
        return result;
    }

    public getTableNames(): Array<TableName<TSchema>> {
        return Array.from(this.tables.keys()) as Array<TableName<TSchema>>;
    }
}