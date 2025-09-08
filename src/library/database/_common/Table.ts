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
        if (keys.length > 100) {
            const batchSize = 50;
            const results: Array<TData | undefined> = [];
            
            for (let i = 0; i < keys.length; i += batchSize) {
                const batch = keys.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(key => this.get(key)));
                results.push(...batchResults);
            }
            
            return results;
        }
        
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

    public async putMany(
        dataArray: TData[], 
        useWorker: boolean = true,
        batchSize: number = 100,
        onProgress?: (progress: { p: number; state: boolean }) => void
    ): Promise<Array<TData[keyof TData & string]>> {
        if (useWorker) {
            return (this.indexDB as any).bulkInsert(this.name, dataArray, true, onProgress);
        }
        
        if (dataArray.length > batchSize) {
            const results: Array<TData[keyof TData & string]> = [];
            const total = dataArray.length;
            let processedCount = 0;
            
            for (let i = 0; i < dataArray.length; i += batchSize) {
                const batch = dataArray.slice(i, i + batchSize);
                
                const batchResults = await new Promise<Array<TData[keyof TData & string]>>((resolve, reject) => {
                    const transaction = this.indexDB.db.transaction([this.name], 'readwrite');
                    const store = transaction.objectStore(this.name);
                    const promises: Array<TData[keyof TData & string]> = [];
                    let completed = 0;
                    let hasError = false;
                    
                    transaction.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(new Error('Transaction failed'));
                        }
                    };
                    
                    transaction.onabort = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(new Error('Transaction aborted'));
                        }
                    };
                    
                    batch.forEach((data, index) => {
                        const request = store.put(data);
                        
                        request.onsuccess = () => {
                            promises[index] = request.result as TData[keyof TData & string];
                            completed++;
                            processedCount++;
                            
                            if (completed === batch.length && !hasError) {
                                resolve(promises);
                            }
                        };
                        
                        request.onerror = () => {
                            if (!hasError) {
                                hasError = true;
                                reject(request.error);
                            }
                        };
                    });
                });
                
                results.push(...batchResults);
                
                if (onProgress) {
                    const progress = processedCount / total;
                    onProgress({ p: progress, state: true });
                }
                
                if (i + batchSize < dataArray.length) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            
            if (onProgress) {
                onProgress({ p: 1, state: false });
            }
            
            return results;
        }
        
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

    public async updateMany(
        updates: Array<{
            key: TData[keyof TData & string];
            data: Partial<TData>;
        }>,
        useWorker: boolean = true,
        batchSize: number = 50
    ): Promise<Array<TData | null>> {
        if (useWorker && updates.length > 50) {
            return (this.indexDB as any).bulkUpdate(this.name, updates, true);
        }
        
        if (updates.length > batchSize) {
            const results: Array<TData | null> = [];
            
            for (let i = 0; i < updates.length; i += batchSize) {
                const batch = updates.slice(i, i + batchSize);
                const batchResults = await Promise.all(
                    batch.map(update => this.update(update.key, update.data))
                );
                results.push(...batchResults);
                
                if (i + batchSize < updates.length) {
                    await new Promise(resolve => setTimeout(resolve, 1));
                }
            }
            
            return results;
        }
        
        const promises = updates.map(update => this.update(update.key, update.data));
        return Promise.all(promises);
    }

    public async delete(key: TData[keyof TData & string]): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readwrite');
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    public async deleteMany(
        keys: Array<TData[keyof TData & string]>,
        useWorker: boolean = true,
        batchSize: number = 50
    ): Promise<void> {
        if (useWorker && keys.length > 50) {
            await (this.indexDB as any).bulkDelete(this.name, keys, true);
            return;
        }
        
        if (keys.length > batchSize) {
            for (let i = 0; i < keys.length; i += batchSize) {
                const batch = keys.slice(i, i + batchSize);
                
                await new Promise<void>((resolve, reject) => {
                    const transaction = this.indexDB.db.transaction([this.name], 'readwrite');
                    const store = transaction.objectStore(this.name);
                    let completed = 0;
                    let hasError = false;
                    
                    transaction.onerror = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(new Error('Transaction failed'));
                        }
                    };
                    
                    transaction.onabort = () => {
                        if (!hasError) {
                            hasError = true;
                            reject(new Error('Transaction aborted'));
                        }
                    };
                    
                    batch.forEach(key => {
                        const request = store.delete(key);
                        
                        request.onsuccess = () => {
                            completed++;
                            if (completed === batch.length && !hasError) {
                                resolve();
                            }
                        };
                        
                        request.onerror = () => {
                            if (!hasError) {
                                hasError = true;
                                reject(request.error);
                            }
                        };
                    });
                });
                
                if (i + batchSize < keys.length) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            return;
        }
        
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

    public async find(
        predicate: (item: TData) => boolean,
        useWorker: boolean = true,
        limit?: number
    ): Promise<TData[]> {
        if (useWorker) {
            try {
                const filterCode = predicate.toString();
                const result = await (this.indexDB as any).complexQuery(
                    this.name,
                    'FILTER_LARGE_DATASET',
                    {
                        filterCode: `return (${filterCode})(record, params);`,
                        filterParams: {}
                    },
                    true
                );
                
                return limit ? result.slice(0, limit) : result;
            } catch (error) {
                console.warn('Worker filter failed, using normal method:', error);
            }
        }
        
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.openCursor();
            const results: TData[] = [];
            let count = 0;
            
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor && (!limit || count < limit)) {
                    const item = cursor.value as TData;
                    
                    if (predicate(item)) {
                        results.push(item);
                        count++;
                    }
                    
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    public async findOne(
        predicate: (item: TData) => boolean,
    ): Promise<TData | undefined> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.openCursor();
            
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    const item = cursor.value as TData;
                    
                    if (predicate(item)) {
                        resolve(item);
                        return;
                    }
                    
                    cursor.continue();
                } else {
                    resolve(undefined);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    public async getAllKeys(): Promise<Array<TData[keyof TData & string]>> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.getAllKeys();
            
            request.onsuccess = () => resolve(request.result as Array<TData[keyof TData & string]>);
            request.onerror = () => reject(request.error);
        });
    }

    public async forEach(
        callback: (item: TData, key: TData[keyof TData & string]) => void | Promise<void>,
        batchSize: number = 1000
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this._getStore('readonly');
            const request = store.openCursor();
            let processedCount = 0;
            
            request.onsuccess = async () => {
                const cursor = request.result;
                if (cursor) {
                    try {
                        await callback(cursor.value as TData, cursor.key as TData[keyof TData & string]);
                        processedCount++;
                        
                        if (processedCount % batchSize === 0) {
                            await new Promise(resolve => setTimeout(resolve, 1));
                        }
                        
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

    public async aggregate<TResult = any>(
        aggregateFunction: (records: TData[]) => TResult,
        useWorker: boolean = true
    ): Promise<TResult> {
        if (useWorker) {
            try {
                const aggregateCode = aggregateFunction.toString();
                return await (this.indexDB as any).complexQuery(
                    this.name,
                    'AGGREGATE',
                    {
                        aggregateCode: `return (${aggregateCode})(records, params);`,
                        aggregateParams: {}
                    },
                    true
                );
            } catch (error) {
                console.warn('Worker aggregate failed, using normal method:', error);
            }
        }
        
        const allRecords = await this.getAll();
        return aggregateFunction(allRecords);
    }

    public async getSize(): Promise<number> {
        const allRecords = await this.getAll();
        let totalBytes = 0;
        
        for (const record of allRecords) {
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
        
        return totalBytes / (1024 * 1024);
    }

    public async getStats(): Promise<{
        count: number;
        sizeMB: number;
        keys: Array<TData[keyof TData & string]>;
        sampleData?: TData;
    }> {
        const [count, sizeMB, keys, sampleData] = await Promise.all([
            this.count(),
            this.getSize(),
            this.getAllKeys(),
            this.getAllWithLimit(1)
        ]);
        
        return {
            count,
            sizeMB,
            keys,
            sampleData: sampleData[0] as TData
        };
    }

    public async import(
        data: TData[],
        options: {
            batchSize?: number;
            useWorker?: boolean;
            onProgress?: (processed: number, total: number) => void;
            clearBeforeImport?: boolean;
        } = {}
    ): Promise<void> {
        const {
            batchSize = 1000,
            useWorker = true,
            onProgress,
            clearBeforeImport = false
        } = options;
        
        if (clearBeforeImport) {
            await this.clear();
        }
        
        if (useWorker && data.length > 100) {
            if (onProgress) onProgress(0, data.length);
            await this.putMany(data, true, batchSize);
            if (onProgress) onProgress(data.length, data.length);
        } else {
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                await this.putMany(batch, false, batchSize);
                
                if (onProgress) {
                    onProgress(Math.min(i + batchSize, data.length), data.length);
                }
            }
        }
    }

    public async export(
        options: {
            format?: 'json' | 'csv';
            filter?: (item: TData) => boolean;
            limit?: number;
        } = {}
    ): Promise<string> {
        const { format = 'json', filter, limit } = options;
        
        let records = filter ? await this.find(filter, true, limit) : await this.getAllWithLimit(limit);
        
        if (format === 'json') {
            return JSON.stringify(records, null, 2);
        } else if (format === 'csv') {
            if (records.length === 0) return '';
            
            const headers = Object.keys(records[0] ?? {});
            const csvRows = [
                headers.join(','),
                ...records.map(record =>
                    headers.map(header =>
                        JSON.stringify(record[header] ?? '')
                    ).join(',')
                )
            ];
            
            return csvRows.join('\n');
        }
        
        return JSON.stringify(records);
    }
}