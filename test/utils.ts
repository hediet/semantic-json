import { Serializer, JSONValue, DeserializeError } from "../src";
import { deepEqual, equal } from "assert";

export interface ErrorMessage {
	msg: string;
	path: string;
	alternatives?: {
		alternativeId: string;
		errors: ErrorMessage[];
	}[];
}

export function mapDeserializeError(e: DeserializeError): ErrorMessage {
	return {
		msg: e.message,
		path: e.path.join("/"),
		...(e.alternatives.length > 0
			? {
					alternatives: e.alternatives.map((a) => ({
						alternativeId: a.alternativeId,
						errors: a.errors.map(mapDeserializeError),
					})),
			  }
			: {}),
	};
}

export function deserializeJson<T>(
	serializer: Serializer<T>,
	json: JSONValue
): { value: T; errors: ErrorMessage[] } {
	const r = serializer.deserialize(json);
	return {
		value: r.value,
		errors: r.errors.map(mapDeserializeError),
	};
}

export function testSerialize<T>(options: {
	name?: string;
	serializer: Serializer<T>;
	value: T;
	expectedResult: JSONValue;
}) {
	const { name, serializer, value, expectedResult } = options;
	it(name || "Serialize to " + JSON.stringify(expectedResult), () => {
		const json = serializer.serialize(value);
		deepEqual(json, expectedResult);
	});
}
