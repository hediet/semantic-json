import { sObject, sString, sNumber, field } from ".";
import { sArray, sUndefined, sDowncast } from "./exportedSerializer";
import { Serializer } from "./Serializer";

const foo = sObject({
	username: field({ type: sString, optional: { withDefault: "test" } }),
	bla: sString.or(sNumber),
	baz: sDowncast<number>(),
	arr: sArray(sNumber),
});
const arr = sArray(foo);

export type JSONObject = { [key: string]: JSONValue | undefined };
export interface JSONArray extends Array<JSONValue> {}
export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONObject
	| JSONArray;

const s2: Serializer<any, JSONValue> = arr;

//s.deserializeTyped(4);

console.log(
	arr.deserialize([
		{
			bla: 10,
		},
	])
);

/*if (arr.is(x)) {
    x[0].
}
arr.deserialize([{ username: "test" }])[0].;
*/
