import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'jurisai-13ad0';

/**
 * Converts a standard value to its Firestore REST representation
 */
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) {
    return { nullValue: null };
  }
  if (typeof val === 'string') {
    return { stringValue: val };
  }
  if (typeof val === 'number') {
    if (Number.isInteger(val)) {
      return { integerValue: String(val) };
    }
    return { doubleValue: val };
  }
  if (typeof val === 'boolean') {
    return { booleanValue: val };
  }
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return {
      mapValue: {
        fields
      }
    };
  }
  return { stringValue: String(val) };
}

/**
 * Converts a standard JSON object into the Firestore REST API fields schema
 */
export function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

/**
 * Converts a Firestore REST field value back to standard JS type
 */
function fromFirestoreValue(fieldVal: any): any {
  if (!fieldVal) return null;
  if ('stringValue' in fieldVal) return fieldVal.stringValue;
  if ('integerValue' in fieldVal) return parseInt(fieldVal.integerValue, 10);
  if ('doubleValue' in fieldVal) return parseFloat(fieldVal.doubleValue);
  if ('booleanValue' in fieldVal) return fieldVal.booleanValue;
  if ('nullValue' in fieldVal) return null;
  if ('arrayValue' in fieldVal) {
    const vals = fieldVal.arrayValue.values || [];
    return vals.map(fromFirestoreValue);
  }
  if ('mapValue' in fieldVal) {
    const fields = fieldVal.mapValue.fields || {};
    const obj: any = {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

/**
 * Converts Firestore REST fields dictionary back to standard JSON object
 */
export function fromFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const obj: Record<string, any> = {};
  if (!fields) return obj;
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

/**
 * Writes (upserts) a document in Firestore using the client's ID Token (overwrites document)
 */
export async function writeFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, any>,
  idToken: string
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const fields = toFirestoreFields(data);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore REST PATCH failed for ${collection}/${docId}: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Updates specific fields of a document in Firestore (PATCH merge) using updateMask
 */
export async function updateFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, any>,
  fieldPaths: string[],
  idToken: string
): Promise<void> {
  const queryParams = fieldPaths.map(k => `updateMask.fieldPaths=${k}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}?${queryParams}`;
  
  const fields = toFirestoreFields(data);

  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ fields })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore REST UPDATE failed for ${collection}/${docId}: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Reads a document from Firestore using the client's ID Token
 */
export async function getFirestoreDoc(
  collection: string,
  docId: string,
  idToken: string
): Promise<any | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`Firestore REST GET failed for ${collection}/${docId}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const resData = await response.json();
  return fromFirestoreFields(resData.fields);
}

/**
 * Deletes a document in Firestore using the client's ID Token
 */
export async function deleteFirestoreDoc(
  collection: string,
  docId: string,
  idToken: string
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Firestore REST DELETE failed for ${collection}/${docId}: ${response.status} ${response.statusText} - ${errorText}`);
  }
}

/**
 * Queries a collection in Firestore for documents matching a specific field value using the client's ID Token
 */
export async function queryFirestoreCollection(
  collection: string,
  filterField: string,
  filterValue: string,
  idToken: string,
  additionalFilter?: { field: string; value: string }
): Promise<any[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

  let whereClause: any;

  if (additionalFilter) {
    // Composite AND filter (needed for Firestore security rules requiring userId in query)
    whereClause = {
      compositeFilter: {
        op: 'AND',
        filters: [
          {
            fieldFilter: {
              field: { fieldPath: filterField },
              op: 'EQUAL',
              value: { stringValue: filterValue }
            }
          },
          {
            fieldFilter: {
              field: { fieldPath: additionalFilter.field },
              op: 'EQUAL',
              value: { stringValue: additionalFilter.value }
            }
          }
        ]
      }
    };
  } else {
    whereClause = {
      fieldFilter: {
        field: { fieldPath: filterField },
        op: 'EQUAL',
        value: { stringValue: filterValue }
      }
    };
  }

  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: whereClause
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore REST runQuery failed for ${collection} filter ${filterField}=${filterValue}: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const resData = await response.json();
  
  if (!Array.isArray(resData)) return [];

  const results: any[] = [];
  for (const item of resData) {
    if (item.document && item.document.fields) {
      results.push(fromFirestoreFields(item.document.fields));
    }
  }

  return results;
}
