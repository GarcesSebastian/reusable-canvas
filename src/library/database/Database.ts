import { Table } from "./_common/Table";
import { ITable } from "./_common/Table";

export type TableSchema = Record<string, any>;
export type TableName<T extends Record<string, TableSchema>> = keyof T & string;

export interface ITypedTable<T extends TableSchema = any> extends ITable {
    name: string;
    primary: keyof T & string;
    schema?: T;
}

export class Database<TSchema extends Record<string, TableSchema> = {}> {
    private _db: IDBDatabase | null = null;

    public name: string;
    public version: number;
    public tables: Map<string, Table<any>> = new Map();
    private _pendingTables: Map<string, ITypedTable<any>> = new Map();

    public constructor(name: string, version: number = 1) {
        this.name = name;
        this.version = version;
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

    /**
     * Calculates the approximate size of the database in MB.
     * Iterates through all object stores and sums the size of stored records.
     */
    public async getDatabaseSizeMB(): Promise<number> {
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
    

    public get db(): IDBDatabase {
        if (!this._db) {
            throw new Error("Database not initialized. Call init() first.");
        }
        return this._db;
    }

    public async close(): Promise<void> {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
    }

    public async deleteDatabase(): Promise<void> {
        if (this._db) {
            this._db.close();
            this._db = null;
        }
        
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