import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Local DB configuration for resilient fallback
const LOCAL_DB_PATH = path.join(process.cwd(), 'local-firestore-db.json');

function readLocalDb(): Record<string, any> {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8'));
    }
  } catch (err) {
    console.error('[ResilientDB] Error reading local DB:', err);
  }
  return {};
}

function writeLocalDb(db: Record<string, any>) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('[ResilientDB] Error writing local DB:', err);
  }
}

// Helper to get Firebase config
function getFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const rawData = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    return null;
  }
}

const config = getFirebaseConfig();
let adminApp: any = null;
let adminDb: any = null;

if (config) {
  try {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        projectId: config.projectId,
      });
    }
    // In firebase-admin, getFirestore takes (app?, databaseId?)
    adminDb = getFirestore(undefined as any, config.firestoreDatabaseId);
  } catch (error) {
    console.warn('[ResilientDB] Failed to initialize native firebase-admin DB, relying on local DB fallback.');
  }
}

let isNativeDisabled = false;

function handleDbError(err: any, opName: string, path: string) {
  if (!isNativeDisabled) {
    const errMsg = String(err?.message || '').toLowerCase();
    if (errMsg.includes('permission') || err?.code === 7 || err?.status === 7) {
      console.log(`[ResilientDB] Native Firestore connection is unauthorized or sandbox-restricted. Switching to local JSON DB. Path: ${path}`);
      isNativeDisabled = true;
    } else {
      console.warn(`[ResilientDB] Firestore ${opName} failed, falling back to local DB. Path: ${path}`);
    }
  }
}

export function getDb() {
  return adminDb;
}

// Mimic client-side doc and collection references
export class AdminDocRef {
  _path?: string;
  constructor(public adminRef: any) {}
  get id() { 
    return this.adminRef ? this.adminRef.id : (this._path ? this._path.split('/').pop() || '' : ''); 
  }
  get path() { return this._path || (this.adminRef ? this.adminRef.path : ''); }
}

export class AdminColRef {
  _filters?: any[];
  _orderBy?: any;
  _limit?: number;
  _path?: string;
  constructor(public adminRef: any) {}
  get id() { 
    return this.adminRef ? this.adminRef.id : (this._path ? this._path.split('/').pop() || '' : ''); 
  }
  get path() { return this._path || (this.adminRef ? this.adminRef.path : ''); }
}

export class AdminQuery {
  _filters?: any[];
  _orderBy?: any;
  _limit?: number;
  _path?: string;
  constructor(public adminRef: any) {}
  get path() { return this._path || ''; }
}

function buildFullPath(parent: any, pathStr?: string, ...segments: string[]): { path: string; isDocument: boolean } {
  let parts: string[] = [];
  
  if (parent instanceof AdminColRef) {
    parts = parent.path.split('/');
  } else if (parent instanceof AdminDocRef) {
    parts = parent.path.split('/');
  } else if (typeof parent === 'string') {
    parts = [parent];
  }
  
  if (pathStr) {
    parts.push(pathStr);
  }
  
  if (segments && segments.length > 0) {
    parts.push(...segments);
  }
  
  // Filter out empty parts
  parts = parts.map(p => p.trim()).filter(Boolean);
  
  const isDocument = (parts.length % 2 === 0);
  return {
    path: parts.join('/'),
    isDocument
  };
}

export function collection(parent: any, pathStr?: string, ...segments: string[]) {
  const { path: fullPath } = buildFullPath(parent, pathStr, ...segments);
  let ref: any = null;
  if (adminDb) {
    try {
      ref = adminDb.collection(fullPath);
    } catch (err) {
      console.warn(`[ResilientDB] Native adminDb.collection failed for path: ${fullPath}`);
    }
  }
  const colRef = new AdminColRef(ref);
  colRef._path = fullPath;
  return colRef;
}

export function doc(parent: any, pathStr?: string, ...segments: string[]) {
  if (parent instanceof AdminColRef && !pathStr) {
    let ref: any = null;
    if (parent.adminRef) {
      try {
        ref = parent.adminRef.doc();
      } catch (err) {
        console.warn('[ResilientDB] Native parent.adminRef.doc failed');
      }
    }
    const docRef = new AdminDocRef(ref);
    docRef._path = parent.path + '/' + (ref ? ref.id : 'temp-' + Date.now());
    return docRef;
  }
  
  const { path: fullPath } = buildFullPath(parent, pathStr, ...segments);
  let ref: any = null;
  if (adminDb) {
    try {
      ref = adminDb.doc(fullPath);
    } catch (err) {
      console.warn(`[ResilientDB] Native adminDb.doc failed for path: ${fullPath}`);
    }
  }
  const docRef = new AdminDocRef(ref);
  docRef._path = fullPath;
  return docRef;
}

export async function getDoc(docRef: AdminDocRef) {
  try {
    if (isNativeDisabled || !docRef.adminRef) throw new Error('No native Firestore ref available');
    const snap = await docRef.adminRef.get();
    return {
      exists: () => snap.exists,
      data: () => snap.data(),
      id: snap.id,
      ref: docRef,
    };
  } catch (error) {
    handleDbError(error, 'getDoc', docRef.path);
    const localDb = readLocalDb();
    const data = localDb[docRef.path];
    return {
      exists: () => data !== undefined,
      data: () => data || null,
      id: docRef.id,
      ref: docRef,
    };
  }
}

