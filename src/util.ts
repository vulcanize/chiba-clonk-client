import dagCBOR from 'ipld-dag-cbor';

/**
 * Utils
 */
export class Util {
  /**
   * Sorts JSON object.
   */
  static sortJSON(object: any) {
    if (object instanceof Array) {
      for (let i = 0; i < object.length; i++) {
        object[i] = Util.sortJSON(object[i]);
      }
      return object;
    }
    if (typeof object !== 'object' || object === null) return object;

    let keys = Object.keys(object);
    keys = keys.sort();
    const newObject: {[key: string]: any} = {};

    for (let i = 0; i < keys.length; i++) {
      newObject[keys[i]] = Util.sortJSON(object[keys[i]]);
    }
    return newObject;
  }

  /**
   * Marshal object into gql 'attributes' variable.
   */
  static toGQLAttributes(object: any) {
    const vars: any[] = [];

    Object.keys(object).forEach(key => {
      let type: string = typeof object[key];
      if (object[key] === null) {
        vars.push({ key, value: { 'null': true } });
      } else if (type === 'number') {
        type = (object[key] % 1 === 0) ? 'int' : 'float';
        vars.push({ key, value: { [type]: object[key] } });
      } else if (type === 'string') {
        vars.push({ key, value: { 'string': object[key] } });
      } else if (type === 'boolean') {
        vars.push({ key, value: { 'boolean': object[key] } });
      } else if (type === 'object') {
        const nestedObject = object[key];
        if (nestedObject['/'] !== undefined) {
          vars.push({ key, value: { 'reference': { id: nestedObject['/'] } } });
        }
      }
    });

    return vars;
  }

  /**
   * Unmarshal attributes array to object.
   */
  static fromGQLAttributes(attributes: any[] = []) {
    const res: {[key: string]: any} = {};

    attributes.forEach(attr => {
      if (attr.value.null) {
        res[attr.key] = null;
      } else if (attr.value.json) {
        res[attr.key] = JSON.parse(attr.value.json);
      } else if (attr.value.reference) {
        // Convert GQL reference to IPLD style link.
        const ref = attr.value.reference;
        res[attr.key] = { '/': ref.id };
      } else {
        const { values, null: n, ...types } = attr.value;
        const value = Object.values(types).find(v => v !== null);
        res[attr.key] = value;
      }
    });

    return res;
  }

  /**
   * Get record content ID.
   */
   static async getContentId(record: any) {
    const content = dagCBOR.util.serialize(record);
    const cid = await dagCBOR.util.cid(content);

    return cid.toString();
  }
}
