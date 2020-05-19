export type JSONObject = { [key: string]: JSONValue | undefined };
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONObject
	| JSONArray;

export type AsJSONValue<T extends JSONValue> = T;