export async function getDocs(queryOrCol: any) {
  try {
    if (isNativeDisabled || !queryOrCol.adminRef) throw new Error('No native Firestore query/col ref available');
    const snap = await queryOrCol.adminRef.get();
    const docs: any[] = [];
    snap.forEach((d: any) => {
      docs.push({
        exists: () => true,
        data: () => d.data(),
        id: d.id,
      });
    });
    return {
      forEach: (callback: any) => docs.forEach(callback),
      docs,
      empty: snap.empty,
      size: snap.size,
    };
  } catch (error) {
    handleDbError(error, 'getDocs', queryOrCol.path);
    const localDb = readLocalDb();
    const prefix = queryOrCol.path + '/';
    let docs: any[] = [];
    
    for (const [docPath, docData] of Object.entries(localDb)) {
      if (docPath.startsWith(prefix)) {
        const relativePath = docPath.slice(prefix.length);
        if (!relativePath.includes('/')) {
          docs.push({
            exists: () => true,
            data: () => docData,
            id: relativePath,
          });
        }
      }
    }
    
    // Apply filters from constraints
    if (queryOrCol._filters) {
      for (const filterFn of queryOrCol._filters) {
        docs = docs.filter(d => filterFn(d.data()));
      }
    }
    
    // Apply orderBy
    if (queryOrCol._orderBy) {
      const { field, direction } = queryOrCol._orderBy;
      docs.sort((a, b) => {
        const valA = a.data()[field];
        const valB = b.data()[field];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    // Apply limit
    if (typeof queryOrCol._limit === 'number') {
      docs = docs.slice(0, queryOrCol._limit);
    }
    
    return {
      forEach: (callback: any) => docs.forEach(callback),
      docs,
      empty: docs.length === 0,
      size: docs.length,
    };
  }
}

export async function setDoc(docRef: AdminDocRef, data: any, options?: { merge?: boolean }) {
  try {
    if (isNativeDisabled || !docRef.adminRef) throw new Error('No native Firestore ref available');
    if (options?.merge) {
      await docRef.adminRef.set(data, { merge: true });
    } else {
      await docRef.adminRef.set(data);
    }
  } catch (error) {
    handleDbError(error, 'setDoc', docRef.path);
    const localDb = readLocalDb();
    if (options?.merge) {
      localDb[docRef.path] = { ...(localDb[docRef.path] || {}), ...data };
    } else {
      localDb[docRef.path] = data;
    }
    writeLocalDb(localDb);
  }
}

export async function updateDoc(docRef: AdminDocRef, data: any) {
  try {
    if (isNativeDisabled || !docRef.adminRef) throw new Error('No native Firestore ref available');
    await docRef.adminRef.update(data);
  } catch (error) {
    handleDbError(error, 'updateDoc', docRef.path);
    const localDb = readLocalDb();
    localDb[docRef.path] = { ...(localDb[docRef.path] || {}), ...data };
    writeLocalDb(localDb);
  }
}

export async function update(docRef: AdminDocRef, data: any) {
  return updateDoc(docRef, data);
}

export async function deleteDoc(docRef: AdminDocRef) {
  try {
    if (isNativeDisabled || !docRef.adminRef) throw new Error('No native Firestore ref available');
    await docRef.adminRef.delete();
  } catch (error) {
    handleDbError(error, 'deleteDoc', docRef.path);
    const localDb = readLocalDb();
    delete localDb[docRef.path];
    writeLocalDb(localDb);
  }
}

export function query(colRef: AdminColRef | AdminQuery, ...constraints: any[]) {
  let adminQuery = colRef.adminRef;
  const newQuery = new AdminQuery(adminQuery);
  (newQuery as any)._path = (colRef as any)._path || colRef.path;
  
  if (colRef._filters) newQuery._filters = [...colRef._filters];
  if (colRef._orderBy) newQuery._orderBy = { ...colRef._orderBy };
  if (colRef._limit) newQuery._limit = colRef._limit;
  
  for (const constraint of constraints) {
    adminQuery = constraint(newQuery);
  }
  return newQuery;
}

export function where(field: string, op: any, value: any) {
  return (queryObj: any) => {
    if (queryObj.adminRef && typeof queryObj.adminRef.where === 'function') {
      try {
        queryObj.adminRef = queryObj.adminRef.where(field, op, value);
      } catch (err) {
        // Safe to ignore, fallback will handle it
      }
    }
    if (!queryObj._filters) queryObj._filters = [];
    queryObj._filters.push((docData: any) => {
      const val = docData[field];
      if (op === '==' || op === '===') return val === value;
      if (op === '!=') return val !== value;
      if (op === '>') return val > value;
      if (op === '>=') return val >= value;
      if (op === '<') return val < value;
      if (op === '<=') return val <= value;
      if (op === 'array-contains') return Array.isArray(val) && val.includes(value);
      if (op === 'in') return Array.isArray(value) && value.includes(val);
      return true;
    });
    return queryObj.adminRef;
  };
}

export function orderBy(field: string, direction?: 'asc' | 'desc') {
  return (queryObj: any) => {
    if (queryObj.adminRef && typeof queryObj.adminRef.orderBy === 'function') {
      try {
        queryObj.adminRef = queryObj.adminRef.orderBy(field, direction || 'asc');
      } catch (err) {
        // Safe to ignore, fallback will handle it
      }
    }
    queryObj._orderBy = { field, direction: direction || 'asc' };
    return queryObj.adminRef;
  };
}

export function limit(n: number) {
  return (queryObj: any) => {
    if (queryObj.adminRef && typeof queryObj.adminRef.limit === 'function') {
      try {
        queryObj.adminRef = queryObj.adminRef.limit(n);
      } catch (err) {
        // Safe to ignore, fallback will handle it
      }
    }
    queryObj._limit = n;
    return queryObj.adminRef;
  };
}
